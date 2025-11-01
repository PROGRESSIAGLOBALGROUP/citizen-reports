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
      {/* Overlay */}
      <div
        onClick={onCancelar}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
              {modo === 'crear' ? '➕ Nueva Categoría' : '✏️ Editar Categoría'}
            </h3>
            <button
              onClick={onCancelar}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: '0',
                lineHeight: 1
              }}
            >
              ×
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {error && (
              <div style={{
                padding: '12px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '20px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Preview */}
            <div style={{
              padding: '16px',
              background: `${color}15`,
              borderRadius: '12px',
              border: `2px solid ${color}40`,
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '32px' }}>{icono}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>
                  {nombre || 'Nombre de la categoría'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Vista previa
                </div>
              </div>
              <div style={{
                width: '40px',
                height: '40px',
                background: color,
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.1)'
              }} />
            </div>

            {/* Campo Nombre */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Nombre *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Obras Públicas"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Campo Icono */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Icono *
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '28px'
                }}>
                  {icono}
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    background: '#f9fafb',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}
                >
                  😀 Seleccionar Emoji
                </button>
              </div>

              {mostrarEmojiPicker && (
                <div style={{ marginTop: '12px' }}>
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Color *
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div
                  onClick={() => setMostrarColorPicker(!mostrarColorPicker)}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: color,
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  title="Click para cambiar color"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              {mostrarColorPicker && (
                <div style={{ marginTop: '12px' }}>
                  <HexColorPicker color={color} onChange={setColor} style={{ width: '100%' }} />
                </div>
              )}
            </div>

            {/* Campo Orden */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Orden
              </label>
              <input
                type="number"
                value={orden}
                onChange={(e) => setOrden(parseInt(e.target.value) || 999)}
                min="0"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Número más bajo aparece primero
              </div>
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancelar}
                disabled={guardando}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  opacity: guardando ? 0.5 : 1
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  opacity: guardando ? 0.5 : 1
                }}
              >
                {guardando ? '⏳ Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
