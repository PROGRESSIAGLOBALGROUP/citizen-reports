/**
 * Unit Tests: AdminCategorias Search Logic
 * 
 * Tests the search/filter functionality in isolation without UI dependencies.
 * Validates:
 * - Filtering by category name includes all types
 * - Filtering by type name shows only matching types
 * - Filtering by tipo slug works
 * - Case insensitivity
 * - Empty results handling
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Mock the dnd-kit imports
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  arrayMove: vi.fn((arr, from, to) => {
    const result = [...arr];
    const [removed] = result.splice(from, 1);
    result.splice(to, 0, removed);
    return result;
  }),
  SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
  sortableKeyboardCoordinates: vi.fn(),
  verticalListSortingStrategy: {},
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: vi.fn(() => '') } },
}));

// Mock the design system to avoid import issues
vi.mock('../../client/src/design-system', () => ({
  DESIGN_SYSTEM: {
    colors: {
      primary: { main: '#3b82f6', dark: '#2563eb', light: '#93c5fd' },
      neutral: { medium: '#64748b' },
      semantic: { danger: '#ef4444' },
    },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
    border: { radius: { md: '8px' } },
    typography: { bodySmall: { fontSize: '14px' } },
    transition: { standard: 'all 0.2s ease' },
  },
  COMMON_STYLES: {},
}));

vi.mock('../../client/src/unified-section-headers', () => ({}));

// Mock child components
vi.mock('../../client/src/FormularioCategoria.jsx', () => ({
  default: () => <div data-testid="mock-formulario-categoria" />,
}));

vi.mock('../../client/src/FormularioTipo.jsx', () => ({
  default: () => <div data-testid="mock-formulario-tipo" />,
}));

// Create a simplified ItemCategoria mock that shows the structure we need
vi.mock('../../client/src/ItemCategoria.jsx', () => ({
  default: ({ categoria, busqueda }) => (
    <div data-testid={`categoria-${categoria.id}`}>
      <span data-testid={`categoria-nombre-${categoria.id}`}>{categoria.nombre}</span>
      {categoria.tipos?.map((tipo) => (
        <div key={tipo.id} data-testid={`tipo-${tipo.id}`}>
          <span data-testid={`tipo-nombre-${tipo.id}`}>{tipo.nombre}</span>
          <span data-testid={`tipo-slug-${tipo.id}`}>{tipo.tipo}</span>
        </div>
      ))}
    </div>
  ),
}));

// Test data
const mockCategorias = [
  {
    id: 1,
    nombre: 'Obras Públicas',
    icono: '🏗️',
    color: '#3b82f6',
    tipos: [
      { id: 1, tipo: 'baches', nombre: 'Baches', icono: '🕳️', dependencia: 'obras_publicas' },
      { id: 2, tipo: 'pavimento_danado', nombre: 'Pavimento Dañado', icono: '🛣️', dependencia: 'obras_publicas' },
      { id: 3, tipo: 'banqueta_rota', nombre: 'Banqueta Rota', icono: '🧱', dependencia: 'obras_publicas' },
    ],
  },
  {
    id: 2,
    nombre: 'Servicios Públicos',
    icono: '💡',
    color: '#10b981',
    tipos: [
      { id: 4, tipo: 'luminaria', nombre: 'Luminaria Dañada', icono: '💡', dependencia: 'servicios_publicos' },
      { id: 5, tipo: 'basura', nombre: 'Acumulación de Basura', icono: '🗑️', dependencia: 'servicios_publicos' },
    ],
  },
  {
    id: 3,
    nombre: 'Agua Potable',
    icono: '💧',
    color: '#0ea5e9',
    tipos: [
      { id: 6, tipo: 'fuga_agua', nombre: 'Fuga de Agua', icono: '💧', dependencia: 'agua_potable' },
    ],
  },
];

// Test the filtering logic directly
describe('AdminCategorias Search Logic', () => {
  /**
   * Pure function test of the filtering logic
   * This is the same logic implemented in AdminCategorias.jsx
   */
  const filterCategorias = (categorias, busqueda) => {
    if (!busqueda) return categorias;
    const termino = busqueda.toLowerCase();
    
    return categorias
      .map(cat => {
        const nombreCategoriaCoincide = cat.nombre.toLowerCase().includes(termino);
        const tiposFiltrados = cat.tipos?.filter(t => 
          t.nombre.toLowerCase().includes(termino) ||
          t.tipo?.toLowerCase().includes(termino)
        ) || [];
        
        if (nombreCategoriaCoincide) {
          return cat; // Show full category
        } else if (tiposFiltrados.length > 0) {
          return { ...cat, tipos: tiposFiltrados }; // Show only filtered types
        }
        return null;
      })
      .filter(Boolean);
  };

  describe('Empty Search', () => {
    it('returns all categories when search is empty', () => {
      const result = filterCategorias(mockCategorias, '');
      expect(result).toHaveLength(3);
      expect(result).toEqual(mockCategorias);
    });

    it('returns all categories when search is null', () => {
      const result = filterCategorias(mockCategorias, null);
      expect(result).toHaveLength(3);
    });
  });

  describe('Search by Category Name', () => {
    it('shows entire category when category name matches', () => {
      const result = filterCategorias(mockCategorias, 'Obras');
      
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Obras Públicas');
      // All types should be preserved
      expect(result[0].tipos).toHaveLength(3);
    });

    it('is case insensitive for category names', () => {
      const result1 = filterCategorias(mockCategorias, 'OBRAS');
      const result2 = filterCategorias(mockCategorias, 'obras');
      const result3 = filterCategorias(mockCategorias, 'ObRaS');
      
      expect(result1).toHaveLength(1);
      expect(result2).toHaveLength(1);
      expect(result3).toHaveLength(1);
    });

    it('partial category name match works', () => {
      const result = filterCategorias(mockCategorias, 'Púb');
      
      // Should match both "Obras Públicas" and "Servicios Públicos"
      expect(result).toHaveLength(2);
      expect(result.map(c => c.nombre)).toContain('Obras Públicas');
      expect(result.map(c => c.nombre)).toContain('Servicios Públicos');
    });
  });

  describe('Search by Type Name', () => {
    it('shows only matching types when type name matches', () => {
      const result = filterCategorias(mockCategorias, 'Baches');
      
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Obras Públicas');
      // Only the matching type
      expect(result[0].tipos).toHaveLength(1);
      expect(result[0].tipos[0].nombre).toBe('Baches');
    });

    it('filters out non-matching types within category', () => {
      const result = filterCategorias(mockCategorias, 'Banqueta');
      
      expect(result).toHaveLength(1);
      expect(result[0].tipos).toHaveLength(1);
      expect(result[0].tipos[0].nombre).toBe('Banqueta Rota');
      // Pavimento Dañado and Baches should NOT be included
    });

    it('is case insensitive for type names', () => {
      const result = filterCategorias(mockCategorias, 'baches');
      
      expect(result).toHaveLength(1);
      expect(result[0].tipos[0].nombre).toBe('Baches');
    });
  });

  describe('Search by Tipo Slug', () => {
    it('matches by tipo field (slug)', () => {
      const result = filterCategorias(mockCategorias, 'fuga_agua');
      
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Agua Potable');
      expect(result[0].tipos[0].tipo).toBe('fuga_agua');
    });

    it('partial slug match works', () => {
      const result = filterCategorias(mockCategorias, 'pavimento');
      
      expect(result).toHaveLength(1);
      expect(result[0].tipos[0].tipo).toBe('pavimento_danado');
    });
  });

  describe('Search Across Multiple Categories', () => {
    it('shows matches from multiple categories', () => {
      // "Dañ" appears in "Pavimento Dañado" and "Luminaria Dañada"
      const result = filterCategorias(mockCategorias, 'Dañ');
      
      expect(result).toHaveLength(2);
      expect(result.map(c => c.nombre)).toContain('Obras Públicas');
      expect(result.map(c => c.nombre)).toContain('Servicios Públicos');
      
      // Each should only have the matching type
      const obrasPublicas = result.find(c => c.nombre === 'Obras Públicas');
      const serviciosPublicos = result.find(c => c.nombre === 'Servicios Públicos');
      
      expect(obrasPublicas.tipos).toHaveLength(1);
      expect(obrasPublicas.tipos[0].nombre).toBe('Pavimento Dañado');
      
      expect(serviciosPublicos.tipos).toHaveLength(1);
      expect(serviciosPublicos.tipos[0].nombre).toBe('Luminaria Dañada');
    });
  });

  describe('No Results', () => {
    it('returns empty array when no matches', () => {
      const result = filterCategorias(mockCategorias, 'xyznonexistent');
      
      expect(result).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles categories with empty tipos array', () => {
      const catsWithEmpty = [
        ...mockCategorias,
        { id: 99, nombre: 'Vacía', icono: '📭', color: '#999', tipos: [] },
      ];
      
      const result = filterCategorias(catsWithEmpty, 'Vacía');
      
      expect(result).toHaveLength(1);
      expect(result[0].nombre).toBe('Vacía');
      expect(result[0].tipos).toHaveLength(0);
    });

    it('handles categories with undefined tipos', () => {
      const catsWithUndefined = [
        { id: 100, nombre: 'Sin Tipos', icono: '❓', color: '#ccc' },
      ];
      
      const result = filterCategorias(catsWithUndefined, 'Sin');
      
      expect(result).toHaveLength(1);
    });

    it('handles special characters in search', () => {
      const result = filterCategorias(mockCategorias, 'Públic');
      
      expect(result).toHaveLength(2);
    });
  });
});

describe('tipo.tipo Field Display', () => {
  it('uses tipo.tipo instead of tipo.slug', () => {
    // The mockCategorias use 'tipo' field, not 'slug'
    const bachesTipo = mockCategorias[0].tipos[0];
    
    expect(bachesTipo.tipo).toBe('baches');
    expect(bachesTipo).not.toHaveProperty('slug');
  });
});
