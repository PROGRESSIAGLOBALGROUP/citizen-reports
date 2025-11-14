/**
 * FormularioTipo.jsx
 * Modal para crear/editar tipos de reporte - DISEÑO GUBERNAMENTAL PROFESIONAL
 */

import React from 'react';
import EmojiPicker from 'emoji-picker-react';
import { 
  GOBIERNO_COLORS, 
  GobiernoComponents, 
  GobiernoHoverEffects, 
  GobiernoTypography 
} from './gobierno-design-system.js';

export default function FormularioTipo({ modo, tipo, categoriaId, categorias, onGuardar, onCancelar }) {
  const [categoria, setCategoria] = React.useState(tipo?.categoria_id || categoriaId || '');
  const [slug, setSlug] = React.useState(tipo?.tipo || '');
  const [nombre, setNombre] = React.useState(tipo?.nombre || '');
  const [descripcion, setDescripcion] = React.useState(tipo?.descripcion || '');
  const [icono, setIcono] = React.useState(tipo?.icono || '📋');
  const [dependencia, setDependencia] = React.useState(tipo?.dependencia || 'servicios_publicos');
  const [dependencias, setDependencias] = React.useState([]);
  const [cargandoDependencias, setCargandoDependencias] = React.useState(true);
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Cargar dependencias desde la API
  React.useEffect(() => {
    cargarDependencias();
  }, []);

  async function cargarDependencias() {
    try {
      const response = await fetch('/api/dependencias');
      if (!response.ok) {
        throw new Error('Error al cargar dependencias');
      }
      const data = await response.json();
      setDependencias(data);
    } catch (err) {
      console.error('Error cargando dependencias:', err);
      setError('Error al cargar dependencias');
    } finally {
      setCargandoDependencias(false);
    }
  }

  // Auto-generar slug desde nombre
  const generarSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^a-z0-9]+/g, '_') // Reemplazar espacios y caracteres especiales
      .replace(/^_+|_+$/g, ''); // Quitar guiones bajos al inicio/final
  };

  const handleNombreChange = (value) => {
    setNombre(value);
    // Auto-generar slug solo si estamos creando (no en edición)
    if (modo === 'crear' && !slug) {
      setSlug(generarSlug(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!categoria) {
      setError('Selecciona una categoría');
      return;
    }
    if (!slug.trim() || !/^[a-z0-9_]+$/.test(slug.trim())) {
      setError('El slug solo puede contener letras minúsculas, números y guiones bajos');
      return;
    }
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const url = modo === 'crear'
        ? '/api/admin/tipos'
        : `/api/admin/tipos/${tipo.id}`;
      
      const response = await fetch(url, {
        method: modo === 'crear' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoria_id: categoria,
          slug: slug.trim(),
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          icono,
          dependencia,
          activo: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      alert(modo === 'crear' ? 'Tipo creado correctamente' : 'Tipo actualizado correctamente');
      onGuardar();
    } catch (err) {
      console.error('Error guardando tipo:', err);
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const categoriaSeleccionada = categorias.find(c => c.id === Number(categoria));

  return (
    <>
      {/* Overlay Gubernamental */}
      <div
        onClick={onCancelar}
        style={GobiernoComponents.overlay}
      >
        {/* Modal Gubernamental */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            ...GobiernoComponents.modal,
            maxWidth: '550px'
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
              ...GobiernoTypography.h2,
              fontSize: 'clamp(16px, 5vw, 20px)'
            }}>
              {modo === 'crear' ? 'Nuevo Tipo de Reporte' : 'Editar Tipo'}
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
            {categoriaSeleccionada && (
              <div style={{
                padding: '16px',
                background: `${categoriaSeleccionada.color}15`,
                borderRadius: '12px',
                border: `2px solid ${categoriaSeleccionada.color}40`,
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>{categoriaSeleccionada.icono}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                    {categoriaSeleccionada.nombre}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{icono}</span>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>
                      {nombre || 'Nombre del tipo'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Campo Categoría */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Categoría *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
                disabled={modo === 'editar'} // No permitir cambiar categoría en edición
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  background: modo === 'editar' ? '#f9fafb' : 'white',
                  cursor: modo === 'editar' ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="">Selecciona una categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icono} {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Campo Slug */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Slug (Identificador) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej: fuga_agua"
                pattern="[a-z0-9_]+"
                required
                disabled={modo === 'editar'} // No permitir cambiar slug en edición
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  background: modo === 'editar' ? '#f9fafb' : 'white',
                  cursor: modo === 'editar' ? 'not-allowed' : 'text'
                }}
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Solo letras minúsculas, números y guiones bajos (_)
              </div>
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
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Ej: Fuga de Agua"
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

            {/* Campo Descripción */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción opcional del tipo de reporte"
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
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

            {/* Campo Dependencia */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Dependencia Responsable *
              </label>
              <select
                value={dependencia}
                onChange={(e) => setDependencia(e.target.value)}
                required
                disabled={cargandoDependencias}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  backgroundColor: cargandoDependencias ? '#f9fafb' : 'white'
                }}
              >
                {cargandoDependencias ? (
                  <option>Cargando dependencias...</option>
                ) : (
                  dependencias.map((dep) => (
                    <option key={dep.slug} value={dep.slug}>
                      {dep.icono} {dep.nombre}
                    </option>
                  ))
                )}
              </select>
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
