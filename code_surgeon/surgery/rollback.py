"""
Code Surgery Rollback System
Mantiene un registro detallado de todas las modificaciones para permitir rollback exacto.
Basado en mejores prácticas de clase mundial: Git-style versioning + audit trail.
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional
from .utils import read_text, write_text

@dataclass
class ChangeRecord:
    """Registro inmutable de un cambio de código"""
    timestamp: str
    file_path: str
    mode: str  # 'line-range' | 'regex-block'
    start_marker: str
    end_marker: str
    original_content: str
    new_content: str
    original_hash: str
    new_hash: str
    backup_path: str
    post_cmd: Optional[str]
    post_cmd_result: Optional[dict]
    job_file: Optional[str] = None
    
    @staticmethod
    def create(file_path: Path, original: str, updated: str, mode: str, 
               start: str, end: str, backup_path: Path, 
               post_cmd: Optional[str] = None, post_result: Optional[dict] = None,
               job_file: Optional[str] = None) -> ChangeRecord:
        """Factory method para crear un registro con hashes automáticos"""
        return ChangeRecord(
            timestamp=datetime.now(timezone.utc).isoformat(),
            file_path=str(file_path),
            mode=mode,
            start_marker=str(start),
            end_marker=str(end),
            original_content=original,
            new_content=updated,
            original_hash=hashlib.sha256(original.encode('utf-8')).hexdigest()[:12],
            new_hash=hashlib.sha256(updated.encode('utf-8')).hexdigest()[:12],
            backup_path=str(backup_path),
            post_cmd=post_cmd,
            post_cmd_result=post_result,
            job_file=job_file
        )
    
    def to_json(self) -> str:
        """Serializa el registro a JSON"""
        return json.dumps(asdict(self), indent=2, ensure_ascii=False)
    
    @staticmethod
    def from_json(json_str: str) -> ChangeRecord:
        """Deserializa desde JSON"""
        data = json.loads(json_str)
        return ChangeRecord(**data)


class RollbackManager:
    """Gestiona el historial de cambios y rollbacks"""
    
    def __init__(self, history_dir: Path):
        self.history_dir = history_dir
        self.history_dir.mkdir(parents=True, exist_ok=True)
        self.applied_dir = history_dir / "applied"
        self.applied_dir.mkdir(exist_ok=True)
        self.rollback_dir = history_dir / "rollback"
        self.rollback_dir.mkdir(exist_ok=True)
    
    def record_change(self, record: ChangeRecord) -> Path:
        """
        Guarda un registro de cambio con naming scheme cronológico
        Format: YYYYMMDD_HHMMSS_<file>_<hash>.json
        """
        timestamp = datetime.fromisoformat(record.timestamp).strftime("%Y%m%d_%H%M%S")
        safe_filename = Path(record.file_path).name.replace('.', '_')
        filename = f"{timestamp}_{safe_filename}_{record.new_hash}.json"
        
        record_path = self.applied_dir / filename
        write_text(record_path, record.to_json())
        
        return record_path
    
    def get_history(self, file_path: Optional[Path] = None) -> list[ChangeRecord]:
        """
        Retorna historial de cambios, opcionalmente filtrado por archivo
        Ordenado cronológicamente (más reciente primero)
        """
        records = []
        for json_file in sorted(self.applied_dir.glob("*.json"), reverse=True):
            record = ChangeRecord.from_json(read_text(json_file))
            if file_path is None or record.file_path == str(file_path):
                records.append(record)
        return records
    
    def rollback_last(self, file_path: Path) -> tuple[bool, str]:
        """
        Rollback del último cambio a un archivo específico
        Retorna (success, message)
        """
        history = self.get_history(file_path)
        if not history:
            return False, f"No hay historial de cambios para {file_path}"
        
        latest = history[0]
        return self.rollback_to_record(latest)
    
    def rollback_to_record(self, record: ChangeRecord) -> tuple[bool, str]:
        """
        Ejecuta rollback usando un ChangeRecord específico
        Restaura el contenido original y mueve el registro a rollback/
        """
        target = Path(record.file_path)
        
        # Verificar que el archivo actual coincida con el hash esperado
        current_content = read_text(target)
        current_hash = hashlib.sha256(current_content.encode('utf-8')).hexdigest()[:12]
        
        if current_hash != record.new_hash:
            return False, (
                f"⚠️  HASH MISMATCH: El archivo actual ({current_hash}) no coincide "
                f"con el hash registrado ({record.new_hash}). Posibles modificaciones manuales."
            )
        
        # Restaurar contenido original
        try:
            write_text(target, record.original_content)
            
            # Mover registro de applied/ a rollback/
            applied_files = list(self.applied_dir.glob(f"*_{record.new_hash}.json"))
            if applied_files:
                original_record = applied_files[0]
                rollback_record = self.rollback_dir / original_record.name
                original_record.rename(rollback_record)
            
            return True, (
                f"✅ Rollback exitoso de {target.name}\n"
                f"   Original hash: {record.original_hash}\n"
                f"   Rolled back hash: {record.new_hash}\n"
                f"   Timestamp: {record.timestamp}"
            )
        except Exception as e:
            return False, f"❌ Error durante rollback: {e}"
    
    def list_rollbackable(self) -> list[tuple[str, str, str]]:
        """
        Lista de cambios que pueden ser revertidos
        Retorna: [(timestamp, file, description)]
        """
        results = []
        for json_file in sorted(self.applied_dir.glob("*.json"), reverse=True):
            record = ChangeRecord.from_json(read_text(json_file))
            timestamp = datetime.fromisoformat(record.timestamp).strftime("%Y-%m-%d %H:%M:%S")
            file_name = Path(record.file_path).name
            desc = f"{record.mode} [{record.start_marker}...{record.end_marker}]"
            results.append((timestamp, file_name, desc))
        return results
    
    def verify_integrity(self) -> list[dict]:
        """
        Verifica integridad de todos los archivos con historial
        Retorna lista de discrepancias encontradas
        """
        issues = []
        for record in self.get_history():
            target = Path(record.file_path)
            if not target.exists():
                issues.append({
                    "file": record.file_path,
                    "issue": "FILE_MISSING",
                    "timestamp": record.timestamp
                })
                continue
            
            current_content = read_text(target)
            current_hash = hashlib.sha256(current_content.encode('utf-8')).hexdigest()[:12]
            
            if current_hash != record.new_hash:
                issues.append({
                    "file": record.file_path,
                    "issue": "HASH_MISMATCH",
                    "expected": record.new_hash,
                    "actual": current_hash,
                    "timestamp": record.timestamp
                })
        
        return issues
