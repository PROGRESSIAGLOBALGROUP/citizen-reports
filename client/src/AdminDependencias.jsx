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
import { DESIGN_SYSTEM, COMMON_STYLES } from './design-system';
import * as UnifiedStyles from './unified-section-headers';

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
      <div style={{ padding: DESIGN_SYSTEM.spacing.xl, textAlign: 'center' }}>
        <p style={{ color: DESIGN_SYSTEM.colors.neutral.medium }}>📡 Cargando dependencias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: DESIGN_SYSTEM.spacing.xl, textAlign: 'center', color: DESIGN_SYSTEM.colors.semantic.danger }}>
        <p>❌ {error}</p>
        <button 
          onClick={cargarDependencias}
          style={{
            marginTop: DESIGN_SYSTEM.spacing.md,
            padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.md}`,
            backgroundColor: DESIGN_SYSTEM.colors.primary.main,
            color: 'white',
            border: 'none',
            borderRadius: DESIGN_SYSTEM.border.radius.md,
            cursor: 'pointer',
            transition: DESIGN_SYSTEM.transition.standard
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = DESIGN_SYSTEM.colors.primary.dark}
          onMouseLeave={(e) => e.target.style.backgroundColor = DESIGN_SYSTEM.colors.primary.main}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      minHeight: fullscreen ? '100vh' : 'auto',
      fontFamily: DESIGN_SYSTEM.typography.fontFamily
    }}>
      {/* ===== HEADER GUBERNAMENTAL GLASSMORPHISM ===== */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(226, 232, 240, 0.6)',
        borderRadius: 'clamp(12px, 3vw, 20px)',
        padding: 'clamp(20px, 4vw, 32px)',
        margin: `clamp(16px, 3vw, 24px)`,
        marginBottom: 'clamp(20px, 4vw, 28px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(100, 116, 139, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        position: 'relative',
        overflow: 'hidden',
        gap: 'clamp(16px, 3vw, 24px)',
        flexWrap: 'wrap'
      }}>
        {/* Background overlay pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 20%, rgba(71, 85, 105, 0.03) 0%, transparent 60%)',
          pointerEvents: 'none'
        }} />
        
        {/* Left: Información Ejecutiva */}
        <div style={{ flex: '1 1 auto', position: 'relative', zIndex: 2, minWidth: '250px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(12px, 3vw, 20px)',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: 'clamp(56px, 12vw, 80px)',
              height: 'clamp(56px, 12vw, 80px)',
              background: 'linear-gradient(135deg, #475569, #64748b)',
              borderRadius: 'clamp(12px, 3vw, 16px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(20px, 5vw, 32px)',
              color: 'white',
              boxShadow: '0 8px 24px -8px rgba(71, 85, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px) scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(71, 85, 105, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(71, 85, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
            }}
            >
              🏛️
            </div>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(18px, 5vw, 28px)',
                fontWeight: '700',
                color: '#1e293b',
                letterSpacing: '-0.4px',
                lineHeight: '1.2',
                marginBottom: 'clamp(2px, 1vw, 6px)'
              }}>
                Administración de Dependencias
              </h1>
              <p style={{
                margin: 0,
                fontSize: 'clamp(13px, 3vw, 16px)',
                color: '#64748b',
                fontWeight: '500',
                lineHeight: '1.5'
              }}>
                Centro de operaciones • Gestión de departamentos y responsables
              </p>
            </div>
          </div>
        </div>

        {/* Right: Botón CTA Gubernamental */}
        <button
          onClick={() => setModalCrear(true)}
          style={{
            background: 'linear-gradient(135deg, #475569, #64748b)',
            color: 'white',
            border: 'none',
            padding: 'clamp(10px, 2vw, 14px) clamp(16px, 3vw, 24px)',
            borderRadius: 'clamp(8px, 2vw, 12px)',
            fontSize: 'clamp(13px, 2.5vw, 15px)',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'clamp(6px, 1.5vw, 10px)',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px -4px rgba(71, 85, 105, 0.3)',
            whiteSpace: 'nowrap',
            letterSpacing: '0.3px',
            position: 'relative',
            zIndex: 2,
            flex: '0 1 auto'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px) scale(1.02)';
            e.target.style.boxShadow = '0 8px 24px -2px rgba(71, 85, 105, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0) scale(1)';
            e.target.style.boxShadow = '0 4px 16px -4px rgba(71, 85, 105, 0.3)';
          }}
        >
          <span style={{ fontSize: 'clamp(14px, 3vw, 20px)', lineHeight: '1' }}>+</span>
          <span style={{ display: 'inline' }}>Nueva Dependencia</span>
        </button>
      </div>

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <div style={{ 
        flex: 1,
        padding: `clamp(16px, 3vw, 24px) clamp(12px, 3vw, 20px)`,
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%'
      }}>

        {/* Lista de dependencias */}
        {dependencias.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: `clamp(40px, 8vw, 80px) clamp(16px, 3vw, 24px)`,
            borderRadius: 'clamp(12px, 3vw, 16px)',
            border: `2px dashed rgba(226, 232, 240, 0.8)`,
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(241, 245, 249, 0.3) 100%)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}>
            <div style={{
              fontSize: 'clamp(40px, 15vw, 72px)',
              marginBottom: 'clamp(16px, 3vw, 24px)',
              opacity: 0.5
            }}>
              🏛️
            </div>
            <h3 style={{
              margin: 0,
              fontSize: 'clamp(16px, 4vw, 22px)',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: 'clamp(8px, 2vw, 12px)'
            }}>
              No hay dependencias registradas
            </h3>
            <p style={{
              margin: 0,
              fontSize: 'clamp(12px, 3vw, 15px)',
              color: '#64748b',
              marginBottom: 'clamp(16px, 3vw, 24px)',
              maxWidth: '450px',
              lineHeight: '1.5'
            }}>
              Crea la primera dependencia para comenzar a estructurar la administración municipal
            </p>
            <button
              onClick={() => setModalCrear(true)}
              style={{
                backgroundColor: '#475569',
                color: 'white',
                border: 'none',
                padding: `clamp(10px, 2vw, 12px) clamp(16px, 3vw, 24px)`,
                borderRadius: 'clamp(8px, 2vw, 12px)',
                fontSize: 'clamp(13px, 2.5vw, 15px)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'clamp(6px, 1.5vw, 10px)',
                transition: `all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                boxShadow: '0 4px 16px -2px rgba(71, 85, 105, 0.3)',
                letterSpacing: '0.3px'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#64748b';
                e.target.style.transform = 'translateY(-3px) scale(1.05)';
                e.target.style.boxShadow = '0 8px 24px -2px rgba(71, 85, 105, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#475569';
                e.target.style.transform = 'translateY(0) scale(1)';
                e.target.style.boxShadow = '0 4px 16px -2px rgba(71, 85, 105, 0.3)';
              }}
            >
              <span style={{ fontSize: 'clamp(14px, 3vw, 18px)' }}>+</span>
              <span>Crear primera dependencia</span>
            </button>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: 'clamp(12px, 3vw, 20px)',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            overflow: 'hidden',
            boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.06), 0 2px 8px -2px rgba(71, 85, 105, 0.08)',
            transition: 'all 0.3s ease'
          }}>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={dependencias.map(d => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse'
                  }}>
                    <thead>
                      <tr style={{ 
                        background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
                        color: 'white'
                      }}>
                        <th style={{
                          padding: 'clamp(12px, 2vw, 16px)',
                          textAlign: 'left',
                          fontSize: 'clamp(12px, 2.5vw, 14px)',
                          fontWeight: '700',
                          color: 'white',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          borderBottom: 'none'
                        }}>
                          📍 Dependencia
                        </th>
                        <th style={{
                          padding: 'clamp(12px, 2vw, 16px)',
                          textAlign: 'left',
                          fontSize: 'clamp(12px, 2.5vw, 14px)',
                          fontWeight: '700',
                          color: 'white',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          borderBottom: 'none'
                        }}>
                          Responsable
                        </th>
                        <th style={{
                          padding: 'clamp(12px, 2vw, 16px)',
                          textAlign: 'left',
                          fontSize: 'clamp(12px, 2.5vw, 14px)',
                          fontWeight: '700',
                          color: 'white',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          borderBottom: 'none'
                        }}>
                          Estado
                        </th>
                        <th style={{
                          padding: 'clamp(12px, 2vw, 16px)',
                          textAlign: 'center',
                          fontSize: 'clamp(12px, 2.5vw, 14px)',
                          fontWeight: '700',
                          color: 'white',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                          textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          borderBottom: 'none'
                        }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependencias.map((dep) => (
                        <tr
                          key={dep.id}
                          style={{
                            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
                            transition: `all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                            cursor: 'grab'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(71, 85, 105, 0.04)';
                            e.currentTarget.style.boxShadow = 'inset 0 0 12px rgba(71, 85, 105, 0.08)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <td style={{
                            padding: 'clamp(12px, 2vw, 16px)',
                            fontSize: 'clamp(12px, 2.5vw, 15px)',
                            fontWeight: '600'
                          }}>
                            <SortableItemDependencia
                              dep={dep}
                              onEditar={() => {
                                setDependenciaEditar(dep);
                                setModalEditar(true);
                              }}
                              onEliminar={() => handleEliminar(dep.id, dep.nombre)}
                            />
                          </td>
                          <td style={{
                            padding: 'clamp(12px, 2vw, 16px)',
                            fontSize: 'clamp(12px, 2.5vw, 15px)',
                            color: '#64748b'
                          }}>
                            {dep.responsable || '—'}
                          </td>
                          <td style={{
                            padding: 'clamp(12px, 2vw, 16px)',
                            fontSize: 'clamp(12px, 2.5vw, 14px)'
                          }}>
                            <span style={{
                              padding: `clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 12px)`,
                              backgroundColor: dep.activo ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: dep.activo ? '#059669' : '#dc2626',
                              borderRadius: 'clamp(6px, 1.5vw, 10px)',
                              fontSize: 'clamp(11px, 2vw, 12px)',
                              fontWeight: '700',
                              display: 'inline-block',
                              border: `1px solid ${dep.activo ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              letterSpacing: '0.3px',
                              textTransform: 'uppercase'
                            }}>
                              {dep.activo ? '✓ Activa' : '✕ Inactiva'}
                            </span>
                          </td>
                          <td style={{
                            padding: 'clamp(12px, 2vw, 16px)',
                            textAlign: 'center'
                          }}>
                            <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 8px)', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <button
                                onClick={() => {
                                  setDependenciaEditar(dep);
                                  setModalEditar(true);
                                }}
                                style={{
                                  padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 12px)',
                                  background: 'rgba(71, 85, 105, 0.08)',
                                  color: '#475569',
                                  border: '1px solid rgba(226, 232, 240, 0.8)',
                                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                                  fontSize: 'clamp(11px, 2vw, 12px)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(71, 85, 105, 0.15)';
                                  e.target.style.borderColor = 'rgba(71, 85, 105, 0.4)';
                                  e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(71, 85, 105, 0.08)';
                                  e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                                  e.target.style.transform = 'translateY(0)';
                                }}
                                title="Editar"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleEliminar(dep.id, dep.nombre)}
                                style={{
                                  padding: 'clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 12px)',
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  color: '#dc2626',
                                  border: '1px solid rgba(254, 202, 202, 0.8)',
                                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                                  fontSize: 'clamp(11px, 2vw, 12px)',
                                  fontWeight: '600',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                                  e.target.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.08)';
                                  e.target.style.borderColor = 'rgba(254, 202, 202, 0.8)';
                                  e.target.style.transform = 'translateY(0)';
                                }}
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

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

