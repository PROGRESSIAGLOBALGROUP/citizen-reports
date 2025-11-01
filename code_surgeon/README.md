# VSCode Local Surgery Kit (100% local, sin Git/GitHub)
## 🏆 Protocolo de Clase Mundial con Rollback y Testing Automático

Este kit permite aplicar la **Cirugía por Fragmentos** de forma local, sin depender de Git ni de GitHub, con capacidades enterprise-grade de rollback y testing automático.

## 🎯 Características de Clase Mundial

### 1. **Rollback Exacto con Audit Trail**
- ✅ Registro inmutable de cada modificación con hashes SHA-256
- ✅ Historial completo con timestamps y metadata
- ✅ Rollback exacto a cualquier punto en el tiempo
- ✅ Verificación de integridad para detectar modificaciones manuales
- ✅ Backups automáticos antes de cada cambio

### 2. **Testing Automático Integrado**
- ✅ Auto-detección de tests correspondientes por convención
- ✅ Soporte multi-framework: Jest, Vitest, pytest
- ✅ Rollback automático si los tests fallan (Fail-Fast)
- ✅ Test Impact Analysis para ejecutar solo tests relevantes
- ✅ Mapeo explícito de archivos → tests en `test_mapping.json`

### 3. **Flujo de Operación Seguro**
```
Modificación → Backup → Registro → Tests → ¿OK? 
                                      ↓           ↓
                                     SÍ          NO
                                      ↓           ↓
                                   Aplicar    Rollback
                                              Automático
```

## 📦 Instalación

1) (Opcional) Crea un entorno virtual:
   - Windows (PowerShell):
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - Linux/macOS:
     ```bash
     python -m venv .venv
     source .venv/bin/activate
     ```

2) Prueba el CLI:
   ```bash
   python code_surgeon/bin/code-surgeon.py --help
   ```

## 🚀 Uso

### A) Manual con Task
- `Terminal → Run Task → surgery: splice by markers` o `line-range`.

### B) Automático con watcher (RECOMENDADO)
- `Terminal → Run Task → surgery: watch jobs (auto-apply)`
- Crea un job JSON en `surgery/jobs/` (ver `prompts/JOB_TEMPLATE.json`).
- El watcher detecta, aplica, registra y testea automáticamente.

### C) Copilot Chat (o cualquier LLM en VSCode)
- Usa `prompts/AGREEMENT_COPILOT.md` como acuerdo de salida **fragmento-único**.
- Guarda el fragmento en `surgery/patches/...` y crea el job JSON.
- El watcher lo aplicará, registrará y testeará automáticamente.

## 📋 Formato de Job (Actualizado)

```json
{
  "file": "server/app.js",
  "mode": "regex-block",
  "start": "BEGIN:function_name",
  "end": "END:function_name",
  "new_fragment_path": "surgery/patches/fix_function.js",
  "post_cmd": "npm run lint",
  "job_file": "surgery/jobs/fix_function.json",
  "enable_rollback": true,
  "enable_testing": true
}
```

### Campos nuevos:
- **`job_file`**: Path al archivo de job (para tracking)
- **`enable_rollback`**: `true` para habilitar registro y rollback (default: true)
- **`enable_testing`**: `true` para ejecutar tests automáticamente (default: true)

## 🔄 Gestión de Rollback

### Listar cambios aplicados
```bash
python -c "from code_surgeon.surgery.rollback import RollbackManager; from pathlib import Path; mgr = RollbackManager(Path('surgery')); print('\n'.join(f'{t} | {f} | {d}' for t,f,d in mgr.list_rollbackable()))"
```

### Rollback del último cambio a un archivo
```bash
python -c "from code_surgeon.surgery.rollback import RollbackManager; from pathlib import Path; mgr = RollbackManager(Path('surgery')); success, msg = mgr.rollback_last(Path('server/app.js')); print(msg)"
```

### Verificar integridad de archivos modificados
```bash
python -c "from code_surgeon.surgery.rollback import RollbackManager; from pathlib import Path; mgr = RollbackManager(Path('surgery')); issues = mgr.verify_integrity(); print('✅ Todo OK' if not issues else '\n'.join(str(i) for i in issues))"
```

## 🧪 Testing Automático

### Convenciones de Tests (Auto-detección)
El sistema detecta automáticamente tests siguiendo estas convenciones:

| Archivo modificado | Tests ejecutados |
|-------------------|------------------|
| `server/*.js` | `tests/backend/*.test.js` |
| `client/src/*.jsx` | `tests/frontend/*.test.jsx` |
| `scripts/*.py` | `tests/scripts/*.test.py` |

### Mapeo Explícito
Edita `code_surgeon/test_mapping.json` para definir relaciones específicas:

```json
{
  "server/app.js": ["tests/backend/app.test.js"],
  "client/src/MapView.jsx": ["tests/frontend/MapView.test.jsx", "tests/e2e/map.spec.ts"]
}
```

### Frameworks Soportados
- **Jest** (backend): Detecta automáticamente con `npm run test:backend`
- **Vitest** (frontend): Detecta automáticamente con `npm run test:frontend`
- **pytest** (Python): Ejecuta directamente con `pytest -v`

## 📊 Estructura de Directorios

