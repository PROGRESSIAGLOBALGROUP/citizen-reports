/**
 * AdminCategorias.jsx
 * Componente principal para gestión de categorías y tipos de reporte - REIMAGINADO CLASS MUNDIAL
 * Accesible desde #admin/categorias o #panel/categorias
 * Solo para usuarios con rol 'admin'
 * 
 * TRANSFORMACIÓN PREMIUM: Glassmorphism headers, micro-animaciones, depth design
 */

import React from 'react';
import './gobierno-premium-panel.css';
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

  // Filtrar categorías Y tipos (Premium Search)
  const categoriasFiltradas = React.useMemo(() => {
    if (!busqueda) return categorias;
    const termino = busqueda.toLowerCase();
    
    return categorias
      .map(cat => {
        const nombreCategoriaCoincide = cat.nombre.toLowerCase().includes(termino);
        const tiposFiltrados = cat.tipos?.filter(t => 
          t.nombre.toLowerCase().includes(termino) ||
          t.tipo?.toLowerCase().includes(termino)
        ) || [];
        
        // Si la categoría coincide, mostrar todos sus tipos
        // Si no, mostrar solo los tipos que coinciden
        if (nombreCategoriaCoincide) {
          return cat; // Mostrar categoría completa
        } else if (tiposFiltrados.length > 0) {
          return { ...cat, tipos: tiposFiltrados }; // Mostrar solo tipos filtrados
        }
        return null; // No mostrar
      })
      .filter(Boolean); // Eliminar nulls
  }, [categorias, busqueda]);

  if (cargando) {
    return (
      <div className="gp-loading-center">
        <div className="gp-loading-icon">⏳</div>
        <p>Cargando categorías...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gp-error-center">
        <div className="gp-error-icon">❌</div>
        <p>{error}</p>
        <button onClick={cargarCategorias} className="gp-btn-retry">🔄 Reintentar</button>
      </div>
    );
  }

  return (
    <div className={`gobierno-premium${fullscreen ? ' fullscreen' : ''}`}>
      {/* Header Gubernamental Premium */}
      <div className="gp-admin-header">
        <div className="gp-admin-header-icon">📁</div>
        <div className="gp-admin-header-content">
          <h1 className="gp-admin-header-title">Gestión de Categorías</h1>
          <p className="gp-admin-header-subtitle">Administración y organización de categorías de reportes ciudadanos</p>
          <div className="gp-admin-header-stats">
            <span className="gp-admin-stat">📂 {categorias.length} categorías</span>
            <span className="gp-admin-stat success">📋 {categorias.reduce((acc, cat) => acc + (cat.tipos?.length || 0), 0)} tipos</span>
          </div>
        </div>
        <button onClick={() => setModalCategoria('crear')} className="gp-admin-header-action">
          <span>+</span> Nueva Categoría
        </button>
      </div>

      {/* Filtros Premium */}
      <div className="gp-admin-filters">
        <span className="gp-admin-filters-label">🔍 BUSCAR CATEGORÍA O TIPO</span>
        <div className="gp-admin-search gp-flex-1">
          <span className="gp-admin-search-icon">🔍</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej: Obras Públicas, Bache..."
          />
        </div>
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
          <div className="gp-category-list">
            {categoriasFiltradas.map((categoria) => (
              <ItemCategoria
                key={categoria.id}
                categoria={categoria}
                busqueda={busqueda}
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
        <div className="gp-empty-state">
          <div className="gp-empty-icon">🔍</div>
          <h3 className="gp-empty-title">No se encontraron resultados</h3>
          <p className="gp-empty-description">Intenta con otros términos de búsqueda</p>
        </div>
      )}

      {/* Empty State Gubernamental Profesional (Solo si no hay categorías en absoluto) */}
      {categorias.length === 0 && (
        <div className="gp-empty-state-premium">
          <div className="gp-empty-state-icon">📁</div>
          <h3 className="gp-empty-state-title">Sistema de Categorías</h3>
          <p className="gp-empty-state-text">
            Establece la estructura organizacional para la clasificación de reportes ciudadanos
          </p>
          <button onClick={() => setModalCategoria('crear')} className="gp-empty-state-action">
            <span>+</span> Crear Primera Categoría
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
