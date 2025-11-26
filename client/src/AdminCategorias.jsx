/**
 * AdminCategorias.jsx
 * Componente principal para gestión de categorías y tipos de reporte - REIMAGINADO CLASS MUNDIAL
 * Accesible desde #admin/categorias o #panel/categorias
 * Solo para usuarios con rol 'admin'
 * 
 * TRANSFORMACIÓN PREMIUM: Glassmorphism headers, micro-animaciones, depth design
 */

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import FormularioCategoria from './FormularioCategoria.jsx';
import FormularioTipo from './FormularioTipo.jsx';
import ItemCategoria from './ItemCategoria.jsx';
import { DESIGN_SYSTEM, COMMON_STYLES } from './design-system';
import * as UnifiedStyles from './unified-section-headers';

// Inyectar animaciones premium
if (typeof document !== 'undefined' && !document.getElementById('admin-categorias-animations')) {
  const style = document.createElement('style');
  style.id = 'admin-categorias-animations';
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
    
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

export default function AdminCategorias({ fullscreen = false, compact = false }) {
  const [categorias, setCategorias] = React.useState([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [modalCategoria, setModalCategoria] = React.useState(null); // 'crear' | { modo: 'editar', data: {...} }
  const [modalTipo, setModalTipo] = React.useState(null); // { modo: 'crear', categoriaId: X } | { modo: 'editar', data: {...} }
  const [busqueda, setBusqueda] = React.useState(''); // Nuevo: Búsqueda Premium

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Cargar categorías y tipos
  const cargarCategorias = React.useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const response = await fetch('/api/categorias');
      if (!response.ok) throw new Error('Error al cargar categorías');
      const data = await response.json();
      setCategorias(data);
    } catch (err) {
      console.error('Error cargando categorías:', err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    cargarCategorias();
  }, [cargarCategorias]);

  // Handler para drag & drop
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = categorias.findIndex((c) => c.id === active.id);
      const newIndex = categorias.findIndex((c) => c.id === over.id);

      const newOrder = arrayMove(categorias, oldIndex, newIndex);
      setCategorias(newOrder);

      // Actualizar orden en backend
      try {
        const token = localStorage.getItem('auth_token');
        await fetch(`/api/admin/categorias/${active.id}/orden`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ nuevoOrden: newIndex })
        });
      } catch (err) {
        console.error('Error actualizando orden:', err);
        // Revertir cambio en caso de error
        cargarCategorias();
      }
    }
  };

  // Handler para eliminar categoría
  const handleEliminarCategoria = async (id) => {
    const categoria = categorias.find(c => c.id === id);
    if (!categoria) return;

    if (categoria.tipos && categoria.tipos.length > 0) {
      alert(`No se puede eliminar "${categoria.nombre}" porque tiene ${categoria.tipos.length} tipo(s) asociado(s).\n\nElimina primero los tipos de reporte.`);
      return;
    }

    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/categorias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      alert('Categoría eliminada correctamente');
      cargarCategorias();
    } catch (err) {
      console.error('Error eliminando categoría:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Handler para eliminar tipo
  const handleEliminarTipo = async (tipoId, tipoNombre) => {
    if (!confirm(`¿Eliminar el tipo "${tipoNombre}"?`)) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/tipos/${tipoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar');
      }

      alert('Tipo eliminado correctamente');
      cargarCategorias();
    } catch (err) {
      console.error('Error eliminando tipo:', err);
      alert(`Error: ${err.message}`);
    }
  };

  // Filtrar categorías (Premium Search)
  const categoriasFiltradas = React.useMemo(() => {
    if (!busqueda) return categorias;
    const termino = busqueda.toLowerCase();
    return categorias.filter(c => 
      c.nombre.toLowerCase().includes(termino) ||
      c.tipos?.some(t => t.nombre.toLowerCase().includes(termino))
    );
  }, [categorias, busqueda]);

  if (cargando) {
    return (
      <div style={{ padding: DESIGN_SYSTEM.spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: DESIGN_SYSTEM.spacing.md }}>⏳</div>
        <div style={{ color: DESIGN_SYSTEM.colors.neutral.medium }}>Cargando categorías...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: DESIGN_SYSTEM.spacing.xl, textAlign: 'center' }}>
        <div style={{ fontSize: '24px', marginBottom: DESIGN_SYSTEM.spacing.md, color: DESIGN_SYSTEM.colors.semantic.danger }}>❌</div>
        <div style={{ color: DESIGN_SYSTEM.colors.semantic.danger, marginBottom: DESIGN_SYSTEM.spacing.md }}>{error}</div>
        <button
          onClick={cargarCategorias}
          style={{
            padding: `${DESIGN_SYSTEM.spacing.xs} ${DESIGN_SYSTEM.spacing.md}`,
            background: DESIGN_SYSTEM.colors.primary.main,
            color: 'white',
            border: 'none',
            borderRadius: DESIGN_SYSTEM.border.radius.md,
            cursor: 'pointer',
            fontSize: DESIGN_SYSTEM.typography.bodySmall.fontSize,
            fontWeight: '600',
            transition: DESIGN_SYSTEM.transition.standard,
            hover: {
              background: DESIGN_SYSTEM.colors.primary.dark
            }
          }}
        >
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: compact ? DESIGN_SYSTEM.spacing.md : DESIGN_SYSTEM.spacing.lg,
      maxWidth: fullscreen ? '1200px' : '100%',
      margin: fullscreen ? '0 auto' : '0',
      background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(241, 245, 249, 0.5) 100%)',
      minHeight: fullscreen ? '100vh' : 'auto'
    }}>
      {/* Header Gubernamental Profesional */}
      <div style={{
        background: `linear-gradient(135deg, 
          rgba(248, 250, 252, 0.95) 0%, 
          rgba(241, 245, 249, 0.95) 100%)`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(226, 232, 240, 0.6)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '28px',
        boxShadow: `
          0 8px 32px -8px rgba(0, 0, 0, 0.08),
          0 4px 16px -4px rgba(100, 116, 139, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.7)
        `,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Overlay gubernamental sutil */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 70% 20%, rgba(71, 85, 105, 0.03) 0%, transparent 60%)`,
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Avatar Gubernamental Profesional */}
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
            boxShadow: `
              0 8px 24px -8px rgba(71, 85, 105, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.15)
            `,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = `0 12px 32px -8px rgba(71, 85, 105, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`;
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = `0 8px 24px -8px rgba(71, 85, 105, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)`;
          }}
          >
            📁
          </div>

          {/* Content Premium */}
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1e293b',
              margin: 0,
              marginBottom: '8px',
              letterSpacing: '-0.4px'
            }}>
              Gestión de Categorías
            </h1>
            <p style={{
              color: '#64748b',
              fontSize: '16px',
              margin: 0,
              fontWeight: '500',
              marginBottom: '16px',
              lineHeight: '1.5'
            }}>
              Administración y organización de categorías de reportes ciudadanos
            </p>
            
            {/* Estadísticas Gubernamentales */}
            <div style={{
              display: 'flex',
              gap: '12px'
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
                {categorias.length} categorías
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
                {categorias.reduce((acc, cat) => acc + (cat.tipos?.length || 0), 0)} tipos
              </div>
            </div>
          </div>

          {/* Botón Gubernamental Profesional */}
          <button
            onClick={() => setModalCategoria('crear')}
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
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px -4px rgba(71, 85, 105, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px -4px rgba(71, 85, 105, 0.3)';
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Filtros Premium */}
      <div style={{
        marginBottom: DESIGN_SYSTEM.spacing.lg,
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.05)',
        border: '1px solid rgba(226, 232, 240, 0.8)'
      }}>
        <label style={{ 
          display: 'block', 
          fontSize: '12px', 
          fontWeight: '700',
          color: '#64748b',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🔍 Buscar Categoría o Tipo
        </label>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej: Obras Públicas, Bache..."
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#94a3b8';
            e.target.style.backgroundColor = 'white';
            e.target.style.boxShadow = '0 0 0 3px rgba(148, 163, 184, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0';
            e.target.style.backgroundColor = '#f8fafc';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Lista de categorías con drag & drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categoriasFiltradas.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: DESIGN_SYSTEM.spacing.md }}>
            {categoriasFiltradas.map((categoria) => (
              <ItemCategoria
                key={categoria.id}
                categoria={categoria}
                onEditar={() => setModalCategoria({ modo: 'editar', data: categoria })}
                onEliminar={() => handleEliminarCategoria(categoria.id)}
                onCrearTipo={() => setModalTipo({ modo: 'crear', categoriaId: categoria.id })}
                onEditarTipo={(tipo) => setModalTipo({ modo: 'editar', data: tipo })}
                onEliminarTipo={handleEliminarTipo}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State - Búsqueda sin resultados */}
      {categorias.length > 0 && categoriasFiltradas.length === 0 && (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          color: '#64748b',
          background: 'white',
          borderRadius: '16px',
          border: '1px dashed #cbd5e1',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '18px', color: '#1e293b' }}>No se encontraron resultados</div>
          <div style={{ fontSize: '14px' }}>Intenta con otros términos de búsqueda</div>
        </div>
      )}

      {/* Empty State Gubernamental Profesional (Solo si no hay categorías en absoluto) */}
      {categorias.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '16px',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          padding: '48px 32px',
          textAlign: 'center',
          boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.06)'
        }}>          
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.1) 0%, rgba(100, 116, 139, 0.1) 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 24px auto',
            border: '1px solid rgba(71, 85, 105, 0.15)'
          }}>
            📁
          </div>
          
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 12px 0',
            letterSpacing: '-0.3px'
          }}>
            Sistema de Categorías
          </h3>
          
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: '0 0 32px 0',
            lineHeight: '1.6',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Establece la estructura organizacional para la clasificación de reportes ciudadanos
          </p>
          
          <button
            onClick={() => setModalCategoria('crear')}
            style={{
              background: 'linear-gradient(135deg, #475569, #64748b)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px -4px rgba(71, 85, 105, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 6px 20px -4px rgba(71, 85, 105, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 16px -4px rgba(71, 85, 105, 0.3)';
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Crear Primera Categoría
          </button>
        </div>
      )}

      {/* Modales */}
      {modalCategoria && (
        <FormularioCategoria
          modo={modalCategoria === 'crear' ? 'crear' : 'editar'}
          categoria={modalCategoria.data}
          onGuardar={() => {
            setModalCategoria(null);
            cargarCategorias();
          }}
          onCancelar={() => setModalCategoria(null)}
        />
      )}

      {modalTipo && (
        <FormularioTipo
          modo={modalTipo.modo}
          tipo={modalTipo.data}
          categoriaId={modalTipo.categoriaId}
          categorias={categorias}
          onGuardar={() => {
            setModalTipo(null);
            cargarCategorias();
          }}
          onCancelar={() => setModalTipo(null)}
        />
      )}
    </div>
  );
}
