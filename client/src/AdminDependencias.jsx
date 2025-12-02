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
import './gobierno-premium-panel.css';
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
      <div className="gp-loading-center">
        <p>📡 Cargando dependencias...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gp-error-center">
        <p>❌ {error}</p>
        <button onClick={cargarDependencias} className="gp-btn-retry">
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={`gobierno-premium${fullscreen ? ' fullscreen' : ''}`}>
      {/* Header Gubernamental Premium */}
      <div className="gp-admin-header">
        <div className="gp-admin-header-icon">🏛️</div>
        <div className="gp-admin-header-content">
          <h1 className="gp-admin-header-title">Administración de Dependencias</h1>
          <p className="gp-admin-header-subtitle">Centro de operaciones • Gestión de departamentos y responsables</p>
          <div className="gp-admin-header-stats">
            <span className="gp-admin-stat">🏢 {dependencias.length} dependencias</span>
            <span className="gp-admin-stat success">✅ {dependencias.filter(d => d.activo !== 0).length} activas</span>
          </div>
        </div>
        <button onClick={() => setModalCrear(true)} className="gp-admin-header-action">
          <span>+</span> Nueva Dependencia
        </button>
      </div>

      {/* Contenido Principal */}
      <div className="gp-admin-content-wrapper">

        {/* Lista de dependencias */}
        {dependencias.length === 0 ? (
          <div className="gp-empty-state">
            <div className="gp-empty-icon">🏛️</div>
            <h3 className="gp-empty-title">Sin dependencias</h3>
            <p className="gp-empty-description">Crea la primera dependencia para comenzar a organizar el sistema</p>
            <button onClick={() => setModalCrear(true)} className="gp-btn gp-btn-primary">
              + Nueva Dependencia
            </button>
          </div>
        ) : (
          <div className="gp-admin-table-container">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={dependencias.map(d => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <table className="gp-admin-table">
                  <thead>
                    <tr>
                      <th>📍 DEPENDENCIA</th>
                      <th>👤 RESPONSABLE</th>
                      <th>📧 CONTACTO</th>
                      <th>🎨 COLOR</th>
                      <th>⚡ ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dependencias.map((dep) => (
                      <tr key={dep.id}>
                        <td>
                          <SortableItemDependencia
                            dep={dep}
                            onEditar={() => {
                              setDependenciaEditar(dep);
                              setModalEditar(true);
                            }}
                            onEliminar={() => handleEliminar(dep.id, dep.nombre)}
                          />
                        </td>
                        <td>{dep.responsable || '—'}</td>
                        <td>{dep.email || '—'}</td>
                        <td>
                          <div 
                            className="gp-color-swatch" 
                            style={{ backgroundColor: dep.color || '#64748b' }}
                          />
                        </td>
                        <td>
                          <div className="gp-admin-table-actions">
                            <button
                              onClick={() => {
                                setDependenciaEditar(dep);
                                setModalEditar(true);
                              }}
                              className="gp-admin-action-btn edit"
                              title="Editar"
                            >✏️</button>
                            <button
                              onClick={() => handleEliminar(dep.id, dep.nombre)}
                              className="gp-admin-action-btn delete"
                              title="Eliminar"
                            >🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
      style={style}
      className="gp-sortable-contents"
      {...attributes}
      {...listeners}
    >
      <div className="gp-sortable-row">
        <span className="gp-sortable-icon">{dep.icono}</span>
        <div>
          <div className="gp-sortable-name">{dep.nombre}</div>
          <div className="gp-sortable-slug" style={{ color: dep.color }}>
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
      className={`gp-dep-card${isDragging ? ' dragging' : ''}`}
      style={style}
    >
      {/* Drag Handle - Top Right */}
      <div
        {...attributes}
        {...listeners}
        className="gp-dep-card-drag-handle"
        style={{ color: dependencia.activo ? dependencia.color : '#cbd5e1' }}
      >
        ⋮⋮
      </div>

      {/* Header Icon Background */}
      <div 
        className="gp-dep-card-header"
        style={{
          background: `linear-gradient(135deg, ${dependencia.color}15 0%, ${dependencia.color}08 100%)`,
          borderBottomColor: `${dependencia.color}20`
        }}
      >
        <div 
          className="gp-dep-card-icon"
          style={{ filter: `drop-shadow(0 4px 12px ${dependencia.color}30)` }}
        >
          {dependencia.icono}
        </div>
      </div>

      {/* Content */}
      <div className="gp-dep-card-content">
        {/* Title */}
        <h3 className="gp-dep-card-title">{dependencia.nombre}</h3>

        {/* Slug */}
        <div className="gp-dep-card-slug" style={{ color: dependencia.color }}>
          {dependencia.slug.replace(/_/g, ' ')}
        </div>

        {/* Descripción */}
        {dependencia.descripcion && (
          <p className="gp-dep-card-description">{dependencia.descripcion}</p>
        )}

        {/* Responsable Info */}
        {dependencia.responsable && (
          <div className="gp-dep-card-responsable">
            <span>👤</span> {dependencia.responsable}
          </div>
        )}

        {/* Status Badge */}
        <div className={`gp-dep-card-status ${dependencia.activo ? 'active' : 'inactive'}`}>
          {dependencia.activo ? '✓ ACTIVA' : '✗ INACTIVA'}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="gp-dep-card-actions">
        <button onClick={onEditar} className="gp-dep-card-btn edit">
          <span className="gp-dep-card-btn-icon">✏️</span>
          <span>Editar</span>
        </button>
        <button onClick={onEliminar} className="gp-dep-card-btn delete">
          <span className="gp-dep-card-btn-icon">🗑️</span>
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
      <div onClick={onCancelar} className="gp-modal-overlay-premium">
        {/* Modal */}
        <div onClick={(e) => e.stopPropagation()} className="gp-modal-premium">
          {/* Header - Fixed Position */}
          <div className="gp-modal-header-premium">
            <h2 className="gp-modal-title-premium">
              {modo === 'crear' ? '➕ Nueva Dependencia' : '✏️ Editar Dependencia'}
            </h2>
            <button onClick={onCancelar} type="button" className="gp-modal-close-premium">
              ✕
            </button>
          </div>

          {/* Form - Scrollable */}
          <form onSubmit={handleSubmit} className="gp-modal-form-body">
            {error && (
              <div className="gp-form-error-alert">⚠️ {error}</div>
            )}

            {/* Slug */}
            <div className="gp-form-group">
              <label className="gp-form-label">Slug (Identificador) *</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej: obras_publicas"
                disabled={modo === 'editar'}
                className="gp-form-input"
              />
              <p className="gp-form-hint">Solo letras minúsculas, números y guiones bajos (_)</p>
            </div>

            {/* Nombre */}
            <div className="gp-form-group">
              <label className="gp-form-label">Nombre *</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => handleNombreChange(e.target.value)}
                placeholder="Obras Públicas"
                className="gp-form-input"
              />
            </div>

            {/* Descripción */}
            <div className="gp-form-group">
              <label className="gp-form-label">Descripción</label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción opcional..."
                rows={2}
                className="gp-form-textarea"
              />
            </div>

            {/* Icono y Color */}
            <div className="gp-form-grid-2">
              <div>
                <label className="gp-form-label">Icono *</label>
                <div className="gp-icon-picker-row">
                  <div className="gp-icon-preview">{icono}</div>
                  <button
                    type="button"
                    onClick={() => setMostrarEmojiPicker(!mostrarEmojiPicker)}
                    className="gp-icon-picker-btn"
                  >
                    😀
                  </button>
                </div>
              </div>

              <div>
                <label className="gp-form-label">Color *</label>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="gp-color-input"
                />
              </div>
            </div>

            {/* Emoji Picker */}
            {mostrarEmojiPicker && (
              <div className="gp-emoji-picker-panel">
                <p className="gp-emoji-picker-hint">Selecciona un emoji:</p>
                <div className="gp-emoji-grid">
                  {['🏛️', '🏗️', '💡', '💧', '🚔', '🌳', '🌿', '🏥', '🏢', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗺️'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setIcono(emoji);
                        setMostrarEmojiPicker(false);
                      }}
                      className="gp-emoji-btn"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Responsable */}
            <div className="gp-form-group">
              <label className="gp-form-label">Responsable</label>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Nombre del responsable"
                className="gp-form-input"
              />
            </div>

            {/* Teléfono y Email */}
            <div className="gp-form-grid-2">
              <div>
                <label className="gp-form-label">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="735 123 4567"
                  className="gp-form-input"
                />
              </div>

              <div>
                <label className="gp-form-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dependencia@jantetelco.gob.mx"
                  className="gp-form-input"
                />
              </div>
            </div>

            {/* Dirección */}
            <div className="gp-form-group">
              <label className="gp-form-label">Dirección</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número, colonia"
                className="gp-form-input"
              />
            </div>

            {/* Botones */}
            <div className="gp-form-actions">
              <button type="button" onClick={onCancelar} className="gp-btn-cancel">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="gp-btn-save">
                {guardando ? '⏳ Guardando...' : '💾 Guardar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
