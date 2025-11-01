# Code Surgeon - Mejores Prácticas de Clase Mundial

## 🎯 Principios Fundamentales

### 1. **Test-Driven Surgery (TDS)**
Siempre escribe tests ANTES de aplicar cambios con code surgeon.

```bash
# ❌ INCORRECTO
1. Aplicar cambio con code surgeon
2. Esperar que funcione
3. (Opcionalmente) escribir tests

# ✅ CORRECTO  
1. Escribir test que falla (Red)
2. Aplicar cambio con code surgeon (Green)
3. El sistema auto-ejecuta tests y verifica (Refactor)
4. Si tests fallan → rollback automático
```

### 2. **Single Responsibility per Job**
Cada job debe modificar UNA sola función/bloque de código.

```json
// ❌ INCORRECTO - Job que modifica múltiples funciones
{
  "file": "server/app.js",
  "mode": "line-range",
  "start": 1,
  "end": 500  // ← Demasiado amplio
}

// ✅ CORRECTO - Job específico
{
  "file": "server/app.js",
  "mode": "regex-block",
  "start": "function verificarPosibleDuplicado",
  "end": "^}$",  // Fin de la función específica
  "new_fragment_path": "surgery/patches/fix_duplicate_check.js"
}
```

### 3. **Idempotencia**
Los jobs deben poder ejecutarse múltiples veces con el mismo resultado.

```javascript
// ❌ INCORRECTO - No idempotente
function addMiddleware(app) {
  app.use(cors());  // ← Se duplica en cada ejecución
}

// ✅ CORRECTO - Idempotente
function setupMiddleware(app) {
  // Limpiar middlewares previos si existen
  app._router.stack = app._router.stack.filter(m => m.name !== 'corsMiddleware');
  app.use(cors());
}
```

### 4. **Atomic Operations**
Usa transacciones conceptuales: cambio + tests + verificación = unidad atómica.

El sistema ya hace esto automáticamente:
```
BEGIN TRANSACTION
  ├─ Apply change
  ├─ Record to history
  ├─ Run tests
  └─ IF tests_pass: COMMIT
     ELSE: ROLLBACK
END TRANSACTION
```

## 🏗️ Arquitectura de Jobs

### Naming Convention para Jobs

```
surgery/jobs/
├── YYYY-MM-DD_<component>_<action>_<ticket>.json
│
├── 2025-10-01_duplicate_detection_fix_BUG-153.json  ✅ Bueno
├── 2025-10-01_app_refactor_FEAT-89.json              ✅ Bueno
└── fix_bug.json                                      ❌ Malo (no descriptivo)
```

### Naming Convention para Fragments

```
surgery/patches/
├── <component>_<function>_<version>.ext
│
├── duplicate_detection_v2.js        ✅ Bueno
├── form_validation_final.jsx        ✅ Bueno
└── fix.js                           ❌ Malo (no descriptivo)
```

## 🔄 Workflow Recomendado

### Para Features Nuevas

1. **Crear branch de feature** (opcional, si usas git)
   ```bash
   git checkout -b feature/duplicate-detection
   ```

2. **Escribir tests que fallen**
   ```bash
   # tests/backend/duplicate_detection.test.js
   test('detecta duplicados solo si misma ubicación', () => {
     // Test que falla inicialmente
   });
   ```

3. **Crear fragmento de código**
   ```bash
   # surgery/patches/duplicate_detection_v1.js
   function verificarPosibleDuplicado(db, datos) {
     // Implementación correcta
   }
   ```

4. **Crear job**
   ```json
   {
     "file": "server/app.js",
     "mode": "regex-block",
     "start": "function verificarPosibleDuplicado",
     "end": "^}$",
     "new_fragment_path": "surgery/patches/duplicate_detection_v1.js",
     "enable_rollback": true,
     "enable_testing": true
   }
   ```

5. **Aplicar con watcher**
   ```bash
   # Terminal → Run Task → surgery: watch jobs
   # Copiar job a surgery/jobs/
   ```

6. **Verificar resultado**
   ```bash
   python code_surgeon/bin/surgery-manager.py verify
   ```

### Para Bugfixes

1. **Reproducir bug con test**
   ```javascript
   test('BUG-153: no debe marcar como duplicado ubicaciones diferentes', () => {
     // Test que reproduce el bug
   });
   ```

