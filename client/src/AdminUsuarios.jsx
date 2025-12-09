import React, { useState, useEffect } from 'react';
import './gobierno-premium-panel.css';
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
  const [busqueda, setBusqueda] = useState(''); // Nuevo: Búsqueda por texto
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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

      const token = localStorage.getItem('auth_token');
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/usuarios/${usuario.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
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
    
    // Filtro por búsqueda (nombre o email)
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      const nombre = u.nombre.toLowerCase();
      const email = u.email.toLowerCase();
      if (!nombre.includes(termino) && !email.includes(termino)) return false;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="gp-loading-center">
        <div>Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="gobierno-premium">
      {/* Header - Premium Gubernamental */}
      <div className="gp-admin-header">
        <div className="gp-admin-header-icon">👥</div>
        <div className="gp-admin-header-content">
          <h1 className="gp-admin-header-title">Administración de Usuarios</h1>
          <p className="gp-admin-header-subtitle">Gestiona los funcionarios y supervisores del sistema</p>
          <div className="gp-admin-header-stats">
            <span className="gp-admin-stat">📊 Total: {usuarios.length}</span>
            <span className="gp-admin-stat success">✅ Activos: {usuarios.filter(u => u.activo === 1).length}</span>
          </div>
        </div>
        <button onClick={abrirModalNuevo} className="gp-admin-header-action">
          <span>+</span> Nuevo Usuario
        </button>
      </div>

      {/* Mensajes de éxito/error globales */}
      {success && !showModal && (
        <div className="gp-alert gp-alert-success gp-mb-24">
          <span className="gp-alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {error && !showModal && (
        <div className="gp-alert gp-alert-error gp-mb-24">
          <span className="gp-alert-icon">✕</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filtros Premium */}
      <div className="gp-admin-filters">
        <span className="gp-admin-filters-label">🔍 BUSCAR USUARIO</span>
        <div className="gp-admin-search">
          <span className="gp-admin-search-icon">🔍</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre o email..."
          />
        </div>
        <select
          value={filtroActivo}
          onChange={(e) => setFiltroActivo(e.target.value)}
          className="gp-admin-filter-select"
        >
          <option value="todos">Todos</option>
          <option value="activos">Solo Activos</option>
          <option value="inactivos">Solo Inactivos</option>
        </select>
        <select
          value={filtroDependencia}
          onChange={(e) => setFiltroDependencia(e.target.value)}
          className="gp-admin-filter-select"
        >
          <option value="todas">Todas las dependencias</option>
          {dependencias.map(dep => (
            <option key={dep.id} value={dep.id}>{dep.nombre}</option>
          ))}
        </select>
        <span className="gp-admin-filter-count">Total: {usuariosFiltrados.length}</span>
      </div>

      {/* Tabla de usuarios (Desktop) */}
      {!isMobile ? (
        <div className="gp-admin-table-container">
          <table className="gp-admin-table">
            <thead>
              <tr>
                <th>👤 NOMBRE</th>
                <th>✉️ EMAIL</th>
                <th>🏢 DEPENDENCIA</th>
                <th>⭐ ROL</th>
                <th>🔄 ESTADO</th>
                <th>📅 CREADO</th>
                <th>⚡ ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="gp-table-empty-cell">
                    <div className="gp-empty-state">
                      <div className="gp-empty-icon">🔍</div>
                      <h3 className="gp-empty-title">Sin resultados</h3>
                      <p className="gp-empty-description">No se encontraron usuarios con los filtros actuales</p>
                    </div>
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((usuario) => (
                <tr key={usuario.id}>
                  <td>
                    <div className="gp-table-user-cell">
                      <div className="gp-admin-table-avatar">
                        {usuario.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <span className="gp-admin-table-name">{usuario.nombre}</span>
                    </div>
                  </td>
                  <td><span className="gp-admin-table-email">{usuario.email}</span></td>
                  <td>
                    <span className="gp-admin-table-badge funcionario">
                      {dependencias.find(d => d.slug === usuario.dependencia)?.nombre || usuario.dependencia}
                    </span>
                  </td>
                  <td>
                    <span className={`gp-admin-table-badge ${usuario.rol}`}>
                      {usuario.rol === 'admin' ? '👑 ADMIN' : usuario.rol === 'supervisor' ? '🔍 SUPERVISOR' : '⚙️ FUNCIONARIO'}
                    </span>
                  </td>
                  <td>
                    <span className={`gp-admin-table-badge ${usuario.activo === 1 ? 'activo' : 'inactivo'}`}>
                      {usuario.activo === 1 ? '● Activo' : '● Inactivo'}
                    </span>
                  </td>
                  <td>
                    {new Date(usuario.creado_en).toLocaleDateString('es-MX', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </td>
                  <td>
                    <div className="gp-admin-table-actions">
                      <button
                        onClick={() => abrirModalEditar(usuario)}
                        className="gp-admin-action-btn edit"
                        title="Editar usuario"
                      >✏️</button>
                      {usuario.id !== 1 && (
                        <button
                          onClick={() => handleEliminar(usuario)}
                          className="gp-admin-action-btn delete"
                          title="Desactivar usuario"
                        >🗑️</button>
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
        <div className="gp-reports-grid">
          {usuariosFiltrados.length === 0 ? (
            <div className="gp-empty-state">
              <div className="gp-empty-icon">🔍</div>
              <h3 className="gp-empty-title">Sin resultados</h3>
              <p className="gp-empty-description">No hay usuarios que coincidan con los filtros</p>
            </div>
          ) : (
            usuariosFiltrados.map(usuario => (
              <div key={usuario.id} className="gp-report-card gp-animate-in">
                <div className="gp-card-header">
                  <div className="gp-card-badges">
                    <span className={`gp-badge gp-badge-status ${usuario.rol}`}>
                      {usuario.rol === 'admin' ? '👑 Admin' : usuario.rol === 'supervisor' ? '🔍 Supervisor' : '⚙️ Funcionario'}
                    </span>
                    <span className={`gp-badge ${usuario.activo === 1 ? 'activo' : 'gp-badge-danger'}`}>
                      {usuario.activo === 1 ? '● Activo' : '● Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="gp-card-body">
                  <h3 className="gp-card-title">{usuario.nombre}</h3>
                  <div className="gp-card-meta">
                    <div className="gp-meta-item">
                      <span className="gp-meta-icon">✉️</span>
                      <span>{usuario.email}</span>
                    </div>
                    <div className="gp-meta-item">
                      <span className="gp-meta-icon">🏢</span>
                      <span>{dependencias.find(d => d.slug === usuario.dependencia)?.nombre || usuario.dependencia}</span>
                    </div>
                  </div>
                </div>
                <div className="gp-card-footer">
                  <button onClick={() => abrirModalEditar(usuario)} className="gp-btn gp-btn-secondary">
                    ✏️ Editar
                  </button>
                  {usuario.id !== 1 && (
                    <button onClick={() => handleEliminar(usuario)} className="gp-btn gp-btn-danger">
                      🗑️ Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de Crear/Editar - Estilo Gubernamental Glassmorphism */}
      {showModal && (
        <div className="gp-user-modal-overlay">
          <div className="gp-user-modal">
            {/* Modal Header - Glassmorphism Gubernamental Premium */}
            <div className="gp-user-modal-header">
              <div className="gp-user-modal-header-bg" />
              
              {/* Header Content */}
              <div className="gp-user-modal-header-content">
                {/* Dynamic Avatar */}
                <div className="gp-user-modal-avatar">
                  {formData.nombre ? 
                    formData.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '👤' 
                    : '👤'
                  }
                </div>
                
                {/* Title Section */}
                <div className="gp-user-modal-title-section">
                  <h2>{modoEdicion ? '✨ Editar Usuario' : '🚀 Crear Nuevo Usuario'}</h2>
                  <p>{modoEdicion ? 'Modifica la información del usuario' : 'Añade un nuevo miembro al equipo'}</p>
                </div>
              </div>
              
              {/* Premium Close Button */}
              <button onClick={cerrarModal} type="button" className="gp-user-modal-close">
                ✕
              </button>
            </div>

            {/* Modal Body - CLASS MUNDIAL Premium Layout */}
            <form onSubmit={handleSubmit} className="gp-user-modal-form">
              {/* Status Messages */}
              {(error || success) && (
                <div className="gp-user-modal-messages">
                  {error && (
                    <div className="gp-user-modal-alert error">
                      <div className="gp-user-modal-alert-icon">⚠️</div>
                      <div>{error}</div>
                    </div>
                  )}
                  {success && (
                    <div className="gp-user-modal-alert success">
                      <div className="gp-user-modal-alert-icon">✅</div>
                      <div>{success}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Form Content - Premium Grid Layout */}
              <div className="gp-user-form-grid">
                
                {/* SECTION 1: Personal Information */}
                <div className="gp-user-form-section">
                  <div className="gp-user-section-header">
                    <div className="gp-user-section-icon">👤</div>
                    <h3 className="gp-user-section-title">Información Personal</h3>
                  </div>

                  {/* Nombre Field - Premium Design */}
                  <div className="gp-user-field">
                    <label className="gp-user-label">Nombre Completo *</label>
                    <div className="gp-user-input-wrap">
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        minLength="3"
                        placeholder="Ej: Juan Pérez García"
                        className="gp-user-input"
                      />
                    </div>
                    <p className="gp-user-hint">💡 Mínimo 3 caracteres</p>
                  </div>

                  {/* Email Field - Premium Design */}
                  <div className="gp-user-field no-margin">
                    <label className="gp-user-label">Email Institucional *</label>
                    <div className="gp-user-input-wrap">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        placeholder="usuario@jantetelco.gob.mx"
                        className="gp-user-input"
                      />
                    </div>
                    <p className="gp-user-hint">📧 Preferentemente con dominio @jantetelco.gob.mx</p>
                  </div>
                </div>

                {/* SECTION 2: Security & Authentication */}
                <div className="gp-user-form-section">
                  <div className="gp-user-section-header">
                    <div className="gp-user-section-icon">🔐</div>
                    <h3 className="gp-user-section-title">Seguridad & Acceso</h3>
                  </div>

                  {/* Password Field - Premium Design */}
                  <div className="gp-user-field no-margin">
                    <label className="gp-user-label">
                      Contraseña {modoEdicion ? '(dejar vacío para no cambiar)' : '*'}
                    </label>
                    <div className="gp-user-input-wrap">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!modoEdicion}
                        minLength="8"
                        placeholder="Mínimo 8 caracteres"
                        className="gp-user-input"
                      />
                    </div>
                    <p className="gp-user-hint">🔒 Debe incluir letras y números (mínimo 8 caracteres)</p>
                  </div>
                </div>

                {/* SECTION 3: Role & Permissions */}
                <div className="gp-user-form-section">
                  <div className="gp-user-section-header">
                    <div className="gp-user-section-icon">⚡</div>
                    <h3 className="gp-user-section-title">Rol & Permisos</h3>
                  </div>

                  {/* Grid for Dependencia y Rol */}
                  <div className="gp-user-field-grid">
                    {/* Dependencia Field */}
                    <div>
                      <label className="gp-user-label">Dependencia *</label>
                      <select
                        name="dependencia"
                        value={formData.dependencia}
                        onChange={handleInputChange}
                        required
                        className="gp-user-select"
                      >
                        {dependencias.map(dep => (
                          <option key={dep.slug} value={dep.slug}>{dep.nombre}</option>
                        ))}
                      </select>
                      <p className="gp-user-hint">🏢 Departamento asignado</p>
                    </div>

                    {/* Rol Field */}
                    <div>
                      <label className="gp-user-label">Rol *</label>
                      <select
                        name="rol"
                        value={formData.rol}
                        onChange={handleInputChange}
                        required
                        className="gp-user-select"
                      >
                        {roles.map(rol => (
                          <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                        ))}
                      </select>
                      <p className="gp-user-hint">⚡ Nivel de acceso</p>
                    </div>
                  </div>

                  {/* Permissions Info Card */}
                  <div className="gp-user-info-card">
                    <div className="gp-user-info-title">💡 Información de Permisos</div>
                    <div className="gp-user-info-text">
                      • <strong>Funcionario:</strong> Atiende reportes asignados<br/>
                      • <strong>Supervisor:</strong> Aprueba cierres y gestiona equipo<br/>
                      • <strong>Admin:</strong> Gestión completa del sistema
                    </div>
                  </div>
                </div>

                {/* SECTION 4: Status (solo en edición) */}
                {modoEdicion && (
                  <div className="gp-user-form-section">
                    <div className="gp-user-section-header">
                      <div className="gp-user-section-icon">🔄</div>
                      <h3 className="gp-user-section-title">Estado del Usuario</h3>
                    </div>

                    {/* Active Switch - Premium Toggle */}
                    <div className={`gp-user-toggle-container ${formData.activo ? 'active' : 'inactive'}`}>
                      <div>
                        <div className={formData.activo ? 'gp-user-toggle-label-active' : 'gp-user-toggle-label-inactive'}>
                          {formData.activo ? '✅ Usuario Activo' : '❌ Usuario Inactivo'}
                        </div>
                        <div className={formData.activo ? 'gp-user-toggle-desc-active' : 'gp-user-toggle-desc-inactive'}>
                          {formData.activo ? 'Puede iniciar sesión y acceder al sistema' : 'No puede iniciar sesión ni acceder al sistema'}
                        </div>
                      </div>
                      <label className="gp-toggle-switch">
                        <input
                          type="checkbox"
                          name="activo"
                          checked={formData.activo}
                          onChange={handleInputChange}
                        />
                        <span className={`gp-toggle-slider ${formData.activo ? 'active' : 'inactive'}`}>
                          <span className={`gp-toggle-knob ${formData.activo ? 'active' : 'inactive'}`} />
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* FOOTER - Premium Action Buttons */}
              <div className="gp-user-form-footer">
                {/* Cancel Button */}
                <button type="button" onClick={cerrarModal} className="gp-user-btn-cancel">
                  ❌ Cancelar
                </button>

                {/* Submit Button */}
                <button type="submit" disabled={success !== null} className="gp-user-btn-submit">
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

// Estilos reutilizables Premium
const estiloEncabezadoPremium = {
  padding: '16px 20px',
  textAlign: 'left',
  fontSize: '12px',
  fontWeight: '700',
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: '1px solid #e2e8f0'
};

const estiloCeldaPremium = {
  padding: '16px 20px',
  fontSize: '14px',
  color: '#334155',
  verticalAlign: 'middle'
};
