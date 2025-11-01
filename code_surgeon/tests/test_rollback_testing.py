"""
Test Suite para Code Surgeon - Rollback y Testing System
Valida que los nuevos componentes funcionen correctamente
"""
import unittest
import tempfile
import shutil
import sys
from pathlib import Path

# Añadir code_surgeon al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from surgery.rollback import RollbackManager, ChangeRecord
from surgery.testing import TestRegistry, TestRunner

class TestRollbackSystem(unittest.TestCase):
    """Tests para el sistema de rollback"""
    
    def setUp(self):
        """Setup temporal para cada test"""
        self.test_dir = Path(tempfile.mkdtemp())
        self.history_dir = self.test_dir / "surgery"
        self.mgr = RollbackManager(self.history_dir)
        
        # Crear archivo de test
        self.test_file = self.test_dir / "test_file.py"
        self.original_content = "def foo():\n    return 'original'\n"
        self.test_file.write_text(self.original_content)
    
    def tearDown(self):
        """Cleanup después de cada test"""
        shutil.rmtree(self.test_dir)
    
    def test_create_change_record(self):
        """Verifica creación de registro de cambio"""
        updated_content = "def foo():\n    return 'updated'\n"
        
        record = ChangeRecord.create(
            file_path=self.test_file,
            original=self.original_content,
            updated=updated_content,
            mode="line-range",
            start="1",
            end="2",
            backup_path=self.test_file.with_suffix(".bak"),
            post_cmd="python -m py_compile test_file.py"
        )
        
        self.assertEqual(record.file_path, str(self.test_file))
        self.assertEqual(record.original_content, self.original_content)
        self.assertEqual(record.new_content, updated_content)
        self.assertIsNotNone(record.original_hash)
        self.assertIsNotNone(record.new_hash)
        self.assertNotEqual(record.original_hash, record.new_hash)
    
    def test_record_change(self):
        """Verifica que se guarde el registro correctamente"""
        updated_content = "def foo():\n    return 'updated'\n"
        
        record = ChangeRecord.create(
            file_path=self.test_file,
            original=self.original_content,
            updated=updated_content,
            mode="line-range",
            start="1",
            end="2",
            backup_path=self.test_file.with_suffix(".bak")
        )
        
        record_path = self.mgr.record_change(record)
        
        self.assertTrue(record_path.exists())
        self.assertIn(record.new_hash, record_path.name)
    
    def test_get_history(self):
        """Verifica recuperación de historial"""
        # Crear dos cambios
        for i in range(2):
            updated_content = f"def foo():\n    return 'version_{i}'\n"
            record = ChangeRecord.create(
                file_path=self.test_file,
                original=self.original_content if i == 0 else f"def foo():\n    return 'version_{i-1}'\n",
                updated=updated_content,
                mode="line-range",
                start="1",
                end="2",
                backup_path=self.test_file.with_suffix(".bak")
            )
            self.mgr.record_change(record)
        
        history = self.mgr.get_history(self.test_file)
        
        self.assertEqual(len(history), 2)
        # Verificar que ambas versiones están en el historial
        contents = [h.new_content for h in history]
        self.assertTrue(any("version_0" in c for c in contents))
        self.assertTrue(any("version_1" in c for c in contents))
    
    def test_rollback_last(self):
        """Verifica rollback del último cambio"""
        updated_content = "def foo():\n    return 'updated'\n"
        
        # Aplicar cambio
        self.test_file.write_text(updated_content)
        
        # Registrar cambio
        record = ChangeRecord.create(
            file_path=self.test_file,
            original=self.original_content,
            updated=updated_content,
            mode="line-range",
            start="1",
            end="2",
            backup_path=self.test_file.with_suffix(".bak")
        )
        self.mgr.record_change(record)
        
        # Rollback
        success, message = self.mgr.rollback_last(self.test_file)
        
        self.assertTrue(success)
        self.assertIn("Rollback exitoso", message)
        self.assertEqual(self.test_file.read_text(), self.original_content)
    
    def test_hash_mismatch_detection(self):
        """Verifica detección de modificaciones manuales"""
        updated_content = "def foo():\n    return 'updated'\n"
        
        # Aplicar cambio
        self.test_file.write_text(updated_content)
        
        # Registrar cambio
        record = ChangeRecord.create(
            file_path=self.test_file,
            original=self.original_content,
            updated=updated_content,
            mode="line-range",
            start="1",
            end="2",
            backup_path=self.test_file.with_suffix(".bak")
        )
        self.mgr.record_change(record)
        
        # Modificar manualmente el archivo
        self.test_file.write_text("def foo():\n    return 'manually modified'\n")
        
        # Intentar rollback
        success, message = self.mgr.rollback_last(self.test_file)
        
        self.assertFalse(success)
        self.assertIn("HASH MISMATCH", message)
    
    def test_verify_integrity(self):
        """Verifica detección de discrepancias de integridad"""
        updated_content = "def foo():\n    return 'updated'\n"
        
        # Aplicar y registrar cambio
        self.test_file.write_text(updated_content)
        record = ChangeRecord.create(
            file_path=self.test_file,
            original=self.original_content,
            updated=updated_content,
            mode="line-range",
            start="1",
            end="2",
            backup_path=self.test_file.with_suffix(".bak")
        )
        self.mgr.record_change(record)
        
        # Sin modificaciones manuales
        issues = self.mgr.verify_integrity()
        self.assertEqual(len(issues), 0)
        
        # Con modificación manual
        self.test_file.write_text("def foo():\n    return 'tampered'\n")
        issues = self.mgr.verify_integrity()
        
        self.assertEqual(len(issues), 1)
        self.assertEqual(issues[0]["issue"], "HASH_MISMATCH")


