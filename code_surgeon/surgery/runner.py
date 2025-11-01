from __future__ import annotations
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from .selectors import select_by_line_range, select_by_regex_block, Selection
from .splicer import splice_fragment, SpliceResult
from .patchops import run_command, PostCheck
from .utils import read_text, write_text
from .rollback import RollbackManager, ChangeRecord
from .testing import TestRunner, TestResult

@dataclass
class Plan:
    file: str
    mode: str  # 'line-range' or 'regex-block'
    start: int | str
    end: int | str
    new_fragment_path: Optional[str] = None
    post_cmd: Optional[str] = None
    job_file: Optional[str] = None
    enable_rollback: bool = True
    enable_testing: bool = True

def execute(plan: Plan, keep_indent: bool = True, cwd: Optional[str] = None) -> dict:
    """
    Ejecuta plan de cirugía con rollback tracking y auto-testing integrados.
    
    Flujo de operación (Clase Mundial):
    1. Seleccionar región a modificar
    2. Aplicar cambio y crear backup
    3. Registrar cambio en historial (para rollback exacto)
    4. Ejecutar tests automáticamente
    5. Si tests fallan, hacer rollback automático
    6. Ejecutar post_cmd si existe
    """
    p = Path(plan.file)
    project_root = _find_project_root(p)
    
    # 1. Seleccionar región
    if plan.mode == "line-range":
        sel = select_by_line_range(p, int(plan.start), int(plan.end))
    elif plan.mode == "regex-block":
        sel = select_by_regex_block(p, str(plan.start), str(plan.end), include_markers=True)
    else:
        raise ValueError("Unknown mode")
    
    # Guardar contenido original para el registro
    original_content = read_text(p)
    
    # 2. Aplicar cambio
    new_fragment = Path(plan.new_fragment_path).read_text(encoding="utf-8") if plan.new_fragment_path else ""
    res: SpliceResult = splice_fragment(p, sel.pre, sel.mid, sel.post, new_fragment, keep_indent=keep_indent)
    
    out = {
        "ok": res.ok, 
        "message": res.message, 
        "diff": res.diff,
        "rollback_record": None,
        "test_result": None,
        "auto_rollback": False
    }
    
    if not res.ok:
        return out
    
    # 3. Registrar cambio para rollback (si está habilitado)
    if plan.enable_rollback:
        try:
            rollback_mgr = RollbackManager(project_root / "surgery")
            updated_content = read_text(p)
            
            record = ChangeRecord.create(
                file_path=p,
                original=original_content,
                updated=updated_content,
                mode=plan.mode,
                start=str(plan.start),
                end=str(plan.end),
                backup_path=res.backup_path,
                post_cmd=plan.post_cmd,
                post_result=None,  # Se actualiza después
                job_file=plan.job_file
            )
            
            record_path = rollback_mgr.record_change(record)
            out["rollback_record"] = str(record_path)
            
        except Exception as e:
            out["rollback_warning"] = f"⚠️  No se pudo crear registro de rollback: {e}"
    
    # 4. Ejecutar tests automáticamente (si está habilitado)
    test_passed = True
    if plan.enable_testing:
        try:
            test_runner = TestRunner(project_root)
            test_result: TestResult = test_runner.run_tests_for_file(p)
            
            out["test_result"] = {
                "ok": test_result.ok,
                "summary": test_result.summary(),
                "tests_run": test_result.tests_run,
                "tests_failed": test_result.tests_failed,
                "duration": test_result.duration_seconds,
                "output": test_result.output
            }
            
            test_passed = test_result.ok
            
            # 5. Rollback automático si los tests fallan
            if not test_passed and plan.enable_rollback:
                rollback_mgr = RollbackManager(project_root / "surgery")
                success, rollback_msg = rollback_mgr.rollback_last(p)
                
                out["auto_rollback"] = True
                out["rollback_message"] = rollback_msg
                out["ok"] = False
                out["message"] = (
                    f"❌ Tests fallaron. Rollback automático ejecutado.\n"
                    f"   {rollback_msg}\n"
                    f"   Tests: {test_result.summary()}"
                )
                
                return out
                
        except Exception as e:
            out["test_warning"] = f"⚠️  No se pudieron ejecutar tests: {e}"
    
    # 6. Ejecutar post_cmd (solo si tests pasaron)
    if plan.post_cmd and test_passed:
        check: PostCheck = run_command(plan.post_cmd, cwd=Path(cwd) if cwd else None)
        out["post_check_ok"] = check.ok
        out["post_check_output"] = check.output
        
        # Si post_cmd falla, también hacer rollback
        if not check.ok and plan.enable_rollback:
            rollback_mgr = RollbackManager(project_root / "surgery")
            success, rollback_msg = rollback_mgr.rollback_last(p)
            
            out["auto_rollback"] = True
            out["rollback_message"] = rollback_msg
            out["ok"] = False
            out["message"] = f"❌ Post-comando falló. Rollback automático: {rollback_msg}"
    
    # Mensaje de éxito completo
    if out["ok"] and test_passed:
        success_parts = [f"✅ {res.message}"]
        if out.get("test_result"):
            success_parts.append(f"   Tests: {out['test_result']['summary']}")
        if out.get("rollback_record"):
            success_parts.append(f"   Rollback disponible: {Path(out['rollback_record']).name}")
        
        out["message"] = "\n".join(success_parts)
    
    return out

def _find_project_root(file_path: Path) -> Path:
    """Encuentra la raíz del proyecto buscando package.json o .git"""
    current = file_path.parent if file_path.is_file() else file_path
    
    while current != current.parent:
        if (current / "package.json").exists() or (current / ".git").exists():
            return current
        current = current.parent
    
    # Fallback: usar directorio del archivo
    return file_path.parent if file_path.is_file() else file_path