```
code_surgeon/
├── bin/
│   └── code-surgeon.py          # CLI principal
├── surgery/
│   ├── rollback.py              # ✨ NUEVO: Sistema de rollback
│   ├── testing.py               # ✨ NUEVO: Testing automático
│   ├── runner.py                # Actualizado con rollback+testing
│   ├── splicer.py               # Motor de aplicación de parches
│   ├── selectors.py             # Selección de regiones
│   ├── patchops.py              # Operaciones de parche
│   └── utils.py                 # Utilidades
├── prompts/
│   ├── AGREEMENT_COPILOT.md     # Protocolo para LLMs
│   └── JOB_TEMPLATE.json        # Template de job
├── test_mapping.json            # ✨ NUEVO: Mapeo archivos → tests
└── README.md                    # Este archivo

surgery/                         # Directorio de trabajo
├── jobs/                        # Jobs pendientes
├── patches/                     # Fragmentos de código
├── applied/                     # ✨ NUEVO: Registros de cambios aplicados
├── rollback/                    # ✨ NUEVO: Registros de rollbacks
├── failed/                      # Jobs que fallaron
└── inbox/                       # Jobs entrantes
```

## 🛡️ Seguridad y Garantías

### 1. **Backups Automáticos**
Antes de cada modificación se crea un backup `.bak` que persiste hasta que el siguiente cambio se aplique exitosamente.

### 2. **Audit Trail Inmutable**
Cada cambio se registra con:
- Timestamp UTC ISO 8601
- Hash SHA-256 del contenido original y nuevo
- Path del backup físico
- Resultado de tests
- Comando post-aplicación ejecutado

### 3. **Rollback Seguro con Verificación**
El rollback verifica el hash del archivo actual antes de revertir:
```
⚠️  HASH MISMATCH: El archivo actual (abc123) no coincide con el hash 
registrado (def456). Posibles modificaciones manuales.
```

### 4. **Test-Driven Changes**
Los cambios solo se persisten si los tests pasan. Si fallan:
- Rollback automático
- Log detallado del error
- Job movido a `surgery/failed/` para análisis

## 🔧 Comandos de Mantenimiento

### Reset completo del entorno
```bash
python scripts/reset_environment.py
```

### Limpiar historial de rollback antiguo (>30 días)
```bash
python -c "from code_surgeon.surgery.rollback import RollbackManager; from pathlib import Path; import time; mgr = RollbackManager(Path('surgery')); [f.unlink() for f in mgr.applied_dir.glob('*.json') if time.time() - f.stat().st_mtime > 30*86400]"
```

### Exportar historial completo a JSON
```bash
python -c "from code_surgeon.surgery.rollback import RollbackManager; from pathlib import Path; import json; mgr = RollbackManager(Path('surgery')); print(json.dumps([r.__dict__ for r in mgr.get_history()], indent=2))" > surgery_history.json
```

## 📚 Mejores Prácticas

### 1. **Siempre escribe tests primero**
Antes de aplicar cambios con code_surgeon, asegúrate de tener tests que validen el comportamiento esperado.

### 2. **Usa Jobs para cambios complejos**
Los jobs permiten:
- Repetibilidad
- Trazabilidad
- Rollback exacto
- Testing automático

### 3. **Revisa el diff antes de aplicar**
El sistema genera un unified diff de cada cambio. Revísalo antes de confirmar.

### 4. **Mantén test_mapping.json actualizado**
Si creates archivos nuevos, añádelos al mapeo para garantizar cobertura.

### 5. **Ejecuta verificación de integridad regularmente**
```bash
python -c "from code_surgeon.surgery.rollback import RollbackManager; from pathlib import Path; mgr = RollbackManager(Path('surgery')); issues = mgr.verify_integrity(); print('✅ Integridad OK' if not issues else f'⚠️  {len(issues)} discrepancias encontradas')"
```

## 🆘 Troubleshooting

### "Tests not found"
→ Añade mapeo explícito en `test_mapping.json`

### "Hash mismatch on rollback"
→ El archivo fue modificado manualmente después del cambio registrado. Usa el backup físico `.bak` para restaurar.

### "Timeout ejecutando tests"
→ Aumenta el timeout en `surgery/testing.py` (default: 60s)

### "Job moved to failed/"
→ Revisa el log del job para ver por qué falló (tests, post_cmd, etc.)

## 🌟 Ventajas vs. Git

| Característica | Code Surgeon | Git |
|---------------|--------------|-----|
| Granularidad | Fragmento de código | Archivo completo |
| Rollback | Exacto con hash verification | Requiere commit + reset |
| Testing automático | Integrado nativamente | Requiere CI/CD setup |
| Local-first | 100% local, sin remote | Requiere remote para colaboración |
| Audit trail | JSON estructurado + diffs | Log textual de commits |
| Fail-safe | Rollback automático si tests fallan | Manual merge + fix |

## 📖 Referencias

- **Rollback System**: `surgery/rollback.py`
- **Testing Integration**: `surgery/testing.py`
- **Runner**: `surgery/runner.py`
- **Job Template**: `prompts/JOB_TEMPLATE.json`
- **Copilot Agreement**: `prompts/AGREEMENT_COPILOT.md`
