# Protocolo Code Surgery para copilot-instructions.md

## Versión Base Limpia

El archivo `.github/copilot-instructions.md` está ahora en formato base limpio sin errores de lint. 

## Modificaciones Seguras

Para realizar cambios seguros, usa el protocolo `code_surgeon`:

### 1. Modo Manual

```powershell
# Ejecuta la tarea de VSCode
Terminal → Run Task → surgery: splice by markers
```

Parámetros requeridos:
- **Target File**: `.github/copilot-instructions.md`
- **Start Marker**: `## Section Name`
- **End Marker**: `## Next Section Name`
- **Fragment Path**: `surgery/patches/your_fragment.md`
- **Post Command**: `npm run lint --silent`

### 2. Modo Automático (Watcher)

```powershell
# Inicia el watcher
Terminal → Run Task → surgery: watch jobs (auto-apply)
```

Luego crea un job JSON en `surgery/jobs/`:

```json
{
  "file": ".github/copilot-instructions.md",
  "mode": "regex-block",
  "start": "## Project Overview",
  "end": "## Architecture & Structure",
  "new_fragment_path": "surgery/patches/update_project_overview.md",
  "post_cmd": "npm run lint --silent"
}
```

### 3. Generación de Fragmentos

Cuando uses Copilot Chat u otro LLM:

1. Carga el acuerdo: `prompts/AGREEMENT_COPILOT.md`
2. Proporciona el bloque original entre marcadores
3. Recibe **solo** el fragmento de reemplazo
4. Guarda el fragmento en `surgery/patches/`
5. Crea el job JSON correspondiente

### Ejemplo de Fragmento

Ver: `surgery/patches/update_project_overview.md`

### Beneficios

- ✅ Respaldos automáticos (`.bak`)
- ✅ Validación post-edición
- ✅ Reversión automática en caso de error
- ✅ Preservación de formato e indentación
- ✅ Sin riesgo de corrupción de archivos

### Comandos de Verificación

```powershell
# Verificar lint
npm run lint

# Verificar archivos específicos
npx eslint .github/copilot-instructions.md --ext .md
```