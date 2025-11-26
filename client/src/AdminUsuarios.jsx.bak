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
      {/* Header - Estilo Gubernamental con Glassmorphism */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(226, 232, 240, 0.6)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '28px',
        boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(100, 116, 139, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        position: 'relative',
        overflow: 'hidden'
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
        
        {/* Content */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          position: 'relative',
          zIndex: 2,
          flexWrap: 'wrap'
        }}>
          {/* Avatar Gubernamental */}
          <div style={{
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, #475569, #64748b)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            color: 'white',
            boxShadow: '0 8px 24px -8px rgba(71, 85, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 32px -8px rgba(71, 85, 105, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 24px -8px rgba(71, 85, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
          }}
          >
            👥
          </div>
          
          {/* Text Content */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1e293b',
              letterSpacing: '-0.4px',
              lineHeight: '1.2',
              margin: '0 0 8px 0'
            }}>
              Administración de Usuarios
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              fontWeight: '500',
              marginBottom: '16px',
              lineHeight: '1.5',
              margin: 0
            }}>
              Gestiona los funcionarios y supervisores del sistema
            </p>
            {/* Stats */}
            <div style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              marginTop: '12px'
            }}>
              <div style={{
                padding: '6px 12px',
                background: 'rgba(71, 85, 105, 0.08)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                border: '1px solid rgba(71, 85, 105, 0.15)'
              }}>
                📊 Total: {usuarios.length}
              </div>
              <div style={{
                padding: '6px 12px',
                background: 'rgba(71, 85, 105, 0.08)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#475569',
                border: '1px solid rgba(71, 85, 105, 0.15)'
              }}>
                ✅ Activos: {usuarios.filter(u => u.activo === 1).length}
              </div>
            </div>
          </div>
          
          {/* Action Button - Gubernamental */}
          <button
            onClick={abrirModalNuevo}
            style={{
              background: 'linear-gradient(135deg, #475569, #64748b)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px -4px rgba(71, 85, 105, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px -4px rgba(71, 85, 105, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(71, 85, 105, 0.3)';
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span>
            Nuevo Usuario
          </button>
        </div>
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
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          overflow: 'hidden',
          boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.25s ease'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '900px'
          }}>
            <thead>
              <tr style={{ 
                background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
                color: 'white'
              }}>
                <th style={{
                  ...estiloEncabezado,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderBottom: 'none'
                }}>👤 Nombre</th>
                <th style={{
                  ...estiloEncabezado,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderBottom: 'none'
                }}>✉️ Email</th>
                <th style={{
                  ...estiloEncabezado,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderBottom: 'none'
                }}>🏢 Dependencia</th>
                <th style={{
                  ...estiloEncabezado,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderBottom: 'none'
                }}>⭐ Rol</th>
                <th style={{
                  ...estiloEncabezado,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderBottom: 'none'
                }}>🔄 Estado</th>
                <th style={{
                  ...estiloEncabezado,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderBottom: 'none'
                }}>📅 Creado</th>
                <th style={{
                  ...estiloEncabezado,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  borderBottom: 'none'
                }}>⚡ Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ 
                    textAlign: 'center', 
                    padding: DESIGN_SYSTEM.spacing['3xl'],
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                    color: DESIGN_SYSTEM.colors.neutral.medium,
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    <div style={{ marginBottom: '16px', fontSize: '48px', opacity: 0.5 }}>👥</div>
                    No hay usuarios que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario, index) => (
                <tr 
                  key={usuario.id}
                  style={{ 
                    borderBottom: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                    background: index % 2 === 0 ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' : 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #475569 0%, #64748b 100%)';
                    e.currentTarget.style.color = 'white';
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(71, 85, 105, 0.3)';
                    e.currentTarget.style.borderRadius = '12px';
                    e.currentTarget.style.margin = '4px 8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = index % 2 === 0 ? 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' : 'white';
                    e.currentTarget.style.color = 'inherit';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderRadius = '0';
                    e.currentTarget.style.margin = '0';
                  }}
                >
                  <td style={{
                    ...estiloCelda,
                    fontWeight: '700',
                    color: 'inherit'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #475569 0%, #64748b 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                      }}>
                        {usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '16px' }}>
                        {usuario.nombre}
                      </div>
                    </div>
                  </td>
                  <td style={estiloCelda}>
                    <div style={{ 
                      color: 'inherit', 
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {usuario.email}
                    </div>
                  </td>
                  <td style={estiloCelda}>
                    <span style={{
                      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                      background: 'rgba(71, 85, 105, 0.08)',
                      color: '#475569',
                      borderRadius: DESIGN_SYSTEM.border.radius.full,
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      border: '1px solid rgba(71, 85, 105, 0.15)',
                      boxShadow: '0 2px 8px rgba(71, 85, 105, 0.1)'
                    }}>
                      {dependencias.find(d => d.slug === usuario.dependencia)?.nombre || usuario.dependencia}
                    </span>
                  </td>
                  <td style={estiloCelda}>
                    <span style={{
                      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                      backgroundColor: usuario.rol === 'admin' ? '#dc2626' : usuario.rol === 'supervisor' ? '#475569' : '#475569',
                      color: 'white',
                      borderRadius: DESIGN_SYSTEM.border.radius.full,
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: `0 4px 12px ${usuario.rol === 'admin' ? '#dc262640' : usuario.rol === 'supervisor' ? 'rgba(71, 85, 105, 0.3)' : 'rgba(71, 85, 105, 0.3)'}`
                    }}>
                      {usuario.rol === 'admin' ? '👑 ADMIN' : usuario.rol === 'supervisor' ? '🔍 SUPERVISOR' : '⚙️ FUNCIONARIO'}
                    </span>
                  </td>
                  <td style={estiloCelda}>
                    <span style={{
                      padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                      backgroundColor: usuario.activo === 1 ? '#475569' : '#6b7280',
                      color: 'white',
                      borderRadius: DESIGN_SYSTEM.border.radius.full,
                      fontSize: '12px',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      justifyContent: 'center',
                      minWidth: '80px',
                      boxShadow: `0 4px 12px ${usuario.activo === 1 ? 'rgba(71, 85, 105, 0.3)' : '#6b728040'}`
                    }}>
                      {usuario.activo === 1 ? '🟢 ACTIVO' : '🔴 INACTIVO'}
                    </span>
                  </td>
                  <td style={estiloCelda}>
                    <div style={{ 
                      color: 'inherit',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      {new Date(usuario.creado_en).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td style={estiloCelda}>
                    <div style={{ 
                      display: 'flex', 
                      gap: DESIGN_SYSTEM.spacing.xs, 
                      justifyContent: 'center'
                    }}>
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        style={{
                          padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                          background: 'rgba(71, 85, 105, 0.08)',
                          color: '#475569',
                          border: '1px solid rgba(226, 232, 240, 0.8)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Editar usuario"
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(71, 85, 105, 0.12)';
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(71, 85, 105, 0.08)';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        ✏️ Editar
                      </button>
                      {usuario.id !== 1 && ( // No permitir eliminar admin principal
                        <button
                          onClick={() => handleEliminar(usuario)}
                          style={{
                            padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#dc2626',
                            border: '1px solid rgba(254, 202, 202, 0.8)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Desactivar usuario"
                          onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.12)';
                            e.target.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(239, 68, 68, 0.08)';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          🗑️
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
                    background: 'rgba(71, 85, 105, 0.08)',
                    color: '#475569',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: '1px solid rgba(71, 85, 105, 0.15)'
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
                        background: 'rgba(71, 85, 105, 0.08)',
                        color: '#475569',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
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

      {/* Modal de Crear/Editar - Estilo Gubernamental Glassmorphism */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '160px 20px 40px 20px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '16px',
            border: '1px solid rgba(226, 232, 240, 0.6)',
            maxWidth: '600px',
            width: '100%',
            maxHeight: 'none',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.12), 0 8px 24px -8px rgba(71, 85, 105, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.7)'
          }}>
            {/* Modal Header - Glassmorphism Gubernamental Premium */}
            <div style={{
              padding: 'clamp(16px, 4vw, 24px)',
              background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.04) 0%, rgba(100, 116, 139, 0.04) 100%)',
              borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              {/* Background Pattern */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 30% 30%, rgba(71, 85, 105, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(100, 116, 139, 0.05) 0%, transparent 50%)',
                zIndex: 0,
                pointerEvents: 'none'
              }} />
              
              {/* Header Content */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '20px',
                position: 'relative',
                zIndex: 1
              }}>
                {/* Dynamic Avatar */}
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #475569, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(71, 85, 105, 0.4)',
                  border: '3px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)'
                }}>
                  {formData.nombre ? 
                    formData.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '👤' 
                    : '👤'
                  }
                </div>
                
                {/* Title Section */}
                <div>
                  <h2 style={{ 
                    margin: 0,
                    fontSize: 'clamp(16px, 5vw, 20px)',
                    fontWeight: '700',
                    color: '#1e293b',
                    letterSpacing: '-0.3px',
                    marginBottom: '4px'
                  }}>
                    {modoEdicion ? '✨ Editar Usuario' : '🚀 Crear Nuevo Usuario'}
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#64748b',
                    fontWeight: '500'
                  }}>
                    {modoEdicion ? 'Modifica la información del usuario' : 'Añade un nuevo miembro al equipo'}
                  </p>
                </div>
              </div>
              
              {/* Premium Close Button */}
              <button
                onClick={cerrarModal}
                type="button"
                style={{
                  background: 'rgba(71, 85, 105, 0.08)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '12px',
                  fontSize: 'clamp(18px, 5vw, 24px)',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '12px',
                  lineHeight: '1',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '48px',
                  height: '48px',
                  position: 'relative',
                  zIndex: 1
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(71, 85, 105, 0.12)';
                  e.target.style.color = '#475569';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(71, 85, 105, 0.08)';
                  e.target.style.color = '#64748b';
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body - CLASS MUNDIAL Premium Layout */}
            <form onSubmit={handleSubmit} style={{ 
              background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
              overflowY: 'auto',
              flex: 1,
              padding: '0'
            }}>
              {/* Status Messages */}
              {(error || success) && (
                <div style={{ padding: '24px 32px 0 32px' }}>
                  {error && (
                    <div style={{
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fce7e7 100%)',
                      border: '2px solid #f87171',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      color: '#dc2626',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      boxShadow: '0 4px 12px rgba(248,113,113,0.2)'
                    }}>
                      <div style={{ fontSize: '20px' }}>⚠️</div>
                      <div>{error}</div>
                    </div>
                  )}

                  {success && (
                    <div style={{
                      padding: '16px 20px',
                      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)',
                      border: '2px solid rgba(71, 85, 105, 0.3)',
                      borderRadius: '12px',
                      marginBottom: '20px',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      boxShadow: '0 4px 12px rgba(71, 85, 105, 0.1)'
                    }}>
                      <div style={{ fontSize: '20px' }}>✅</div>
                      <div>{success}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Content - Premium Grid Layout */}
              <div style={{ 
                padding: '32px',
                display: 'grid',
                gap: '32px'
              }}>
                
                {/* SECTION 1: Personal Information */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #f1f5f9'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #475569, #64748b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                    }}>
                      👤
                    </div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1e293b',
                      letterSpacing: '-0.3px'
                    }}>
                      Información Personal
                    </h3>
                  </div>

                  {/* Nombre Field - Premium Design */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Nombre Completo *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        minLength="3"
                        placeholder="Ej: Juan Pérez García"
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '500',
                          backgroundColor: '#ffffff',
                          transition: 'all 0.3s ease',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#475569';
                          e.target.style.boxShadow = '0 0 0 4px rgba(71, 85, 105, 0.15)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      />
                    </div>
                    <p style={{
                      margin: '8px 0 0 0',
                      fontSize: '12px',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      💡 Mínimo 3 caracteres
                    </p>
                  </div>

                  {/* Email Field - Premium Design */}
                  <div style={{ marginBottom: '0' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Email Institucional *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="usuario@jantetelco.gob.mx"
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '500',
                          backgroundColor: '#ffffff',
                          transition: 'all 0.3s ease',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#475569';
                          e.target.style.boxShadow = '0 0 0 4px rgba(71, 85, 105, 0.15)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      />
                    </div>
                    <p style={{
                      margin: '8px 0 0 0',
                      fontSize: '12px',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      📧 Preferentemente con dominio @jantetelco.gob.mx
                    </p>
                  </div>
                </div>

                {/* SECTION 2: Security & Authentication */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #f1f5f9'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #475569, #64748b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                    }}>
                      🔐
                    </div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1e293b',
                      letterSpacing: '-0.3px'
                    }}>
                      Seguridad & Acceso
                    </h3>
                  </div>

                  {/* Password Field - Premium Design */}
                  <div style={{ marginBottom: '0' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Contraseña {modoEdicion ? '(dejar vacío para no cambiar)' : '*'}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!modoEdicion}
                        minLength="8"
                        placeholder="Mínimo 8 caracteres"
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '500',
                          backgroundColor: '#ffffff',
                          transition: 'all 0.3s ease',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#475569';
                          e.target.style.boxShadow = '0 0 0 4px rgba(71, 85, 105, 0.15)';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      />
                    </div>
                    <p style={{
                      margin: '8px 0 0 0',
                      fontSize: '12px',
                      color: '#64748b',
                      fontWeight: '500'
                    }}>
                      🔒 Debe incluir letras y números (mínimo 8 caracteres)
                    </p>
                  </div>
                </div>

                {/* SECTION 3: Role & Permissions */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '2px solid #f1f5f9'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #475569, #64748b)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                    }}>
                      ⚡
                    </div>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1e293b',
                      letterSpacing: '-0.3px'
                    }}>
                      Rol & Permisos
                    </h3>
                  </div>

                  {/* Grid for Dependencia y Rol */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '20px'
                  }}>
                    {/* Dependencia Field */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Dependencia *
                      </label>
                      <select
                        name="dependencia"
                        value={formData.dependencia}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '500',
                          backgroundColor: '#ffffff',
                          transition: 'all 0.3s ease',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#475569';
                          e.target.style.boxShadow = '0 0 0 4px rgba(71,85,105,0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        {dependencias.map(dep => (
                          <option key={dep.slug} value={dep.slug}>{dep.nombre}</option>
                        ))}
                      </select>
                      <p style={{
                        margin: '8px 0 0 0',
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        🏢 Departamento asignado
                      </p>
                    </div>

                    {/* Rol Field */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#374151',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Rol *
                      </label>
                      <select
                        name="rol"
                        value={formData.rol}
                        onChange={handleInputChange}
                        required
                        style={{
                          width: '100%',
                          padding: '16px 20px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '12px',
                          fontSize: '16px',
                          fontWeight: '500',
                          backgroundColor: '#ffffff',
                          transition: 'all 0.3s ease',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'pointer'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#475569';
                          e.target.style.boxShadow = '0 0 0 4px rgba(71,85,105,0.15)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        {roles.map(rol => (
                          <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                        ))}
                      </select>
                      <p style={{
                        margin: '8px 0 0 0',
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: '500'
                      }}>
                        ⚡ Nivel de acceso
                      </p>
                    </div>
                  </div>

                  {/* Permissions Info Card */}
                  <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRadius: '12px',
                    border: '1px solid rgba(71, 85, 105, 0.3)'
                  }}>
                    <div style={{
                      fontSize: '14px',
                      color: '#475569',
                      fontWeight: '600',
                      marginBottom: '8px'
                    }}>
                      💡 Información de Permisos
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#475569',
                      lineHeight: '1.5'
                    }}>
                      • <strong>Funcionario:</strong> Atiende reportes asignados<br/>
                      • <strong>Supervisor:</strong> Aprueba cierres y gestiona equipo<br/>
                      • <strong>Admin:</strong> Gestión completa del sistema
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Status (solo en edición) */}
                {modoEdicion && (
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '24px',
                      paddingBottom: '16px',
                      borderBottom: '2px solid #f1f5f9'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #475569, #64748b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        boxShadow: '0 4px 12px rgba(71, 85, 105, 0.3)'
                      }}>
                        🔄
                      </div>
                      <h3 style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: '700',
                        color: '#1e293b',
                        letterSpacing: '-0.3px'
                      }}>
                        Estado del Usuario
                      </h3>
                    </div>

                    {/* Active Switch - Premium Toggle */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px',
                      background: formData.activo ? 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.95) 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                      borderRadius: '12px',
                      border: formData.activo ? '2px solid #475569' : '2px solid #ef4444'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '700',
                          color: formData.activo ? '#475569' : '#dc2626',
                          marginBottom: '4px'
                        }}>
                          {formData.activo ? '✅ Usuario Activo' : '❌ Usuario Inactivo'}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: formData.activo ? '#475569' : '#991b1b'
                        }}>
                          {formData.activo ? 'Puede iniciar sesión y acceder al sistema' : 'No puede iniciar sesión ni acceder al sistema'}
                        </div>
                      </div>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '60px',
                        height: '34px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          name="activo"
                          checked={formData.activo}
                          onChange={handleInputChange}
                          style={{
                            opacity: 0,
                            width: 0,
                            height: 0
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: formData.activo ? '#475569' : '#ef4444',
                          borderRadius: '34px',
                          transition: 'all 0.4s ease',
                          cursor: 'pointer',
                          boxShadow: formData.activo ? '0 0 20px rgba(71,85,105,0.3)' : '0 0 20px rgba(239,68,68,0.3)'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '',
                            height: '26px',
                            width: '26px',
                            left: formData.activo ? '30px' : '4px',
                            bottom: '4px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: 'all 0.4s ease',
                            display: 'block',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }} />
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER - Premium Action Buttons */}
              <div style={{
                padding: '32px',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '16px',
                justifyContent: 'flex-end',
                borderBottomLeftRadius: '20px',
                borderBottomRightRadius: '20px'
              }}>
                {/* Cancel Button */}
                <button
                  type="button"
                  onClick={cerrarModal}
                  style={{
                    padding: '16px 32px',
                    background: 'white',
                    color: '#64748b',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minWidth: '140px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f8fafc';
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.color = '#475569';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.color = '#64748b';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  ❌ Cancelar
                </button>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={success !== null}
                  style={{
                    padding: '16px 32px',
                    background: 'linear-gradient(135deg, #475569, #64748b)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: success ? 'not-allowed' : 'pointer',
                    opacity: success ? 0.8 : 1,
                    minWidth: '180px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px -4px rgba(71, 85, 105, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!success) {
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = '0 6px 20px -4px rgba(71, 85, 105, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!success) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 16px -4px rgba(71, 85, 105, 0.3)';
                    }
                  }}
                >
                  {success ? '✅ ¡Guardado!' : (modoEdicion ? '💾 Guardar Cambios' : '🚀 Crear Usuario')}
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
  color: DESIGN_SYSTEM.colors.neutral.dark,
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  overflowWrap: 'break-word'
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