2. **Aplicar fix con code surgeon** (igual que arriba)

3. **Verificar que el test pasa**
   ```bash
   python code_surgeon/bin/surgery-manager.py test server/app.js
   ```

4. **Commit del cambio completo**
   ```bash
   git add .
   git commit -m "fix: BUG-153 detección de duplicados incorrecta"
   ```

### Para Refactoring

1. **Asegurar cobertura de tests existentes**
   ```bash
   npm run test:coverage
   # Objetivo: >90% backend, >80% frontend
   ```

2. **Refactorizar con code surgeon**
   - El sistema verifica que tests pasen
   - Si fallan → rollback automático

3. **No usar `enable_testing: false`** en refactoring
   - Siempre queremos verificar que no rompimos nada

## 🧪 Testing Best Practices

### Test Mapping Explícito

Siempre mapea archivos críticos a sus tests en `test_mapping.json`:

```json
{
  "server/app.js": [
    "tests/backend/app.test.js",
    "tests/backend/routes.test.js",
    "tests/e2e/api.spec.ts"
  ],
  "server/db.js": [
    "tests/backend/db.test.js"
  ],
  "client/src/ReportForm.jsx": [
    "tests/frontend/ReportForm.test.jsx",
    "tests/e2e/report_submission.spec.ts"
  ]
}
```

### Test Isolation

Cada test debe ser independiente:

```javascript
// ❌ INCORRECTO - Tests dependientes
describe('API', () => {
  let reportId;  // ← Estado compartido
  
  test('crea reporte', async () => {
    reportId = await createReport();
  });
  
  test('obtiene reporte', async () => {
    const report = await getReport(reportId);  // ← Depende del anterior
  });
});

// ✅ CORRECTO - Tests independientes
describe('API', () => {
  test('crea reporte', async () => {
    const reportId = await createReport();
    expect(reportId).toBeDefined();
  });
  
  test('obtiene reporte', async () => {
    const reportId = await createReport();  // ← Setup propio
    const report = await getReport(reportId);
    expect(report).toBeDefined();
  });
});
```

## 🛡️ Rollback Strategies

### Cuándo hacer rollback manual

```bash
# 1. Verificar qué cambios hay
python code_surgeon/bin/surgery-manager.py list

# 2. Ver historial de un archivo específico
python code_surgeon/bin/surgery-manager.py history server/app.js

# 3. Rollback si es necesario
python code_surgeon/bin/surgery-manager.py rollback server/app.js
```

### Cuándo NO hacer rollback

- Si el archivo fue modificado manualmente después del cambio
  → El sistema detectará "HASH_MISMATCH"
  → Usa el backup `.bak` manualmente

### Chain Rollback

Si necesitas revertir múltiples cambios en cadena:

```bash
# Revertir cambios en orden inverso
python code_surgeon/bin/surgery-manager.py rollback client/src/MapView.jsx
python code_surgeon/bin/surgery-manager.py rollback client/src/App.jsx
python code_surgeon/bin/surgery-manager.py rollback server/app.js
```

## 📊 Monitoreo y Auditoría

### Verificación de Integridad Regular

```bash
# Agregar a cron o scheduled task
0 2 * * * cd /path/to/project && python code_surgeon/bin/surgery-manager.py verify
```

### Export de Historial para Compliance

```bash
# Exportar historial completo a JSON
python -c "
from code_surgeon.surgery.rollback import RollbackManager
from pathlib import Path
import json

mgr = RollbackManager(Path('surgery'))
history = [r.__dict__ for r in mgr.get_history()]

with open('surgery_audit_trail.json', 'w') as f:
    json.dump(history, f, indent=2, ensure_ascii=False)
"
```

### Limpieza Automática

```bash
# Limpiar registros >90 días (mantener 3 meses de historial)
python code_surgeon/bin/surgery-manager.py clean --days 90 --force
```

## 🔥 Troubleshooting Avanzado

### "Tests timeout"

Aumentar timeout en `surgery/testing.py`:

```python
result = subprocess.run(
    cmd,
    cwd=self.project_root,
    capture_output=True,
    text=True,
    timeout=120  # ← Aumentar de 60 a 120 segundos
)
```

### "Hash mismatch on rollback"

