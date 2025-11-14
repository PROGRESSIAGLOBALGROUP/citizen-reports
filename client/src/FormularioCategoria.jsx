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
      <div
        onClick={onCancelar}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '160px'
        }}
      >
        {/* Modal Gubernamental */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: `
              0 16px 40px -8px rgba(0, 0, 0, 0.12),
              0 8px 24px -8px rgba(71, 85, 105, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.7)
            `
          }}
        >
          {/* Header Gubernamental */}
          <div style={{
            padding: 'clamp(16px, 4vw, 24px)',
            background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.04) 0%, rgba(100, 116, 139, 0.04) 100%)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px'
          }}>
            <h2 style={{ 
              margin: 0,
              fontSize: 'clamp(16px, 5vw, 20px)',
              fontWeight: '700',
              color: '#1e293b',
              letterSpacing: '-0.3px'
            }}>
              {modo === 'crear' ? '➕ Nueva Categoría' : '✏️ Editar Categoría'}
            </h2>
            <button
              onClick={onCancelar}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 'clamp(18px, 5vw, 24px)',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '4px 8px',
                borderRadius: '6px',
                lineHeight: '1',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => e.target.style.color = '#64748b'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              ✕
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
                  padding: '12px 16px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'rgba(248, 250, 252, 0.5)',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  e.target.style.background = 'rgba(248, 250, 252, 0.5)';
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
                  background: 'rgba(248, 250, 252, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '8px',
                  fontSize: '24px'
                }}>
                  {icono}
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'rgba(248, 250, 252, 0.8)',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#475569',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(71, 85, 105, 0.08)';
                    e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(248, 250, 252, 0.8)';
                    e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  }}
                >
                  Seleccionar Emoji
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
                  placeholder="#475569"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    background: 'rgba(248, 250, 252, 0.5)',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                    e.target.style.background = 'white';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                    e.target.style.background = 'rgba(248, 250, 252, 0.5)';
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
                  padding: '12px 16px',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: 'rgba(248, 250, 252, 0.5)',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                  e.target.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  e.target.style.background = 'rgba(248, 250, 252, 0.5)';
                }}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Número más bajo aparece primero
              </div>
            </div>

            {/* Botones Gubernamentales */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onCancelar}
                disabled={guardando}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(248, 250, 252, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '8px',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#475569',
                  opacity: guardando ? 0.5 : 1,
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!guardando) {
                    e.target.style.background = 'rgba(71, 85, 105, 0.08)';
                    e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!guardando) {
                    e.target.style.background = 'rgba(248, 250, 252, 0.8)';
                    e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  }
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #475569, #64748b)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'white',
                  opacity: guardando ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px -4px rgba(71, 85, 105, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!guardando) {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 6px 16px -4px rgba(71, 85, 105, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!guardando) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 12px -4px rgba(71, 85, 105, 0.3)';
                  }
                }}
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
