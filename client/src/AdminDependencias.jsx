/**
 * AdminDependencias.jsx
 * UUID: h2e5f9g7-4e8d-11ef-9a4c-0242ac120009
 * Timestamp: 2025-10-09T04:29:00.847Z
 * 
 * Panel de administración de dependencias municipales
 * Características:
 * - CRUD completo (Crear, Leer, Actualizar, Eliminar)
 * - Drag & drop para reordenar
 * - Emoji picker para íconos
 * - Color picker para personalización
 * - Validación de datos antes de guardar
 * - Soft delete (desactivar en lugar de eliminar)
 */

import React from 'react';
import PropTypes from 'prop-types';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';

export default function AdminDependencias({ fullscreen = false }) {
  // PropTypes validation
  AdminDependencias.propTypes = {
    fullscreen: PropTypes.bool
  };
  const [dependencias, setDependencias] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [modalCrear, setModalCrear] = React.useState(false);
  const [modalEditar, setModalEditar] = React.useState(false);
  const [dependenciaEditar, setDependenciaEditar] = React.useState(null);

  // Configuración de drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    cargarDependencias();
  }, []);

  async function cargarDependencias() {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/dependencias', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Error al cargar dependencias');
      }
      
      const data = await response.json();
      setDependencias(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = dependencias.findIndex((d) => d.id === active.id);
      const newIndex = dependencias.findIndex((d) => d.id === over.id);

      const newOrder = arrayMove(dependencias, oldIndex, newIndex);
      setDependencias(newOrder);

      // Actualizar orden en backend
      actualizarOrden(active.id, newIndex);
    }
  }

  async function actualizarOrden(id, nuevoOrden) {
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/admin/dependencias/${id}/orden`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ nuevoOrden })
      });
    } catch (err) {
      console.error('Error actualizando orden:', err);
      cargarDependencias(); // Revertir en caso de error
    }
  }

  async function handleEliminar(id, nombre) {
    if (!confirm(`¿Eliminar la dependencia "${nombre}"?\n\nEsta acción desactivará la dependencia pero no eliminará los registros asociados.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/dependencias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      alert('Dependencia eliminada correctamente');
      cargarDependencias();
    } catch (err) {
      console.error('Error:', err);
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>📡 Cargando dependencias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <p>❌ {error}</p>
        <button 
          onClick={cargarDependencias}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: fullscreen ? '40px' : '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      minHeight: fullscreen ? '100vh' : 'auto'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            color: '#1e293b',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🏛️ Gestión de Dependencias
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: '#64748b',
            margin: 0
          }}>
            Configura las dependencias municipales del sistema
          </p>
        </div>
        
        <button
          onClick={() => setModalCrear(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#2563eb';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#3b82f6';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
          }}
        >
          <span style={{ fontSize: '18px' }}>➕</span>
          Nueva Dependencia
        </button>
      </div>

      {/* Lista de dependencias */}
      {dependencias.length === 0 ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '2px dashed #e2e8f0'
        }}>
          <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🏛️</p>
          <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>
            No hay dependencias registradas
          </p>
          <button
            onClick={() => setModalCrear(true)}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Crear primera dependencia
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={dependencias.map(d => d.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dependencias.map((dep) => (
                <ItemDependencia
                  key={dep.id}
                  dependencia={dep}
                  onEditar={() => {
                    setDependenciaEditar(dep);
                    setModalEditar(true);
                  }}
                  onEliminar={() => handleEliminar(dep.id, dep.nombre)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Modales */}
      {modalCrear && (
        <FormularioDependencia
          modo="crear"
          onGuardar={() => {
            setModalCrear(false);
            cargarDependencias();
          }}
          onCancelar={() => setModalCrear(false)}
        />
      )}

      {modalEditar && dependenciaEditar && (
        <FormularioDependencia
          modo="editar"
          dependencia={dependenciaEditar}
          onGuardar={() => {
            setModalEditar(false);
            setDependenciaEditar(null);
            cargarDependencias();
          }}
          onCancelar={() => {
            setModalEditar(false);
            setDependenciaEditar(null);
          }}
        />
      )}
    </div>
  );
}

// Componente Item de Dependencia (Sortable)
function ItemDependencia({ dependencia, onEditar, onEliminar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dependencia.id });
  
  // PropTypes validation
  ItemDependencia.propTypes = {
    dependencia: PropTypes.shape({
      id: PropTypes.number.isRequired,
      slug: PropTypes.string.isRequired,
      nombre: PropTypes.string.isRequired,
      descripcion: PropTypes.string,
      icono: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      responsable: PropTypes.string,
      telefono: PropTypes.string,
      activo: PropTypes.number.isRequired,
      orden: PropTypes.number.isRequired
    }).isRequired,
    onEditar: PropTypes.func.isRequired,
    onEliminar: PropTypes.func.isRequired
  };

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          padding: '8px',
          color: '#94a3b8',
          fontSize: '20px'
        }}
      >
        ⋮⋮
      </div>

      {/* Icono y color */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        backgroundColor: dependencia.color + '20',
        border: `2px solid ${dependencia.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px'
      }}>
        {dependencia.icono}
      </div>

      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#1e293b',
          marginBottom: '4px'
        }}>
          {dependencia.nombre}
        </div>
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          {dependencia.slug}
          {dependencia.descripcion && ` • ${dependencia.descripcion}`}
        </div>
        {dependencia.responsable && (
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            👤 {dependencia.responsable}
            {dependencia.telefono && ` • 📞 ${dependencia.telefono}`}
          </div>
        )}
      </div>

      {/* Estado */}
      <div style={{
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: dependencia.activo ? '#dcfce7' : '#fee2e2',
        color: dependencia.activo ? '#166534' : '#991b1b'
      }}>
        {dependencia.activo ? '✓ Activa' : '✗ Inactiva'}
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onEditar}
          style={{
            padding: '8px 12px',
            backgroundColor: '#f1f5f9',
            color: '#475569',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          title="Editar"
        >
          ✏️
        </button>
        <button
          onClick={onEliminar}
          style={{
            padding: '8px 12px',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
          title="Eliminar"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// Componente Formulario de Dependencia
function FormularioDependencia({ modo, dependencia, onGuardar, onCancelar }) {
  // PropTypes validation
  FormularioDependencia.propTypes = {
    modo: PropTypes.oneOf(['crear', 'editar']).isRequired,
    dependencia: PropTypes.shape({
      id: PropTypes.number,
      slug: PropTypes.string,
      nombre: PropTypes.string,
      descripcion: PropTypes.string,
      icono: PropTypes.string,
      color: PropTypes.string,
      responsable: PropTypes.string,
      telefono: PropTypes.string,
      email: PropTypes.string,
      direccion: PropTypes.string,
      orden: PropTypes.number
    }),
    onGuardar: PropTypes.func.isRequired,
    onCancelar: PropTypes.func.isRequired
  };
  const [slug, setSlug] = React.useState(dependencia?.slug || '');
  const [nombre, setNombre] = React.useState(dependencia?.nombre || '');
  const [descripcion, setDescripcion] = React.useState(dependencia?.descripcion || '');
  const [icono, setIcono] = React.useState(dependencia?.icono || '🏛️');
  const [color, setColor] = React.useState(dependencia?.color || '#6b7280');
  const [responsable, setResponsable] = React.useState(dependencia?.responsable || '');
  const [telefono, setTelefono] = React.useState(dependencia?.telefono || '');
  const [email, setEmail] = React.useState(dependencia?.email || '');
  const [direccion, setDireccion] = React.useState(dependencia?.direccion || '');
  const [mostrarEmojiPicker, setMostrarEmojiPicker] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState(null);

  const generarSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleNombreChange = (value) => {
    setNombre(value);
    if (modo === 'crear' && !slug) {
      setSlug(generarSlug(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        ? '/api/admin/dependencias'
        : `/api/admin/dependencias/${dependencia.id}`;
      
      const response = await fetch(url, {
        method: modo === 'crear' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          slug: slug.trim(),
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          icono,
          color,
          responsable: responsable.trim() || null,
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          direccion: direccion.trim() || null,
          orden: dependencia?.orden || 0,
          activo: 1
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar');
      }

      alert(modo === 'crear' ? 'Dependencia creada correctamente' : 'Dependencia actualizada correctamente');
      onGuardar();
    } catch (err) {
      console.error('Error:', err);
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
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ 
              margin: 0,
              fontSize: '20px',
              fontWeight: '700',
              color: '#1e293b'
            }}>
              {modo === 'crear' ? '➕ Nueva Dependencia' : '✏️ Editar Dependencia'}
            </h2>
            <button
              onClick={onCancelar}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
            {error && (
              <div style={{
                padding: '12px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Slug */}
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
                placeholder="ej: obras_publicas"
                disabled={modo === 'editar'}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: modo === 'editar' ? '#f9fafb' : 'white'
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
                Solo letras minúsculas, números y guiones bajos (_)
              </p>
            </div>

            {/* Nombre */}
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
                placeholder="Obras Públicas"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Descripción */}
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
                placeholder="Descripción opcional..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Icono y Color */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Icono *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{
                    flex: 1,
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '24px',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    {icono}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    😀 Seleccionar
                  </button>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Color *
                </label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            {/* Emoji Picker */}
            {mostrarEmojiPicker && (
              <div style={{
                marginBottom: '20px',
                padding: '16px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>
                  Selecciona un emoji:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: '8px'
                }}>
                  {['🏛️', '🏗️', '💡', '💧', '🚔', '🌳', '🌿', '🏥', '🏢', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗺️'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setIcono(emoji);
                        setMostrarEmojiPicker(false);
                      }}
                      style={{
                        fontSize: '24px',
                        padding: '8px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Responsable */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Responsable
              </label>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Nombre del responsable"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Teléfono y Email */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="735 123 4567"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dependencia@jantetelco.gob.mx"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Dirección */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Dirección
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, colonia"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Botones */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                type="button"
                onClick={onCancelar}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                style={{
                  padding: '10px 20px',
                  backgroundColor: guardando ? '#94a3b8' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: guardando ? 'not-allowed' : 'pointer'
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