El archivo fue modificado manualmente después del cambio registrado.

**Opciones:**

1. **Usar backup físico**
   ```bash
   # Buscar backup .bak correspondiente
   ls -lt **/*.bak | head -5
   
   # Restaurar manualmente
   cp server/app.js.bak server/app.js
   ```

2. **Forzar actualización del registro**
   ```python
   from code_surgeon.surgery.rollback import RollbackManager, ChangeRecord
   from pathlib import Path
   import hashlib
   
   # Actualizar hash del registro para reflejar modificación manual
   mgr = RollbackManager(Path('surgery'))
   # ... (implementar función de force-update)
   ```

### "Job moved to failed/"

Revisar el log del job:

```bash
cat surgery/failed/<job_name>.json | jq '.test_result.output'
```

## 🌟 Casos de Uso Avanzados

### Multi-file Atomic Change

Para cambios que requieren modificar varios archivos de forma atómica:

1. Crear jobs individuales para cada archivo
2. Aplicarlos en secuencia
3. Si alguno falla, hacer rollback de todos:

```bash
#!/bin/bash
# atomic_change.sh

files=(
  "server/app.js"
  "server/db.js"
  "client/src/api.js"
)

# Aplicar cambios
for file in "${files[@]}"; do
  python code_surgeon/bin/code-surgeon.py --job "surgery/jobs/${file/\//_}.json"
  
  if [ $? -ne 0 ]; then
    echo "❌ Fallo aplicando cambio a $file. Rollback completo..."
    
    # Rollback de todos los archivos modificados
    for rollback_file in "${files[@]}"; do
      python code_surgeon/bin/surgery-manager.py rollback "$rollback_file" --force
    done
    
    exit 1
  fi
done

echo "✅ Cambio atómico aplicado exitosamente"
```

### Dry-run Mode

Para previsualizar cambios sin aplicarlos:

```bash
# Opción 1: Ver diff sin aplicar
python -c "
from code_surgeon.surgery.selectors import select_by_regex_block
from pathlib import Path

sel = select_by_regex_block(
    Path('server/app.js'),
    'function verificarPosibleDuplicado',
    '^}$'
)

print('CONTENIDO ACTUAL:')
print(sel.mid)
"

# Opción 2: Aplicar con enable_testing=false y hacer rollback inmediato
# (no recomendado en producción)
```

### A/B Testing de Cambios

Para comparar dos implementaciones:

```bash
# Versión A
cp surgery/patches/algorithm_v1.js surgery/patches/algorithm_active.js
python code_surgeon/bin/code-surgeon.py --job surgery/jobs/apply_algorithm.json
npm run benchmark > results_v1.txt

# Rollback
python code_surgeon/bin/surgery-manager.py rollback server/algorithm.js --force

# Versión B
cp surgery/patches/algorithm_v2.js surgery/patches/algorithm_active.js
python code_surgeon/bin/code-surgeon.py --job surgery/jobs/apply_algorithm.json
npm run benchmark > results_v2.txt

# Comparar resultados
diff results_v1.txt results_v2.txt
```

## 📚 Referencias Adicionales

- **Martin Fowler - Refactoring**: Patterns de refactoring seguro
- **Kent Beck - TDD by Example**: Test-Driven Development
- **Google SRE Book - Change Management**: Best practices para cambios en producción
- **The Twelve-Factor App - Config**: Gestión de configuración y entorno

## 🎓 Checklist de Clase Mundial

Antes de aplicar un cambio con code surgeon:

- [ ] Tests escritos y fallando (Red)
- [ ] Fragmento de código creado y revisado
- [ ] Job configurado con `enable_rollback: true` y `enable_testing: true`
- [ ] Mapeo de tests actualizado en `test_mapping.json` (si es necesario)
- [ ] Backup manual realizado (opcional, para cambios críticos)
- [ ] Entorno de tests limpio (no hay tests fallando previamente)
- [ ] Coverage de tests adecuado (>90% backend, >80% frontend)

Después de aplicar el cambio:

- [ ] Tests pasaron automáticamente
- [ ] No hay errores de lint/compile
- [ ] Registro de rollback creado
- [ ] Cambio verificado manualmente
- [ ] Documentación actualizada (si aplica)
- [ ] Commit realizado con mensaje descriptivo
