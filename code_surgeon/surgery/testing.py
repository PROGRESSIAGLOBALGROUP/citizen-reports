"""
Test Integration System
Garantiza que después de cada modificación se ejecuten los tests correspondientes.
Basado en mejores prácticas: Continuous Testing + Fail-Fast + Test Impact Analysis.
"""
from __future__ import annotations
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
from .utils import read_text

@dataclass
class TestResult:
    """Resultado de ejecución de tests"""
    ok: bool
    output: str
    exit_code: int
    tests_run: int
    tests_failed: int
    duration_seconds: float
    
    def summary(self) -> str:
        status = "✅ PASS" if self.ok else "❌ FAIL"
        return (
            f"{status} - {self.tests_run} tests, {self.tests_failed} failed "
            f"({self.duration_seconds:.2f}s)"
        )


class TestRegistry:
    """
    Mapea archivos de código a sus tests correspondientes
    Sigue convenciones estándar de testing
    """
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.test_config_path = project_root / "code_surgeon" / "test_mapping.json"
        self.mapping = self._load_mapping()
    
    def _load_mapping(self) -> dict:
        """Carga mapeo de archivos -> tests desde JSON"""
        if self.test_config_path.exists():
            return json.loads(read_text(self.test_config_path))
        return {}
    
    def get_tests_for_file(self, file_path: Path) -> list[str]:
        """
        Retorna lista de archivos de test que deben ejecutarse para un archivo dado
        
        Estrategia multi-nivel:
        1. Mapping explícito (test_mapping.json)
        2. Convenciones estándar (server/app.js -> tests/backend/app.test.js)
        3. Test de integración por defecto si no se encuentra nada
        """
        relative_path = str(file_path.relative_to(self.project_root))
        
        # 1. Buscar en mapping explícito
        if relative_path in self.mapping:
            return self.mapping[relative_path]
        
        # 2. Aplicar convenciones estándar
        tests = self._infer_tests_by_convention(file_path)
        if tests:
            return tests
        
        # 3. Fallback a test suite completo por categoría
        return self._get_category_tests(file_path)
    
    def _infer_tests_by_convention(self, file_path: Path) -> list[str]:
        """
        Infiere tests basado en convenciones del proyecto
        
        Convenciones Jantetelco:
        - server/*.js -> tests/backend/*.test.js
        - client/src/*.jsx -> tests/frontend/*.test.jsx
        - scripts/*.py -> tests/scripts/*.test.py
        """
        tests = []
        relative_path = file_path.relative_to(self.project_root)
        
        # Backend (server/*.js)
        if relative_path.parts[0] == "server" and file_path.suffix == ".js":
            test_name = file_path.stem + ".test.js"
            test_path = self.project_root / "tests" / "backend" / test_name
            if test_path.exists():
                tests.append(str(test_path.relative_to(self.project_root)))
        
        # Frontend (client/src/*.jsx)
        elif relative_path.parts[0] == "client" and file_path.suffix in [".jsx", ".js"]:
            test_name = file_path.stem + ".test.jsx"
            test_path = self.project_root / "tests" / "frontend" / test_name
            if test_path.exists():
                tests.append(str(test_path.relative_to(self.project_root)))
        
        # Scripts Python
        elif relative_path.parts[0] == "scripts" and file_path.suffix == ".py":
            test_name = file_path.stem + ".test.py"
            test_path = self.project_root / "tests" / "scripts" / test_name
            if test_path.exists():
                tests.append(str(test_path.relative_to(self.project_root)))
        
        return tests
    
    def _get_category_tests(self, file_path: Path) -> list[str]:
        """
        Retorna suite completa de tests por categoría
        Último recurso cuando no se encuentran tests específicos
        """
        relative_path = file_path.relative_to(self.project_root)
        
        if relative_path.parts[0] == "server":
            return ["tests/backend"]
        elif relative_path.parts[0] == "client":
            return ["tests/frontend"]
        elif relative_path.parts[0] == "scripts":
            return ["tests/scripts"]
        else:
            # Ejecutar suite completa si no se puede categorizar
            return ["tests"]
    
    def add_mapping(self, file_path: Path, test_paths: list[str]):
        """Añade un mapeo explícito al registro"""
        relative_path = str(file_path.relative_to(self.project_root))
        self.mapping[relative_path] = test_paths
        self._save_mapping()
    
    def _save_mapping(self):
        """Persiste el mapeo a disco"""
        self.test_config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.test_config_path, 'w', encoding='utf-8') as f:
            json.dump(self.mapping, f, indent=2, ensure_ascii=False)


