# Legal by Design

## Marco normativo de referencia

- **Propiedad intelectual:** Los mapas provienen de OpenStreetMap. Mantener la atribución en la interfaz (`© OpenStreetMap`) y en cualquier exportación o reporte derivado.
- **Protección de datos personales (MX/EU):** Asumir cumplimiento con LFPDPPP/GDPR dada la captura de ubicaciones potencialmente identificables. Aplicar políticas de minimización y anonimización.
- **Licenciamiento del código:** Definir explícitamente la licencia del repositorio (pendiente). Hasta entonces, tratarlo como confidencial para el equipo.

## Políticas recomendadas

- **Aviso de privacidad:** Mostrar un enlace al aviso en la SPA (sección footer o panel lateral). El aviso debe cubrir propósito, base legal y medios de contacto.
- **Términos de servicio:** Documentar las responsabilidades del usuario al registrar reportes, incluyendo veracidad y uso aceptable.
- **Retención y eliminación:** Establecer política de retención máxima (p. ej. 24 meses) y proceso para eliminar datos bajo solicitud ciudadana.
- **Consentimiento informado:** Obtener aprobación explícita antes de capturar información geolocalizada desde el navegador.

## Checklist previo a despliegue público

1. Revisar contratos/licencias de dependencias y confirmar compatibilidad con el modelo de distribución.
2. Auditar los endpoints de exportación para evitar inclusión de datos personales sin anonimización.
3. Incluir mecanismos de contacto (correo oficial) para ejercer derechos ARCO.
4. Mantener un registro de cambios en `docs/changelog.md` para trazabilidad legal.

## Referencias

- [OpenStreetMap Attribution Guidelines](https://www.openstreetmap.org/copyright)
- [INEGI Lineamientos de Datos Personales](https://www.plataformadetransparencia.org.mx/)
- [GDPR Article 30 - Records of processing activities](https://gdpr-info.eu/art-30-gdpr/)
