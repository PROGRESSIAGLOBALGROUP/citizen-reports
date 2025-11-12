import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { DESIGN_SYSTEM } from './design-system';
import * as UnifiedStyles from './unified-section-headers';

/**
 * AdminDependencias - Versión Tabla (Patrón AdminUsuarios)
 * Gestiona dependencias municipales con tabla profesional
 * Elimina concepto de "slug" del UI (manejado internamente)
 */
export default function AdminDependencias({ fullscreen = false }) {
  const [dependencias, setDependencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [dependenciaActual, setDependenciaActual] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Detectar cambios en el tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar dependencias
  useEffect(() => {
    cargarDependencias();
  }, []);

  async function cargarDependencias() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/dependencias', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al cargar dependencias');
      const data = await response.json();
      setDependencias(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function abrirModalNuevo() {
    setModoEdicion(false);
    setDependenciaActual(null);
    setShowModal(true);
  }

  function abrirModalEditar(dependencia) {
    setModoEdicion(true);
    setDependenciaActual(dependencia);
    setShowModal(true);
  }

  function cerrarModal() {
    setShowModal(false);
    setDependenciaActual(null);
  }

  async function handleEliminar(dependencia) {
    if (!window.confirm(`¿Eliminar "${dependencia.nombre}"?`)) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/dependencias/${dependencia.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Error al eliminar');
      setSuccess(`"${dependencia.nombre}" eliminada correctamente`);
      setTimeout(() => setSuccess(null), 3000);
      await cargarDependencias();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: DESIGN_SYSTEM.spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: DESIGN_SYSTEM.typography.body.fontSize, color: DESIGN_SYSTEM.colors.neutral.dark }}>
          Cargando dependencias...
        </div>
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
        <div style={UnifiedStyles.headerIcon}>🏛️</div>
        <div style={UnifiedStyles.headerContent}>
          <h1 style={UnifiedStyles.headerTitle}>Administración de Dependencias</h1>
          <p style={UnifiedStyles.headerDescription}>Gestiona las dependencias municipales y sus responsables</p>
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
          Nueva Dependencia
        </button>
      </div>

      {/* Mensajes de éxito/error */}
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

      {/* Tabla de Dependencias (Desktop) o Cards (Mobile) */}
      {!isMobile ? (
        /* Vista Tabla para Desktop */
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
            minWidth: '800px'
          }}>
            <thead>
              <tr style={{ backgroundColor: DESIGN_SYSTEM.colors.neutral.medium }}>
                <th style={estiloEncabezado}>Nombre</th>
                <th style={estiloEncabezado}>Responsable</th>
                <th style={estiloEncabezado}>Estado</th>
                <th style={estiloEncabezado}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dependencias.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{
                    textAlign: 'center',
                    padding: DESIGN_SYSTEM.spacing.xl,
                    color: DESIGN_SYSTEM.colors.neutral.medium
                  }}>
                    No hay dependencias registradas
                  </td>
                </tr>
              ) : (
                dependencias.map(dep => (
                  <tr
                    key={dep.id}
                    style={{
                      borderBottom: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
                      transition: DESIGN_SYSTEM.transition.default
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.neutral.medium}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={estiloCelda}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '24px' }}>{dep.icono}</span>
                        <div style={{ fontWeight: '600', color: DESIGN_SYSTEM.colors.neutral.dark }}>
                          {dep.nombre}
                        </div>
                      </div>
                    </td>
                    <td style={estiloCelda}>
                      <div style={{ color: DESIGN_SYSTEM.colors.neutral.medium, fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize }}>
                        {dep.responsable || '-'}
                      </div>
                    </td>
                    <td style={estiloCelda}>
                      <span style={{
                        padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.md}`,
                        backgroundColor: dep.activo === 1 ? `${DESIGN_SYSTEM.colors.semantic.success}22` : `${DESIGN_SYSTEM.colors.semantic.danger}22`,
                        color: dep.activo === 1 ? DESIGN_SYSTEM.colors.semantic.success : DESIGN_SYSTEM.colors.semantic.danger,
                        borderRadius: DESIGN_SYSTEM.border.radius.full,
                        fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize,
                        fontWeight: '600'
                      }}>
                        {dep.activo === 1 ? '✓ Activa' : '✕ Inactiva'}
                      </span>
                    </td>
                    <td style={estiloCelda}>
                      <div style={{ display: 'flex', gap: DESIGN_SYSTEM.spacing.md, justifyContent: 'center' }}>
                        <button
                          onClick={() => abrirModalEditar(dep)}
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
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.primary.dark}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.primary.main}
                          title="Editar dependencia"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(dep)}
                          style={{
                            padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.sm}`,
                            backgroundColor: DESIGN_SYSTEM.colors.semantic.danger,
                            color: 'white',
                            border: 'none',
                            borderRadius: DESIGN_SYSTEM.border.radius.md,
                            fontSize: DESIGN_SYSTEM.typography.labelSmall.fontSize,
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: DESIGN_SYSTEM.transition.default
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = DESIGN_SYSTEM.colors.semantic.danger}
                          title="Eliminar dependencia"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Vista Cards para Mobile */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {dependencias.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              padding: '40px 20px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              No hay dependencias registradas
            </div>
          ) : (
            dependencias.map(dep => (
              <div
                key={dep.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '28px' }}>{dep.icono}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#111827' }}>
                      {dep.nombre}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {dep.responsable || 'Sin responsable'}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    backgroundColor: dep.activo === 1 ? '#dcfce7' : '#fee2e2',
                    color: dep.activo === 1 ? '#166534' : '#991b1b',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {dep.activo === 1 ? '✓ Activa' : '✕ Inactiva'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', paddingTop: '12px', borderTop: '1px solid #f3f4f6' }}>
                  <button
                    onClick={() => abrirModalEditar(dep)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(dep)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FormularioDependencia
          modo={modoEdicion ? 'editar' : 'crear'}
          dependencia={dependenciaActual}
          onGuardar={() => {
            cerrarModal();
            cargarDependencias();
          }}
          onCancelar={cerrarModal}
        />
      )}
    </div>
  );
}

AdminDependencias.propTypes = {
  fullscreen: PropTypes.bool
};

/**
 * Componente Modal - Formulario de Dependencia
 */
function FormularioDependencia({ modo, dependencia, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(dependencia?.nombre || '');
  const [descripcion, setDescripcion] = useState(dependencia?.descripcion || '');
  const [icono, setIcono] = useState(dependencia?.icono || '🏛️');
  const [color, setColor] = useState(dependencia?.color || '#6b7280');
  const [responsable, setResponsable] = useState(dependencia?.responsable || '');
  const [telefono, setTelefono] = useState(dependencia?.telefono || '');
  const [email, setEmail] = useState(dependencia?.email || '');
  const [direccion, setDireccion] = useState(dependencia?.direccion || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const generarSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre es obligatorio');
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const slug = generarSlug(nombre);
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
          slug: slug,
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
        const err = await response.json();
        throw new Error(err.error || 'Error al guardar');
      }

      onGuardar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
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
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '20px',
        overflowY: 'auto'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: isMobile ? '0' : '12px',
          maxWidth: isMobile ? '100%' : '600px',
          width: '100%',
          maxHeight: isMobile ? '100vh' : '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          marginTop: isMobile ? '0' : 'auto',
          marginBottom: isMobile ? '0' : 'auto'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: isMobile ? '16px' : '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: isMobile ? 'sticky' : 'static',
            top: 0,
            backgroundColor: 'white',
            zIndex: 10
          }}
        >
          <h2 style={{
            margin: 0,
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700',
            color: '#111827'
          }}>
            {modo === 'crear' ? '➕ Nueva Dependencia' : '✏️ Editar Dependencia'}
          </h2>
          <button
            onClick={onCancelar}
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

        {/* Modal Body */}
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

          {/* Nombre */}
          <div style={{ marginBottom: '20px' }}>
            <label style={estiloLabel}>Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="ej: Obras Públicas"
              style={estiloInput}
            />
          </div>

          {/* Descripción */}
          <div style={{ marginBottom: '20px' }}>
            <label style={estiloLabel}>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la dependencia..."
              rows={3}
              style={{ ...estiloInput, resize: 'vertical' }}
            />
          </div>

          {/* Icono y Color - Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={estiloLabel}>Icono *</label>
              <input
                type="text"
                value={icono}
                onChange={(e) => setIcono(e.target.value)}
                style={estiloInput}
              />
            </div>
            <div>
              <label style={estiloLabel}>Color *</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={estiloInput}
              />
            </div>
          </div>

          {/* Responsable */}
          <div style={{ marginBottom: '20px' }}>
            <label style={estiloLabel}>Responsable</label>
            <input
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              placeholder="Nombre del responsable"
              style={estiloInput}
            />
          </div>

          {/* Teléfono y Email - Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={estiloLabel}>Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="735 123 4567"
                style={estiloInput}
              />
            </div>
            <div>
              <label style={estiloLabel}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dependencia@jantetelco.gob.mx"
                style={estiloInput}
              />
            </div>
          </div>

          {/* Dirección */}
          <div style={{ marginBottom: '20px' }}>
            <label style={estiloLabel}>Dirección</label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Calle, número, colonia"
              style={estiloInput}
            />
          </div>

          {/* Botones */}
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
              onClick={onCancelar}
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
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              style={{
                flex: 1,
                padding: isMobile ? '14px' : '12px',
                backgroundColor: guardando ? '#94a3b8' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: guardando ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => !guardando && (e.target.style.backgroundColor = '#2563eb')}
              onMouseLeave={(e) => !guardando && (e.target.style.backgroundColor = '#3b82f6')}
            >
              {guardando ? '⏳ Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

FormularioDependencia.propTypes = {
  modo: PropTypes.oneOf(['crear', 'editar']).isRequired,
  dependencia: PropTypes.object,
  onGuardar: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired
};

// Estilos reutilizables
const estiloLabel = {
  display: 'block',
  marginBottom: DESIGN_SYSTEM.spacing.md,
  fontSize: DESIGN_SYSTEM.typography.body.fontSize,
  fontWeight: '600',
  color: DESIGN_SYSTEM.colors.neutral.dark
};

const estiloInput = {
  width: '100%',
  padding: DESIGN_SYSTEM.spacing.md,
  fontSize: DESIGN_SYSTEM.typography.body.fontSize,
  border: `1px solid ${DESIGN_SYSTEM.colors.neutral.border}`,
  borderRadius: DESIGN_SYSTEM.border.radius.md,
  backgroundColor: DESIGN_SYSTEM.colors.neutral.light,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'all 0.2s ease'
};

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
