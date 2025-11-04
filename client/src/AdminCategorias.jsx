/**
 * AdminCategorias.jsx
 * Componente principal para gestión de categorías y tipos de reporte
 * Accesible desde #admin/categorias o #panel/categorias
 * Solo para usuarios con rol 'admin'
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

export default function AdminCategorias({ fullscreen = false, compact = false }) {
  const [categorias, setCategorias] = React.useState([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [modalCategoria, setModalCategoria] = React.useState(null); // 'crear' | { modo: 'editar', data: {...} }
  const [modalTipo, setModalTipo] = React.useState(null); // { modo: 'crear', categoriaId: X } | { modo: 'editar', data: {...} }

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
      margin: fullscreen ? '0 auto' : '0'
    }}>
      {/* Header - CLASS MUNDIAL Style */}
      <div style={{ ...UnifiedStyles.headerSection, marginBottom: DESIGN_SYSTEM.spacing.xl }}>
        <div style={UnifiedStyles.headerIcon}>📁</div>
        <div style={UnifiedStyles.headerContent}>
          <h2 style={UnifiedStyles.headerTitle}>Gestión de Categorías y Tipos</h2>
          <p style={UnifiedStyles.headerDescription}>Organiza los tipos de reporte en categorías para una mejor estructura</p>
        </div>
        <button
          onClick={() => setModalCategoria('crear')}
          style={UnifiedStyles.primaryActionButton}
          onMouseEnter={(e) => {
            Object.assign(e.target.style, UnifiedStyles.primaryActionButtonHover);
          }}
          onMouseLeave={(e) => {
            Object.assign(e.target.style, UnifiedStyles.primaryActionButton);
          }}
        >
          <span style={{ fontSize: '20px' }}>+</span>
          Nueva Categoría
        </button>
      </div>

      {/* Lista de categorías con drag & drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={categorias.map(c => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: DESIGN_SYSTEM.spacing.md }}>
            {categorias.map((categoria) => (
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

      {categorias.length === 0 && (
        <div style={UnifiedStyles.emptyState}>
          <div style={UnifiedStyles.emptyStateIcon}>📁</div>
          <h3 style={UnifiedStyles.emptyStateTitle}>No hay categorías creadas</h3>
          <p style={UnifiedStyles.emptyStateDescription}>Crea tu primera categoría para comenzar a organizar los tipos de reporte</p>
          <button
            onClick={() => setModalCategoria('crear')}
            style={{ ...UnifiedStyles.primaryActionButton, marginTop: DESIGN_SYSTEM.spacing.lg }}
            onMouseEnter={(e) => {
              Object.assign(e.target.style, UnifiedStyles.primaryActionButtonHover);
            }}
            onMouseLeave={(e) => {
              Object.assign(e.target.style, UnifiedStyles.primaryActionButton);
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span>
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
