-- Migración 002: Agregar tabla de notas de funcionarios (drafts)
-- Permite guardar borradores de notas sin cerrar el reporte

CREATE TABLE IF NOT EXISTS notas_funcionario (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporte_id INTEGER NOT NULL,
  usuario_id INTEGER NOT NULL,
  notas TEXT NOT NULL,
  es_borrador INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE(reporte_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_notas_reporte ON notas_funcionario(reporte_id);
CREATE INDEX IF NOT EXISTS idx_notas_usuario ON notas_funcionario(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notas_borrador ON notas_funcionario(es_borrador);