class TestRunner:
    """Ejecutor de tests con soporte para múltiples frameworks"""
    
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.registry = TestRegistry(project_root)
    
    def run_tests_for_file(self, file_path: Path) -> TestResult:
        """
        Ejecuta los tests correspondientes a un archivo modificado
        Retorna resultado agregado de todos los tests
        """
        test_paths = self.registry.get_tests_for_file(file_path)
        
        if not test_paths:
            return TestResult(
                ok=True,
                output="⚠️  No se encontraron tests específicos. Considera agregar tests.",
                exit_code=0,
                tests_run=0,
                tests_failed=0,
                duration_seconds=0.0
            )
        
        # Ejecutar tests según el tipo de archivo
        return self._run_test_suite(test_paths)
    
    def _run_test_suite(self, test_paths: list[str]) -> TestResult:
        """
        Ejecuta suite de tests usando el runner apropiado
        Detecta automáticamente: Jest (backend), Vitest (frontend), pytest (Python)
        """
        import time
        
        start_time = time.time()
        
        # Determinar runner basado en la ubicación de los tests
        if any("backend" in path for path in test_paths):
            result = self._run_jest(test_paths)
        elif any("frontend" in path for path in test_paths):
            result = self._run_vitest(test_paths)
        elif any(path.endswith(".py") for path in test_paths):
            result = self._run_pytest(test_paths)
        else:
            # Ejecutar npm run test:all como fallback
            result = self._run_npm_script("test:all")
        
        duration = time.time() - start_time
        result.duration_seconds = duration
        
        return result
    
    def _run_jest(self, test_paths: list[str]) -> TestResult:
        """Ejecuta tests backend con Jest"""
        try:
            cmd = ["npm", "run", "test:backend", "--", "--silent"]
            
            # Añadir paths específicos si no es todo el directorio
            if not any(path == "tests/backend" for path in test_paths):
                cmd.extend(test_paths)
            
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return self._parse_jest_output(result)
        except subprocess.TimeoutExpired:
            return TestResult(False, "❌ Timeout ejecutando tests (>60s)", -1, 0, 0, 60.0)
        except Exception as e:
            return TestResult(False, f"❌ Error ejecutando Jest: {e}", -1, 0, 0, 0.0)
    
    def _run_vitest(self, test_paths: list[str]) -> TestResult:
        """Ejecuta tests frontend con Vitest"""
        try:
            cmd = ["npm", "run", "test:frontend", "--", "--run"]
            
            if not any(path == "tests/frontend" for path in test_paths):
                cmd.extend(test_paths)
            
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return self._parse_vitest_output(result)
        except subprocess.TimeoutExpired:
            return TestResult(False, "❌ Timeout ejecutando tests (>60s)", -1, 0, 0, 60.0)
        except Exception as e:
            return TestResult(False, f"❌ Error ejecutando Vitest: {e}", -1, 0, 0, 0.0)
    
    def _run_pytest(self, test_paths: list[str]) -> TestResult:
        """Ejecuta tests Python con pytest"""
        try:
            cmd = ["pytest", "-v", "--tb=short"] + test_paths
            
            result = subprocess.run(
                cmd,
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=60
            )
            
            return self._parse_pytest_output(result)
        except subprocess.TimeoutExpired:
            return TestResult(False, "❌ Timeout ejecutando tests (>60s)", -1, 0, 0, 60.0)
        except Exception as e:
            return TestResult(False, f"❌ Error ejecutando pytest: {e}", -1, 0, 0, 0.0)
    
    def _run_npm_script(self, script: str) -> TestResult:
        """Ejecuta script de npm genérico"""
        try:
            result = subprocess.run(
                ["npm", "run", script],
                cwd=self.project_root,
                capture_output=True,
                text=True,
                timeout=120
            )
            
            return TestResult(
                ok=(result.returncode == 0),
                output=result.stdout + result.stderr,
                exit_code=result.returncode,
                tests_run=0,  # No podemos parsear sin conocer el formato
                tests_failed=0 if result.returncode == 0 else 1,
                duration_seconds=0.0
            )
        except Exception as e:
            return TestResult(False, f"❌ Error ejecutando npm script: {e}", -1, 0, 0, 0.0)
    
    def _parse_jest_output(self, result: subprocess.CompletedProcess) -> TestResult:
        """Parser de output de Jest"""
        output = result.stdout + result.stderr
        
        # Buscar línea de resumen: "Tests: 1 failed, 5 passed, 6 total"
        import re
        summary_match = re.search(r"Tests:\s+(?:(\d+)\s+failed,\s+)?(\d+)\s+passed,\s+(\d+)\s+total", output)
        
        if summary_match:
            failed = int(summary_match.group(1) or 0)
            passed = int(summary_match.group(2))
            total = int(summary_match.group(3))
            
            return TestResult(
                ok=(result.returncode == 0),
                output=output,
                exit_code=result.returncode,
                tests_run=total,
                tests_failed=failed,
                duration_seconds=0.0
            )
        
        # Fallback si no se puede parsear
        return TestResult(
            ok=(result.returncode == 0),
            output=output,
            exit_code=result.returncode,
            tests_run=0,
            tests_failed=0 if result.returncode == 0 else 1,
            duration_seconds=0.0
        )
    
    def _parse_vitest_output(self, result: subprocess.CompletedProcess) -> TestResult:
        """Parser de output de Vitest"""
        output = result.stdout + result.stderr
        
        # Vitest format: "Test Files  1 passed (1)"
        import re
        match = re.search(r"Test Files\s+(?:(\d+)\s+failed.*?)?(\d+)\s+passed", output)
        
        if match:
            failed = int(match.group(1) or 0)
            passed = int(match.group(2))
            
            return TestResult(
                ok=(result.returncode == 0),
                output=output,
                exit_code=result.returncode,
                tests_run=failed + passed,
                tests_failed=failed,
                duration_seconds=0.0
            )
        
        return TestResult(
            ok=(result.returncode == 0),
            output=output,
            exit_code=result.returncode,
            tests_run=0,
            tests_failed=0 if result.returncode == 0 else 1,
            duration_seconds=0.0
        )
    
    def _parse_pytest_output(self, result: subprocess.CompletedProcess) -> TestResult:
        """Parser de output de pytest"""
        output = result.stdout + result.stderr
        
        # pytest format: "5 passed, 1 failed in 2.34s"
        import re
        match = re.search(r"(\d+)\s+passed(?:,\s+(\d+)\s+failed)?", output)
        
        if match:
            passed = int(match.group(1))
            failed = int(match.group(2) or 0)
            
            return TestResult(
                ok=(result.returncode == 0),
                output=output,
                exit_code=result.returncode,
                tests_run=passed + failed,
                tests_failed=failed,
                duration_seconds=0.0
            )
        
        return TestResult(
            ok=(result.returncode == 0),
            output=output,
            exit_code=result.returncode,
            tests_run=0,
            tests_failed=0 if result.returncode == 0 else 1,
            duration_seconds=0.0
        )
