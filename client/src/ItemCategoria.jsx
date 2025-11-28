/**
 * ItemCategoria.jsx
 * Componente individual de categoría con drag & drop - DISEÑO CLASS MUNDIAL
 * Reimaginado con glassmorphism, micro-animaciones y depth premium
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Inyectar keyframes para animaciones
if (typeof document !== 'undefined' && !document.getElementById('categoria-animations')) {
  const style = document.createElement('style');
  style.id = 'categoria-animations';
  style.textContent = `
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `;
  document.head.appendChild(style);
}

export default function ItemCategoria({
  categoria,
  busqueda = '',
  onEditar,
  onEliminar,
  onCrearTipo,
  onEditarTipo,
  onEliminarTipo
}) {
  // Función para resaltar coincidencias de búsqueda
  const resaltarTexto = (texto) => {
    if (!busqueda || !texto) return texto;
    const termino = busqueda.toLowerCase();
    const indice = texto.toLowerCase().indexOf(termino);
    if (indice === -1) return texto;
    
    const antes = texto.slice(0, indice);
    const coincidencia = texto.slice(indice, indice + busqueda.length);
    const despues = texto.slice(indice + busqueda.length);
    
    return (
      <>
        {antes}
        <span style={{ 
          backgroundColor: 'rgba(250, 204, 21, 0.4)',
          borderRadius: '2px',
          padding: '0 2px'
        }}>
          {coincidencia}
        </span>
        {despues}
      </>
    );
  };
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
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: '1px solid rgba(226, 232, 240, 0.6)',
        overflow: 'hidden',
        boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.25s ease',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px -4px rgba(0, 0, 0, 0.06)';
      }}
    >
      {/* Header Gubernamental Profesional */}
      <div style={{
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(71, 85, 105, 0.04) 0%, rgba(100, 116, 139, 0.04) 100%)',
        borderBottom: expandido ? '1px solid rgba(226, 232, 240, 0.6)' : 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Drag Handle Gubernamental */}
        <div
          {...attributes}
          {...listeners}
          style={{
            cursor: 'grab',
            background: 'rgba(71, 85, 105, 0.08)',
            borderRadius: '8px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            color: '#64748b',
            fontWeight: '600',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(71, 85, 105, 0.12)';
            e.target.style.color = '#475569';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(71, 85, 105, 0.08)';
            e.target.style.color = '#64748b';
          }}
          title="Arrastra para reordenar"
        >
          ⋮⋮
        </div>

        {/* Contenido Gubernamental */}
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
          {/* Avatar gubernamental profesional */}
          <div style={{
            width: '48px',
            height: '48px',
            background: `linear-gradient(135deg, ${categoria.color}, ${categoria.color}dd)`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: 'white',
            boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.15)'
          }}>
            {categoria.icono}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '2px'
            }}>
              {resaltarTexto(categoria.nombre)}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: '#64748b',
              fontWeight: '500'
            }}>
              {categoria.tipos?.length || 0} tipo{(categoria.tipos?.length || 0) !== 1 ? 's' : ''} de reporte
            </div>
          </div>
        </div>

        {/* Indicador de color y acciones */}
        <div style={{
          width: '32px',
          height: '20px',
          background: categoria.color,
          borderRadius: '6px',
          border: '1px solid rgba(0,0,0,0.1)',
          marginRight: '12px'
        }} />

        {/* Botones gubernamentales */}
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={onEditar}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(71, 85, 105, 0.08)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.08)';
            }}
            title="Editar categoría"
          >
            ✏️
          </button>
          
          <button
            onClick={onEliminar}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(254, 202, 202, 0.8)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(239, 68, 68, 0.08)';
            }}
            title="Eliminar categoría"
          >
            🗑️
          </button>
          
          <button
            onClick={() => setExpandido(!expandido)}
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(71, 85, 105, 0.08)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#475569',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.08)';
            }}
          >
            {expandido ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Lista de Tipos Gubernamental */}
      {expandido && (
        <div style={{ 
          padding: '20px',
          background: 'rgba(248, 250, 252, 0.5)'
        }}>
          {categoria.tipos && categoria.tipos.length > 0 ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              marginBottom: '16px' 
            }}>
              {categoria.tipos.map((tipo) => (
                <div
                  key={tipo.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid rgba(226, 232, 240, 0.8)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(71, 85, 105, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.8)';
                  }}
                >
                  {/* Ícono del tipo */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(71, 85, 105, 0.08)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}>
                    {tipo.icono}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: '600', 
                      color: '#374151',
                      marginBottom: '2px'
                    }}>
                      {resaltarTexto(tipo.nombre)}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#9ca3af', 
                      fontFamily: 'monospace',
                      background: '#f8fafc',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}>
                      {tipo.tipo}
                    </div>
                  </div>
                  
                  {/* Department badge */}
                  <div style={{
                    padding: '4px 8px',
                    background: 'rgba(71, 85, 105, 0.08)',
                    color: '#475569',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {tipo.dependencia?.replace(/_/g, ' ')}
                  </div>
                  
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => onEditarTipo(tipo)}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: 'rgba(71, 85, 105, 0.08)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => onEliminarTipo(tipo.id, tipo.nombre)}
                      style={{
                        width: '24px',
                        height: '24px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(254, 202, 202, 0.8)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '10px',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '24px',
              textAlign: 'center',
              background: 'rgba(248, 250, 252, 0.8)',
              borderRadius: '8px',
              border: '1px dashed rgba(226, 232, 240, 0.8)',
              marginBottom: '16px'
            }}>
              <div style={{
                color: '#9ca3af',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                No hay tipos de reporte en esta categoría
              </div>
            </div>
          )}

          {/* Botón Crear Tipo Gubernamental */}
          <button
            onClick={onCrearTipo}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(71, 85, 105, 0.08)',
              border: '1px dashed rgba(226, 232, 240, 0.8)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.12)';
              e.target.style.borderColor = 'rgba(71, 85, 105, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(71, 85, 105, 0.08)';
              e.target.style.borderColor = 'rgba(226, 232, 240, 0.8)';
            }}
          >
            <span style={{ fontSize: '14px' }}>+</span>
            Agregar tipo de reporte
          </button>
        </div>
      )}
    </div>
  );
}