// Componente para filas de tabla sortable
function SortableItemDependencia({ dep, onEditar, onEliminar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dep.id });
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'contents'
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <span style={{ fontSize: '24px', lineHeight: '1' }}>{dep.icono}</span>
        <div>
          <div style={{ fontWeight: '600', color: DESIGN_SYSTEM.colors.neutral.dark }}>
            {dep.nombre}
          </div>
          <div style={{ fontSize: '12px', color: dep.color, fontWeight: '600', textTransform: 'uppercase' }}>
            {dep.slug}
          </div>
        </div>
      </div>
    </div>
  );
}

SortableItemDependencia.propTypes = {
  dep: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    nombre: PropTypes.string.isRequired,
    icono: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    responsable: PropTypes.string,
    activo: PropTypes.number.isRequired,
  }).isRequired,
  onEditar: PropTypes.func.isRequired,
  onEliminar: PropTypes.func.isRequired
};

// Componente Item de Dependencia (Sortable)
function ItemDependencia({ dependencia, onEditar, onEliminar }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: dependencia.id });
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: `all ${DESIGN_SYSTEM.transition.smooth}`,
        boxShadow: isDragging 
          ? `0 24px 48px rgba(2, 132, 199, 0.3)` 
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
        transform: isDragging ? 'scale(1.04) translateY(-2px)' : 'scale(1) translateY(0)',
        border: `1px solid ${isDragging ? DESIGN_SYSTEM.colors.primary.main : 'rgba(226, 232, 240, 0.5)'}`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      {/* Drag Handle - Top Right */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          cursor: 'grab',
          padding: '8px',
          color: dependencia.activo ? dependencia.color : '#cbd5e1',
          fontSize: '18px',
          opacity: isDragging ? 1 : 0.3,
          transition: `all ${DESIGN_SYSTEM.transition.fast}`,
          userSelect: 'none',
          zIndex: 10,
          lineHeight: '1'
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '1';
          e.target.style.color = dependencia.color;
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '0.3';
          e.target.style.color = dependencia.activo ? dependencia.color : '#cbd5e1';
        }}
      >
        ⋮⋮
      </div>

      {/* Header Icon Background */}
      <div style={{
        background: `linear-gradient(135deg, ${dependencia.color}15 0%, ${dependencia.color}08 100%)`,
        borderBottom: `2px solid ${dependencia.color}20`,
        padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.lg}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '120px'
      }}>
        <div style={{
          fontSize: '52px',
          filter: `drop-shadow(0 4px 12px ${dependencia.color}30)`,
          lineHeight: '1'
        }}>
          {dependencia.icono}
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: `${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.lg}`,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: `${DESIGN_SYSTEM.spacing.md}`
      }}>
        {/* Title */}
        <h3 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: '700',
          color: DESIGN_SYSTEM.colors.neutral.dark,
          lineHeight: '1.3',
          wordBreak: 'break-word'
        }}>
          {dependencia.nombre}
        </h3>

        {/* Slug */}
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: dependencia.color,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          opacity: 0.8
        }}>
          {dependencia.slug.replace(/_/g, ' ')}
        </div>

        {/* Descripción */}
        {dependencia.descripcion && (
          <p style={{
            margin: 0,
            fontSize: '13px',
            color: DESIGN_SYSTEM.colors.neutral.medium,
            lineHeight: '1.5',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {dependencia.descripcion}
          </p>
        )}

        {/* Responsable Info */}
        {dependencia.responsable && (
          <div style={{
            fontSize: '13px',
            color: DESIGN_SYSTEM.colors.neutral.medium,
            marginTop: 'auto',
            paddingTop: DESIGN_SYSTEM.spacing.md,
            borderTop: `1px solid rgba(0, 0, 0, 0.06)`
          }}>
            <span style={{ fontWeight: '600' }}>�</span> {dependencia.responsable}
          </div>
        )}

        {/* Status Badge */}
        <div style={{
          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.md}`,
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '700',
          backgroundColor: dependencia.activo ? '#d1fae5' : '#fee2e2',
          color: dependencia.activo ? '#065f46' : '#991b1b',
          textAlign: 'center',
          letterSpacing: '0.3px',
          textTransform: 'uppercase',
          boxShadow: dependencia.activo 
            ? '0 2px 8px rgba(16, 185, 129, 0.15)' 
            : '0 2px 8px rgba(239, 68, 68, 0.15)'
        }}>
          {dependencia.activo ? '✓ ACTIVA' : '✗ INACTIVA'}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: `${DESIGN_SYSTEM.spacing.md} ${DESIGN_SYSTEM.spacing.lg} ${DESIGN_SYSTEM.spacing.lg}`,
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        display: 'flex',
        gap: `${DESIGN_SYSTEM.spacing.md}`,
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onEditar}
          style={{
            flex: 1,
            minWidth: '100px',
            padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
            backgroundColor: `${DESIGN_SYSTEM.colors.primary.main}15`,
            color: DESIGN_SYSTEM.colors.primary.main,
            border: `2px solid ${DESIGN_SYSTEM.colors.primary.main}30`,
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: `all ${DESIGN_SYSTEM.transition.fast}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '40px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = DESIGN_SYSTEM.colors.primary.main;
            e.target.style.color = 'white';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 6px 12px ${DESIGN_SYSTEM.colors.primary.main}30`;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = `${DESIGN_SYSTEM.colors.primary.main}15`;
            e.target.style.color = DESIGN_SYSTEM.colors.primary.main;
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '16px' }}>✏️</span>
          <span>Editar</span>
        </button>
        <button
          onClick={onEliminar}
          style={{
            flex: 1,
            minWidth: '100px',
            padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: '2px solid #fecaca',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: `all ${DESIGN_SYSTEM.transition.fast}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            minHeight: '40px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#dc2626';
            e.target.style.color = 'white';
            e.target.style.borderColor = '#dc2626';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 12px rgba(220, 38, 38, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#fee2e2';
            e.target.style.color = '#dc2626';
            e.target.style.borderColor = '#fecaca';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '16px' }}>🗑️</span>
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
}

// PropTypes validation for ItemDependencia
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
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 'clamp(20px, 5vw, 40px)',
          paddingTop: 'clamp(100px, 15vw, 160px)',
          overflowY: 'auto'
        }}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: 'clamp(12px, 3vw, 20px)',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            width: '100%',
            maxWidth: 'clamp(280px, 90vw, 650px)',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 8px 24px -8px rgba(71, 85, 105, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
            margin: '0',
            maxHeight: '90vh',
            minHeight: '0'
          }}
        >
          {/* Header - Fixed Position */}
          <div style={{
            padding: 'clamp(14px, 3vw, 20px)',
            background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.04) 0%, rgba(100, 116, 139, 0.04) 100%)',
            borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            borderTopLeftRadius: 'clamp(12px, 3vw, 20px)',
            borderTopRightRadius: 'clamp(12px, 3vw, 20px)'
          }}>
            <h2 style={{ 
              margin: 0,
              fontSize: 'clamp(14px, 4vw, 18px)',
              fontWeight: '700',
              color: '#1e293b',
              letterSpacing: '-0.3px'
            }}>
              {modo === 'crear' ? '➕ Nueva Dependencia' : '✏️ Editar Dependencia'}
            </h2>
            <button
              onClick={onCancelar}
              type="button"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 'clamp(16px, 4vw, 22px)',
                cursor: 'pointer',
                color: '#94a3b8',
                padding: '4px 8px',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#64748b';
                e.target.style.background = 'rgba(226, 232, 240, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '#94a3b8';
                e.target.style.background = 'none';
              }}
            >
              ✕
            </button>
          </div>

          {/* Form - Scrollable */}
          <form onSubmit={handleSubmit} style={{ 
            padding: 'clamp(14px, 3vw, 20px)',
            overflowY: 'auto',
            flex: 1
          }}>
            {error && (
              <div style={{
                padding: 'clamp(10px, 2vw, 12px)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#dc2626',
                borderRadius: 'clamp(6px, 1.5vw, 8px)',
                marginBottom: 'clamp(12px, 2vw, 16px)',
                fontSize: 'clamp(12px, 2vw, 14px)',
                border: '1px solid rgba(239, 68, 68, 0.25)'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Slug */}
            <div style={{ marginBottom: 'clamp(14px, 3vw, 18px)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)',
                  border: '1px solid #d1d5db',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  backgroundColor: modo === 'editar' ? '#f9fafb' : 'white',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
              <p style={{ fontSize: 'clamp(11px, 2vw, 12px)', color: '#6b7280', margin: 'clamp(3px, 1vw, 4px) 0 0 0' }}>
                Solo letras minúsculas, números y guiones bajos (_)
              </p>
            </div>

            {/* Nombre */}
            <div style={{ marginBottom: 'clamp(14px, 3vw, 18px)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)',
                  border: '1px solid #d1d5db',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Descripción */}
            <div style={{ marginBottom: 'clamp(14px, 3vw, 18px)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
                fontWeight: '600',
                color: '#374151'
              }}>
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción opcional..."
                rows={2}
                style={{
                  width: '100%',
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)',
                  border: '1px solid #d1d5db',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Icono y Color */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 'clamp(12px, 2vw, 16px)',
              marginBottom: 'clamp(14px, 3vw, 18px)'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  Icono *
                </label>
                <div style={{ display: 'flex', gap: 'clamp(6px, 1.5vw, 8px)' }}>
                  <div style={{
                    flex: 1,
                    padding: 'clamp(8px, 1.5vw, 10px)',
                    border: '1px solid #d1d5db',
                    borderRadius: 'clamp(6px, 1.5vw, 8px)',
                    fontSize: 'clamp(18px, 5vw, 24px)',
                    textAlign: 'center',
                    backgroundColor: '#f9fafb'
                  }}>
                    {icono}
                  </div>
                  <button
                    type="button"
                    onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
                    style={{
                      padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'clamp(6px, 1.5vw, 8px)',
                      cursor: 'pointer',
                      fontSize: 'clamp(11px, 2vw, 13px)',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#2563eb';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#3b82f6';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    😀
                  </button>
                </div>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                    height: 'clamp(36px, 8vw, 44px)',
                    border: '1px solid #d1d5db',
                    borderRadius: 'clamp(6px, 1.5vw, 8px)',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </div>

            {/* Emoji Picker */}
            {mostrarEmojiPicker && (
              <div style={{
                marginBottom: 'clamp(14px, 3vw, 18px)',
                padding: 'clamp(12px, 2vw, 16px)',
                backgroundColor: '#f9fafb',
                borderRadius: 'clamp(6px, 1.5vw, 8px)',
                border: '1px solid #e5e7eb'
              }}>
                <p style={{ fontSize: 'clamp(11px, 2vw, 12px)', color: '#6b7280', marginBottom: 'clamp(8px, 1.5vw, 12px)', margin: 0 }}>
                  Selecciona un emoji:
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(36px, 1fr))',
                  gap: 'clamp(6px, 1.5vw, 8px)'
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
                        fontSize: 'clamp(16px, 4vw, 20px)',
                        padding: 'clamp(6px, 1.5vw, 8px)',
                        border: '1px solid #d1d5db',
                        borderRadius: 'clamp(4px, 1vw, 6px)',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f0f4f8';
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.transform = 'scale(1.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'white';
                        e.target.style.borderColor = '#d1d5db';
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Responsable */}
            <div style={{ marginBottom: 'clamp(14px, 3vw, 18px)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)',
                  border: '1px solid #d1d5db',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Teléfono y Email */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 'clamp(10px, 2vw, 14px)',
              marginBottom: 'clamp(14px, 3vw, 18px)'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                    padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)',
                    border: '1px solid #d1d5db',
                    borderRadius: 'clamp(6px, 1.5vw, 8px)',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  marginBottom: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                    padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)',
                    border: '1px solid #d1d5db',
                    borderRadius: 'clamp(6px, 1.5vw, 8px)',
                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            {/* Dirección */}
            <div style={{ marginBottom: 'clamp(16px, 3vw, 20px)' }}>
              <label style={{
                display: 'block',
                marginBottom: 'clamp(6px, 1.5vw, 8px)',
                fontSize: 'clamp(12px, 2.5vw, 14px)',
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
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(10px, 2vw, 12px)',
                  border: '1px solid #d1d5db',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  boxSizing: 'border-box',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Botones */}
            <div style={{
              display: 'flex',
              gap: 'clamp(8px, 2vw, 12px)',
              justifyContent: 'flex-end',
              flexWrap: 'wrap-reverse'
            }}>
              <button
                type="button"
                onClick={onCancelar}
                style={{
                  flex: '1 1 auto',
                  minWidth: 'clamp(100px, 20vw, 140px)',
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e2e8f0';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f1f5f9';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                style={{
                  flex: '1 1 auto',
                  minWidth: 'clamp(100px, 20vw, 140px)',
                  padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
                  backgroundColor: guardando ? '#94a3b8' : '#475569',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'clamp(6px, 1.5vw, 8px)',
                  fontSize: 'clamp(12px, 2.5vw, 14px)',
                  fontWeight: '600',
                  cursor: guardando ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!guardando) {
                    e.target.style.backgroundColor = '#64748b';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!guardando) {
                    e.target.style.backgroundColor = '#475569';
                    e.target.style.transform = 'translateY(0)';
                  }
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
