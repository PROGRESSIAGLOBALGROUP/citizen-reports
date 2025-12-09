/**
 * FormularioCategoria.jsx
 * Modal para crear/editar categorías con emoji picker y color picker
 */

import React from 'react';
import EmojiPicker from 'emoji-picker-react';
import { HexColorPicker } from 'react-colorful';

export default function FormularioCategoria({ modo, categoria, onGuardar, onCancelar }) {
  const [nombre, setNombre] = React.useState(categoria?.nombre || '');
  const [icono, setIcono] = React.useState(categoria?.icono || '📁');
  const [color, setColor] = React.useState(categoria?.color || '#3b82f6');
  const [orden, setOrden] = React.useState(categoria?.orden || 999);
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = React.useState(false);
  const [mostrarColorPicker, setMostrarColorPicker] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const url = modo === 'crear'
        ? '/api/admin/categorias'
        : `/api/admin/categorias/${categoria.id}`;
      
      const response = await fetch(url, {
        method: modo === 'crear' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          icono,
          color,
          orden,
          activo: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      alert(modo === 'crear' ? 'Categoría creada correctamente' : 'Categoría actualizada correctamente');
      onGuardar();
    } catch (err) {
      console.error('Error guardando categoría:', err);
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      {/* Overlay Gubernamental */}
      <div onClick={onCancelar} className="gp-modal-overlay-centered">
        {/* Modal Gubernamental */}
        <div onClick={(e) => e.stopPropagation()} className="gp-modal-categoria">
          {/* Header Gubernamental */}
          <div className="gp-modal-header-simple">
            <h2 className="gp-modal-title">
              {modo === 'crear' ? '🚀 Nueva Categoría' : '✨ Editar Categoría'}
            </h2>
            <button onClick={onCancelar} type="button" className="gp-modal-close">
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="gp-modal-form-body">
            {error && (
              <div className="gp-form-error-alert">
                ⚠️ {error}
              </div>
            )}

            {/* Preview */}
            <div className="gp-cat-preview" style={{ background: `${color}15`, borderColor: `${color}40` }}>
              <span className="gp-cat-preview-icon">{icono}</span>
              <div className="gp-cat-preview-content">
                <div className="gp-cat-preview-name">
                  {nombre || 'Nombre de la categoría'}
                </div>
                <div className="gp-cat-preview-hint">Vista previa</div>
              </div>
              <div className="gp-cat-preview-color" style={{ background: color }} />
            </div>

            {/* Campo Nombre */}
            <div className="gp-form-field">
              <label className="gp-form-label">Nombre *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Obras Públicas"
                required
                className="gp-form-input"
              />
            </div>

            {/* Campo Icono */}
            <div className="gp-form-field">
              <label className="gp-form-label">Icono *</label>
              <div className="gp-cat-icon-row">
                <div className="gp-cat-icon-display">{icono}</div>
                <button
                  type="button"
                  onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
                  className="gp-cat-icon-btn"
                >
                  Seleccionar Emoji
                </button>
              </div>

              {mostrarEmojiPicker && (
                <div className="gp-picker-container">
                  <EmojiPicker
                    onEmojiClick={(emojiObject) => {
                      setIcono(emojiObject.emoji);
                      setMostrarEmojiPicker(false);
                    }}
                    width="100%"
                    height="350px"
                    searchPlaceholder="Buscar emoji..."
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}
            </div>

            {/* Campo Color */}
            <div className="gp-form-field">
              <label className="gp-form-label">Color *</label>
              <div className="gp-cat-color-row">
                <div
                  onClick={() => setMostrarColorPicker(!mostrarColorPicker)}
                  className="gp-cat-color-swatch"
                  style={{ background: color }}
                  title="Click para cambiar color"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#475569"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="gp-form-input mono"
                />
              </div>

              {mostrarColorPicker && (
                <div className="gp-picker-container">
                  <HexColorPicker color={color} onChange={setColor} style={{ width: '100%' }} />
                </div>
              )}
            </div>

            {/* Campo Orden */}
            <div className="gp-form-field">
              <label className="gp-form-label">Orden</label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(parseInt(e.target.value) || 999)}
                min="0"
                className="gp-form-input"
              />
              <div className="gp-form-hint">Número más bajo aparece primero</div>
            </div>

            {/* Botones Gubernamentales */}
            <div className="gp-form-actions-right">
              <button
                type="button"
                onClick={onCancelar}
                disabled={guardando}
                className="gp-btn-cancel"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="gp-btn-save"
              >
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