class TestTestingSystem(unittest.TestCase):
    """Tests para el sistema de testing automático"""
    
    def setUp(self):
        """Setup para tests de testing system"""
        self.test_dir = Path(tempfile.mkdtemp())
        self.registry = TestRegistry(self.test_dir)
    
    def tearDown(self):
        """Cleanup"""
        shutil.rmtree(self.test_dir)
    
    def test_infer_backend_tests(self):
        """Verifica inferencia de tests backend"""
        # Crear estructura de directorios
        (self.test_dir / "server").mkdir()
        (self.test_dir / "tests" / "backend").mkdir(parents=True)
        
        # Crear archivos
        source_file = self.test_dir / "server" / "app.js"
        source_file.write_text("// app code")
        
        test_file = self.test_dir / "tests" / "backend" / "app.test.js"
        test_file.write_text("// test code")
        
        # Inferir tests
        tests = self.registry.get_tests_for_file(source_file)
        
        self.assertEqual(len(tests), 1)
        # Normalizar path separators para Windows/Linux
        self.assertTrue("app.test.js" in tests[0].replace("\\", "/"))
    
    def test_infer_frontend_tests(self):
        """Verifica inferencia de tests frontend"""
        (self.test_dir / "client" / "src").mkdir(parents=True)
        (self.test_dir / "tests" / "frontend").mkdir(parents=True)
        
        source_file = self.test_dir / "client" / "src" / "App.jsx"
        source_file.write_text("// app code")
        
        test_file = self.test_dir / "tests" / "frontend" / "App.test.jsx"
        test_file.write_text("// test code")
        
        tests = self.registry.get_tests_for_file(source_file)
        
        self.assertEqual(len(tests), 1)
        # Normalizar path separators para Windows/Linux
        self.assertTrue("App.test.jsx" in tests[0].replace("\\", "/"))
    
    def test_explicit_mapping(self):
        """Verifica mapeo explícito de tests"""
        source_file = self.test_dir / "server" / "db.js"
        test_paths = ["tests/backend/db.test.js", "tests/integration/db_integration.test.js"]
        
        self.registry.add_mapping(source_file, test_paths)
        
        retrieved_tests = self.registry.get_tests_for_file(source_file)
        
        self.assertEqual(retrieved_tests, test_paths)
    
    def test_category_fallback(self):
        """Verifica fallback a categoría de tests"""
        (self.test_dir / "server").mkdir()
        source_file = self.test_dir / "server" / "unknown.js"
        source_file.write_text("// code")
        
        tests = self.registry.get_tests_for_file(source_file)
        
        # Debe caer a suite completa de backend
        self.assertEqual(tests, ["tests/backend"])


class TestIntegration(unittest.TestCase):
    """Tests de integración entre rollback y testing"""
    
    def setUp(self):
        """Setup para tests de integración"""
        self.test_dir = Path(tempfile.mkdtemp())
        self.history_dir = self.test_dir / "surgery"
        
        # Crear estructura mínima de proyecto
        (self.test_dir / "server").mkdir()
        (self.test_dir / "tests" / "backend").mkdir(parents=True)
        
        self.source_file = self.test_dir / "server" / "app.js"
        self.source_file.write_text("function foo() { return 'v1'; }")
        
        # Crear archivo package.json para que sea detectado como proyecto
        (self.test_dir / "package.json").write_text('{"name": "test"}')
    
    def tearDown(self):
        """Cleanup"""
        shutil.rmtree(self.test_dir)
    
    def test_rollback_manager_initialization(self):
        """Verifica inicialización de RollbackManager"""
        mgr = RollbackManager(self.history_dir)
        
        self.assertTrue(mgr.history_dir.exists())
        self.assertTrue(mgr.applied_dir.exists())
        self.assertTrue(mgr.rollback_dir.exists())
    
    def test_test_registry_initialization(self):
        """Verifica inicialización de TestRegistry"""
        registry = TestRegistry(self.test_dir)
        
        self.assertEqual(registry.project_root, self.test_dir)


if __name__ == '__main__':
    # Ejecutar tests con output verboso
    unittest.main(verbosity=2)
