/**
 * ItemCategoria.jsx
 * Componente individual de categoría con drag & drop
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function ItemCategoria({
  categoria,
  onEditar,
  onEliminar,
  onCrearTipo,
  onEditarTipo,
  onEliminarTipo
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: categoria.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [expandido, setExpandido] = React.useState(true);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
    >
      {/* Header de categoría */}
      <div style={{
        padding: '16px',
        background: `${categoria.color}15`,
        borderBottom: expandido ? '1px solid #e5e7eb' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            fontSize: '20px',
            color: '#9ca3af',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}
          title="Arrastra para reordenar"
        >
          ⋮⋮
        </div>

        {/* Icono y nombre */}
        <div
          onClick={() => setExpandido(!expandido)}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <span style={{ fontSize: '24px' }}>{categoria.icono}</span>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '2px'
            }}>
              {categoria.nombre}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {categoria.tipos?.length || 0} tipo(s) de reporte
            </div>
          </div>
        </div>

        {/* Color badge */}
        <div style={{
          width: '40px',
          height: '24px',
          background: categoria.color,
          borderRadius: '6px',
          border: '1px solid rgba(0,0,0,0.1)'
        }} />

        {/* Botones de acción */}
        <button
          onClick={onEditar}
          style={{
            padding: '6px 12px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            color: '#475569'
          }}
          title="Editar categoría"
        >
          ✏️
        </button>
        <button
          onClick={onEliminar}
          style={{
            padding: '6px 12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            color: '#dc2626'
          }}
          title="Eliminar categoría"
        >
          🗑️
        </button>
        <button
          onClick={() => setExpandido(!expandido)}
          style={{
            padding: '6px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#6b7280'
          }}
        >
          {expandido ? '▼' : '▶'}
        </button>
      </div>

      {/* Lista de tipos */}
      {expandido && (
        <div style={{ padding: '16px' }}>
          {categoria.tipos && categoria.tipos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {categoria.tipos.map((tipo) => (
                <div
                  key={tipo.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{tipo.icono}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      {tipo.nombre}
                    </div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
                      {tipo.slug}
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    background: '#e0e7ff',
                    color: '#4338ca',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600'
                  }}>
                    {tipo.dependencia?.replace(/_/g, ' ').toUpperCase()}
                  </span>
                  <button
                    onClick={() => onEditarTipo(tipo)}
                    style={{
                      padding: '4px 8px',
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => onEliminarTipo(tipo.id, tipo.nombre)}
                    style={{
                      padding: '4px 8px',
                      background: 'white',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: '#dc2626'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: '#9ca3af',
              fontSize: '13px',
              marginBottom: '12px'
            }}>
              No hay tipos de reporte en esta categoría
            </div>
          )}

          {/* Botón crear tipo */}
          <button
            onClick={onCrearTipo}
            style={{
              width: '100%',
              padding: '10px',
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span style={{ fontSize: '16px' }}>+</span>
            Agregar tipo de reporte
          </button>
        </div>
      )}
    </div>
  );
}
