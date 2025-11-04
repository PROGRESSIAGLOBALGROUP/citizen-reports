import React, { useState, useEffect } from 'react';
import { DESIGN_SYSTEM, COMMON_STYLES } from './design-system';
import * as UnifiedStyles from './unified-section-headers';

/**
 * Componente de Administración de Usuarios
 * Permite CRUD completo de usuarios del sistema
 */
export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [dependencias, setDependencias] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [filtroActivo, setFiltroActivo] = useState('todos'); // todos, activos, inactivos
  const [filtroDependencia, setFiltroDependencia] = useState('todas');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: '',
    dependencia: 'obras_publicas',
    rol: 'funcionario',
    activo: true
  });

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    Promise.all([
      cargarUsuarios(),
      cargarDependencias(),
      cargarRoles()
    ]).then(() => setLoading(false));
  }, []);

  async function cargarUsuarios() {
    try {
      const res = await fetch('/api/usuarios');
      if (!res.ok) throw new Error('Error al cargar usuarios');
      const data = await res.json();
      setUsuarios(data);
    } catch (err) {
      setError('Error al cargar la lista de usuarios');
      console.error(err);
    }
  }

  async function cargarDependencias() {
    try {
      const res = await fetch('/api/dependencias');
      if (!res.ok) throw new Error('Error al cargar dependencias');
      const data = await res.json();
      setDependencias(data);
    } catch (err) {
      console.error('Error al cargar dependencias:', err);
    }
  }

  async function cargarRoles() {
    try {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Error al cargar roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error('Error al cargar roles:', err);
    }
  }

  function abrirModalNuevo() {
    setModoEdicion(false);
    setUsuarioActual(null);
    setFormData({
      email: '',
      nombre: '',
      password: '',
      dependencia: 'obras_publicas',
      rol: 'funcionario',
      activo: true
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  }

  function abrirModalEditar(usuario) {
    setModoEdicion(true);
    setUsuarioActual(usuario);
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      password: '', // No mostrar password actual
      dependencia: usuario.dependencia,
      rol: usuario.rol,
      activo: usuario.activo === 1
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  }

  function cerrarModal() {
    setShowModal(false);
    setModoEdicion(false);
    setUsuarioActual(null);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = modoEdicion 
        ? `/api/usuarios/${usuarioActual.id}`
        : '/api/usuarios';
      
      const method = modoEdicion ? 'PUT' : 'POST';
      
      // Si es edición y no se cambió el password, no enviarlo
      const body = { ...formData };
      if (modoEdicion && !body.password) {
        delete body.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar usuario');
      }

      setSuccess(data.mensaje || 'Usuario guardado exitosamente');
      await cargarUsuarios();
      
      setTimeout(() => {
        cerrarModal();
      }, 1500);

    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEliminar(usuario) {
    if (!confirm(`¿Está seguro de desactivar al usuario ${usuario.nombre}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al desactivar usuario');
      }

      setSuccess('Usuario desactivado exitosamente');
      await cargarUsuarios();

      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter(u => {
    // Filtro por estado activo/inactivo
    if (filtroActivo === 'activos' && u.activo !== 1) return false;
    if (filtroActivo === 'inactivos' && u.activo === 1) return false;
    
    // Filtro por dependencia
    if (filtroDependencia !== 'todas' && u.dependencia !== filtroDependencia) return false;
    
    return true;
  });

  if (loading) {
    return (
      <div style={{ padding: DESIGN_SYSTEM.spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: DESIGN_SYSTEM.typography.body.fontSize, color: DESIGN_SYSTEM.colors.neutral.dark }}>Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: DESIGN_SYSTEM.spacing.md,
      maxWidth: '1400px',
      margin: '0 auto',
      fontFamily: DESIGN_SYSTEM.typography.fontFamily
    }}>
      {/* Header - CLASS MUNDIAL Style */}
      <div style={{ ...UnifiedStyles.headerSection, marginBottom: DESIGN_SYSTEM.spacing['2xl'] }}>
        <div style={UnifiedStyles.headerIcon}>👥</div>
        <div style={UnifiedStyles.headerContent}>
          <h1 style={UnifiedStyles.headerTitle}>Administración de Usuarios</h1>
          <p style={UnifiedStyles.headerDescription}>Gestiona los funcionarios y supervisores del sistema</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          style={UnifiedStyles.primaryActionButton}
          onMouseEnter={(e) => {
            Object.assign(e.target.style, UnifiedStyles.primaryActionButtonHover);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.target.style, UnifiedStyles.primaryActionButton);
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Mensajes de éxito/error globales */}
      {success && !showModal && (
        <div style={{
          padding: DESIGN_SYSTEM.spacing.md,
          backgroundColor: `${DESIGN_SYSTEM.colors.semantic.success}22`,
          border: `1px solid ${DESIGN_SYSTEM.colors.semantic.success}`,
          borderRadius: DESIGN_SYSTEM.border.radius.md,
          marginBottom: DESIGN_SYSTEM.spacing['2xl'],
          color: DESIGN_SYSTEM.colors.semantic.success
        }}>
          ✓ {success}
        </div>
      )}

      {error && !showModal && (
        <div style={{
          padding: DESIGN_SYSTEM.spacing.md,
          backgroundColor: `${DESIGN_SYSTEM.colors.semantic.danger}22`,
          border: `1px solid ${DESIGN_SYSTEM.colors.semantic.danger}`,
          borderRadius: DESIGN_SYSTEM.border.radius.md,
          marginBottom: DESIGN_SYSTEM.spacing['2xl'],
          color: DESIGN_SYSTEM.colors.semantic.danger
        }}>
          ✕ {error}
        </div>
      )}

      {/* Filtros - Responsive */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? DESIGN_SYSTEM.spacing.sm : DESIGN_SYSTEM.spacing.md,
        marginBottom: DESIGN_SYSTEM.spacing['2xl'],
        padding: DESIGN_SYSTEM.spacing.md,
        backgroundColor: DESIGN_SYSTEM.colors.neutral.medium,
        borderRadius: DESIGN_SYSTEM.border.radius.md
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ 
            display: 'block', 
            fontSize: DESIGN_SYSTEM.typography.label.fontSize, 
            fontWeight: '600',
            color: DESIGN_SYSTEM.colors.neutral.dark,
            marginBottom: DESIGN_SYSTEM.spacing.xs
          }}>
            Estado
          </label>
          <select
            value={filtroActivo}
            onChange={(e) => setFiltroActivo(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? DESIGN_SYSTEM.spacing.sm : DESIGN_SYSTEM.spacing.xs,
              backgroundColor: DESIGN_SYSTEM.colors.neutral.light,
              border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
              borderRadius: DESIGN_SYSTEM.border.radius.md,
              fontSize: DESIGN_SYSTEM.typography.body.fontSize,
              minHeight: isMobile ? '44px' : 'auto',
              cursor: 'pointer'
            }}
          >
            <option value="todos">Todos</option>
            <option value="activos">Solo Activos</option>
            <option value="inactivos">Solo Inactivos</option>
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ 
            display: 'block', 
            fontSize: DESIGN_SYSTEM.typography.label.fontSize, 
            fontWeight: '600',
            color: DESIGN_SYSTEM.colors.neutral.dark,
            marginBottom: DESIGN_SYSTEM.spacing.xs
          }}>
            Dependencia
          </label>
          <select
            value={filtroDependencia}
            onChange={(e) => setFiltroDependencia(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? DESIGN_SYSTEM.spacing.sm : DESIGN_SYSTEM.spacing.xs,
              backgroundColor: DESIGN_SYSTEM.colors.neutral.light,
              border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
              borderRadius: DESIGN_SYSTEM.border.radius.md,
              fontSize: DESIGN_SYSTEM.typography.body.fontSize,
              minHeight: isMobile ? '44px' : 'auto',
              cursor: 'pointer'
            }}
          >
            <option value="todas">Todas las dependencias</option>
            {dependencias.map(dep => (
              <option key={dep.id} value={dep.id}>{dep.nombre}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: isMobile ? 'stretch' : 'flex-end',
          paddingBottom: isMobile ? '0' : '2px'
        }}>
          <div style={{
            padding: isMobile ? '12px 16px' : '10px 16px',
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            minHeight: isMobile ? '44px' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isMobile ? 'center' : 'flex-start',
            width: isMobile ? '100%' : 'auto'
          }}>
            Total: {usuariosFiltrados.length}
          </div>
        </div>
      </div>

      {/* Tabla de usuarios (Desktop) o Cards (Mobile) */}
      {!isMobile ? (
        /* Vista de Tabla para Desktop */
        <div style={{
          backgroundColor: DESIGN_SYSTEM.colors.neutral.light,
          borderRadius: DESIGN_SYSTEM.border.radius.lg,
          border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
          overflow: 'auto',
          boxShadow: DESIGN_SYSTEM.shadow.sm
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '900px'
          }}>
            <thead>
              <tr style={{ backgroundColor: DESIGN_SYSTEM.colors.neutral.medium }}>
                <th style={estiloEncabezado}>Nombre</th>
                <th style={estiloEncabezado}>Email</th>
                <th style={estiloEncabezado}>Dependencia</th>
                <th style={estiloEncabezado}>Rol</th>
                <th style={estiloEncabezado}>Estado</th>
                <th style={estiloEncabezado}>Creado</th>
                <th style={estiloEncabezado}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ 
                    textAlign: 'center', 
                    padding: DESIGN_SYSTEM.spacing.xl,
                    color: DESIGN_SYSTEM.colors.neutral.medium
                  }}>
                    No hay usuarios que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map(usuario => (
                <tr 
                  key={usuario.id}
                  style={{ 
                    borderBottom: `1px solid ${DESIGN_SYSTEM.colors.neutral.medium}`,
                    transition: DESIGN_SYSTEM.transition.default
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.medium}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={estiloCelda}>
                    <div style={{ fontWeight: '600', color: DESIGN_SYSTEM.colors.neutral.dark }}>
                      {usuario.nombre}
                    </div>
                  </td>
                  <td style={estiloCelda}>
                    <div style={{ color: DESIGN_SYSTEM.colors.neutral.medium, fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize }}>
                      {usuario.email}
                    </div>
                  </td>
                  <td style={estiloCelda}>
                    <span style={{
                      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.md}`,
                      backgroundColor: `${DESIGN_SYSTEM.colors.primary.main}22`,
                      color: DESIGN_SYSTEM.colors.primary.dark,
                      borderRadius: DESIGN_SYSTEM.border.radius.full,
                      fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize,
                      fontWeight: '600'
                    }}>
                      {dependencias.find(d => d.id === usuario.dependencia)?.nombre || usuario.dependencia}
                    </span>
                  </td>
                  <td style={estiloCelda}>
                    <span style={{
                      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.md}`,
                      backgroundColor: usuario.rol === 'admin' ? `${DESIGN_SYSTEM.colors.semantic.warning}22` : usuario.rol === 'supervisor' ? `${DESIGN_SYSTEM.colors.primary.light}22` : DESIGN_SYSTEM.colors.neutral.medium,
                      color: usuario.rol === 'admin' ? DESIGN_SYSTEM.colors.semantic.warning : usuario.rol === 'supervisor' ? DESIGN_SYSTEM.colors.primary.dark : DESIGN_SYSTEM.colors.neutral.dark,
                      borderRadius: DESIGN_SYSTEM.border.radius.full,
                      fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize,
                      fontWeight: '600'
                    }}>
                      {usuario.rol.toUpperCase()}
                    </span>
                  </td>
                  <td style={estiloCelda}>
                    <span style={{
                      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.md}`,
                      backgroundColor: usuario.activo === 1 ? `${DESIGN_SYSTEM.colors.semantic.success}22` : `${DESIGN_SYSTEM.colors.semantic.danger}22`,
                      color: usuario.activo === 1 ? DESIGN_SYSTEM.colors.semantic.success : DESIGN_SYSTEM.colors.semantic.danger,
                      borderRadius: DESIGN_SYSTEM.border.radius.full,
                      fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize,
                      fontWeight: '600'
                    }}>
                      {usuario.activo === 1 ? '✓ Activo' : '✕ Inactivo'}
                    </span>
                  </td>
                  <td style={estiloCelda}>
                    <div style={{ color: DESIGN_SYSTEM.colors.neutral.medium, fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize }}>
                      {new Date(usuario.creado_en).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td style={estiloCelda}>
                    <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.md, justifyContent: 'center' }}>
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        style={{
                          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                          backgroundColor: DESIGN_SYSTEM.colors.primary.main,
                          color: 'white',
                          border: 'none',
                          borderRadius: DESIGN_SYSTEM.border.radius.md,
                          fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize,
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: DESIGN_SYSTEM.transition.default
                        }}
                        title="Editar usuario"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.primary.dark}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.primary.main}
                      >
                        ✏️ Editar
                      </button>
                      {usuario.id !== 1 && ( // No permitir eliminar admin principal
                        <button
                          onClick={() => handleEliminar(usuario)}
                          style={{
                            padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                            backgroundColor: usuario.activo === 1 ? DESIGN_SYSTEM.colors.semantic.danger : DESIGN_SYSTEM.colors.neutral.medium,
                            color: 'white',
                            border: 'none',
                            borderRadius: DESIGN_SYSTEM.border.radius.md,
                            fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize,
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: DESIGN_SYSTEM.transition.default
                          }}
                          title="Desactivar usuario"
                          disabled={usuario.activo !== 1}
                          onMouseEnter={(e) => usuario.activo === 1 && (e.currentTarget.style.backgroundColor = '#dc2626')}
                          onMouseLeave={(e) => usuario.activo === 1 && (e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.semantic.danger)}
                        >
                          🗑️ Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))

            )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vista de Cards para Mobile */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {usuariosFiltrados.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              No hay usuarios que coincidan con los filtros
            </div>
          ) : (
            usuariosFiltrados.map(usuario => (
              <div
                key={usuario.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                {/* Nombre y Estado */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '16px',
                      fontWeight: '700',
                      color: '#111827',
                      marginBottom: '4px'
                    }}>
                      {usuario.nombre}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6b7280',
                      wordBreak: 'break-all'
                    }}>
                      {usuario.email}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: usuario.activo === 1 ? '#dcfce7' : '#fee2e2',
                    color: usuario.activo === 1 ? '#166534' : '#991b1b',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    marginLeft: '8px'
                  }}>
                    {usuario.activo === 1 ? '✓ Activo' : '✕ Inactivo'}
                  </span>
                </div>

                {/* Dependencia y Rol */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {dependencias.find(d => d.id === usuario.dependencia)?.nombre || usuario.dependencia}
                  </span>
                  <span style={{
                    padding: '4px 12px',
                    backgroundColor: usuario.rol === 'admin' ? '#fef3c7' : usuario.rol === 'supervisor' ? '#e0e7ff' : '#f3f4f6',
                    color: usuario.rol === 'admin' ? '#92400e' : usuario.rol === 'supervisor' ? '#3730a3' : '#1f2937',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {usuario.rol.toUpperCase()}
                  </span>
                </div>

                {/* Fecha y Acciones */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  paddingTop: '12px',
                  borderTop: '1px solid #f3f4f6'
                }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#9ca3af'
                  }}>
                    {new Date(usuario.creado_en).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => abrirModalEditar(usuario)}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ✏️ Editar
                    </button>
                    {usuario.id !== 1 && usuario.activo === 1 && (
                      <button
                        onClick={() => handleEliminar(usuario)}
                        style={{
                          padding: '8px 14px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Crear/Editar - Responsive */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: isMobile ? '0' : '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: isMobile ? '0' : '12px',
            maxWidth: isMobile ? '100%' : '600px',
            width: '100%',
            maxHeight: isMobile ? '100vh' : '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            marginTop: isMobile ? '0' : 'auto',
            marginBottom: isMobile ? '0' : 'auto'
          }}>
            {/* Modal Header - Responsive */}
            <div style={{
              padding: isMobile ? '16px' : '24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: isMobile ? 'sticky' : 'static',
              top: 0,
              backgroundColor: 'white',
              zIndex: 10
            }}>
              <h2 style={{
                fontSize: isMobile ? '18px' : '20px',
                fontWeight: '700',
                color: '#111827',
                margin: 0
              }}>
                {modoEdicion ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
              </h2>
              <button
                onClick={cerrarModal}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  padding: '8px',
                  lineHeight: '1',
                  minWidth: '44px',
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body - Responsive */}
            <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '24px' }}>
              {error && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  color: '#991b1b',
                  fontSize: '14px'
                }}>
                  ✕ {error}
                </div>
              )}

              {success && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #86efac',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  color: '#166534',
                  fontSize: '14px'
                }}>
                  ✓ {success}
                </div>
              )}

              {/* Nombre */}
              <div style={{ marginBottom: '20px' }}>
                <label style={estiloLabel}>
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  minLength="3"
                  placeholder="Ej: Juan Pérez García"
                  style={estiloInput}
                />
                <p style={estiloAyuda}>
                  Mínimo 3 caracteres
                </p>
              </div>

              {/* Email */}
              <div style={{ marginBottom: '20px' }}>
                <label style={estiloLabel}>
                  Email Institucional *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="usuario@jantetelco.gob.mx"
                  style={estiloInput}
                />
                <p style={estiloAyuda}>
                  Preferentemente con dominio @jantetelco.gob.mx
                </p>
              </div>

              {/* Password */}
              <div style={{ marginBottom: '20px' }}>
                <label style={estiloLabel}>
                  Contraseña {modoEdicion ? '(dejar vacío para no cambiar)' : '*'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!modoEdicion}
                  minLength="8"
                  placeholder="Mínimo 8 caracteres"
                  style={estiloInput}
                />
                <p style={estiloAyuda}>
                  Debe incluir letras y números (mínimo 8 caracteres)
                </p>
              </div>

              {/* Dependencia */}
              <div style={{ marginBottom: '20px' }}>
                <label style={estiloLabel}>
                  Dependencia *
                </label>
                <select
                  name="dependencia"
                  value={formData.dependencia}
                  onChange={handleInputChange}
                  required
                  style={estiloInput}
                >
                  {dependencias.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.nombre}</option>
                  ))}
                </select>
                <p style={estiloAyuda}>
                  Define qué reportes puede ver y atender
                </p>
              </div>

              {/* Rol */}
              <div style={{ marginBottom: '20px' }}>
                <label style={estiloLabel}>
                  Rol *
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleInputChange}
                  required
                  style={estiloInput}
                >
                  {roles.map(rol => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
                <p style={estiloAyuda}>
                  • Funcionario: Atiende reportes | Supervisor: Aprueba cierres | Admin: Gestión completa
                </p>
              </div>

              {/* Estado Activo */}
              {modoEdicion && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleInputChange}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    Usuario Activo
                  </label>
                  <p style={estiloAyuda}>
                    Los usuarios inactivos no pueden iniciar sesión
                  </p>
                </div>
              )}

              {/* Botones - Responsive */}
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column-reverse' : 'row',
                gap: '12px',
                marginTop: isMobile ? '24px' : '32px',
                paddingTop: isMobile ? '16px' : '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    flex: 1,
                    padding: isMobile ? '14px' : '12px',
                    backgroundColor: 'white',
                    color: '#374151',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '44px'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={success !== null}
                  style={{
                    flex: 1,
                    padding: isMobile ? '14px' : '12px',
                    backgroundColor: success ? '#10b981' : '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: success ? 'not-allowed' : 'pointer',
                    opacity: success ? 0.7 : 1,
                    minHeight: '44px'
                  }}
                >
                  {success ? '✓ Guardado' : (modoEdicion ? 'Guardar Cambios' : 'Crear Usuario')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos reutilizables (usando DESIGN_SYSTEM)
const estiloEncabezado = {
  padding: DESIGN_SYSTEM.spacing.md,
  textAlign: 'left',
  fontSize: DESIGN_SYSTEM.typography.label.fontSize,
  fontWeight: '700',
  color: DESIGN_SYSTEM.colors.neutral.medium,
  textTransform: 'uppercase',
  letterSpacing: DESIGN_SYSTEM.typography.label.letterSpacing
};

const estiloCelda = {
  padding: DESIGN_SYSTEM.spacing.md,
  fontSize: DESIGN_SYSTEM.typography.body.fontSize
};

const estiloLabel = {
  display: 'block',
  marginBottom: DESIGN_SYSTEM.spacing.md,
  fontSize: DESIGN_SYSTEM.typography.body.fontSize,
  fontWeight: '600',
  color: DESIGN_SYSTEM.colors.neutral.dark
};

const estiloInput = {
  width: '100%',
  padding: DESIGN_SYSTEM.spacing.sm,
  backgroundColor: DESIGN_SYSTEM.colors.neutral.light,
  border: `2px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
  borderRadius: DESIGN_SYSTEM.border.radius.md,
  fontSize: DESIGN_SYSTEM.typography.body.fontSize,
  fontFamily: DESIGN_SYSTEM.typography.fontFamily,
  transition: DESIGN_SYSTEM.transition.default,
  outline: 'none'
};

const estiloAyuda = {
  margin: `${DESIGN_SYSTEM.spacing.xs} 0 0 0`,
  fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize,
  color: DESIGN_SYSTEM.colors.neutral.medium,
  fontStyle: 'italic'
};
