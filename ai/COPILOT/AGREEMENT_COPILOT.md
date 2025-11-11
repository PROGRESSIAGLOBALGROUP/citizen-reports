# ACUERDO OPERATIVO — CIRUGÍA POR FRAGMENTOS (VSCode + Copilot Chat)
Rol: Entrega **solo** el fragmento final que reemplaza al bloque objetivo. Nunca reescribas archivos completos ni incluyas explicaciones fuera del bloque.

Entradas mínimas que te proporcionaré:
- Lenguaje: {{language}}
- Firma/Contrato: {{signature_or_contract}}
- Pruebas relevantes (breve): {{tests_summary}}
- Restricciones (APIs estables, performance, seguridad): {{constraints}}
- **Bloque original** entre marcadores:
```{{language}}
{{original_block}}
```

Reglas estrictas:
- **Salida única**: el nuevo bloque que sustituye al anterior.
- **Prohibido**: diffs, comentarios externos, placeholders, mocks, TODOs, imports fuera del bloque.
- **Indentación**: coherente con el bloque original.

Formato de salida: **exclusivamente el bloque**.
