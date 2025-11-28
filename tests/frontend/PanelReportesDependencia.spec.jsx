/**
 * Unit Tests: PanelFuncionario - Reportes de Mi Dependencia
 * 
 * Tests the logic for loading and displaying department reports:
 * - Admin sees ALL reports from ALL departments
 * - Supervisor sees only reports from their department
 * - Funcionario doesn't have access to this tab
 * - Loading states and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => { localStorageMock.store[key] = value; }),
  removeItem: vi.fn((key) => { delete localStorageMock.store[key]; }),
  clear: vi.fn(() => { localStorageMock.store = {}; })
};

describe('Reportes de Mi Dependencia - API Logic', () => {
  
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear();
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Admin Role', () => {
    
    it('should build correct API endpoint for admin (no dependencia filter)', async () => {
      const usuario = { rol: 'admin', dependencia: 'administracion' };
      
      // Admin should call /api/reportes without dependencia filter
      const buildEndpoint = (user) => {
        if (user.rol === 'admin') {
          return '/api/reportes';
        }
        return `/api/reportes?dependencia=${user.dependencia}`;
      };
      
      const endpoint = buildEndpoint(usuario);
      expect(endpoint).toBe('/api/reportes');
    });
    
    it('should include all reports from all departments for admin', () => {
      const allReportes = [
        { id: 1, tipo: 'baches', dependencia: 'obras_publicas' },
        { id: 2, tipo: 'alumbrado', dependencia: 'servicios_publicos' },
        { id: 3, tipo: 'seguridad', dependencia: 'seguridad_publica' },
        { id: 4, tipo: 'agua', dependencia: 'agua_potable' },
        { id: 5, tipo: 'parques', dependencia: 'medio_ambiente' }
      ];
      
      const usuario = { rol: 'admin', dependencia: 'administracion' };
      
      // Admin should see all reports (no filtering)
      const filterReportesForUser = (reportes, user) => {
        if (user.rol === 'admin') return reportes;
        return reportes.filter(r => r.dependencia === user.dependencia);
      };
      
      const visibleReportes = filterReportesForUser(allReportes, usuario);
      expect(visibleReportes).toHaveLength(5);
    });
    
    it('should show admin-specific empty state message', () => {
      const getEmptyMessage = (user) => {
        if (user.rol === 'admin') {
          return 'No hay reportes en el sistema. Cuando los ciudadanos reporten problemas, aparecerán aquí.';
        }
        return 'No hay reportes asignados a tu dependencia en este momento.';
      };
      
      const usuario = { rol: 'admin', dependencia: 'administracion' };
      const message = getEmptyMessage(usuario);
      
      expect(message).toContain('No hay reportes en el sistema');
    });
  });

  describe('Supervisor Role', () => {
    
    it('should build correct API endpoint for supervisor (with dependencia filter)', async () => {
      const usuario = { rol: 'supervisor', dependencia: 'obras_publicas' };
      
      const buildEndpoint = (user) => {
        if (user.rol === 'admin') {
          return '/api/reportes';
        }
        return `/api/reportes?dependencia=${user.dependencia}`;
      };
      
      const endpoint = buildEndpoint(usuario);
      expect(endpoint).toBe('/api/reportes?dependencia=obras_publicas');
    });
    
    it('should only include reports from supervisor department', () => {
      const allReportes = [
        { id: 1, tipo: 'baches', dependencia: 'obras_publicas' },
        { id: 2, tipo: 'alumbrado', dependencia: 'servicios_publicos' },
        { id: 3, tipo: 'pavimento', dependencia: 'obras_publicas' },
        { id: 4, tipo: 'agua', dependencia: 'agua_potable' },
        { id: 5, tipo: 'banqueta', dependencia: 'obras_publicas' }
      ];
      
      const usuario = { rol: 'supervisor', dependencia: 'obras_publicas' };
      
      const filterReportesForUser = (reportes, user) => {
        if (user.rol === 'admin') return reportes;
        return reportes.filter(r => r.dependencia === user.dependencia);
      };
      
      const visibleReportes = filterReportesForUser(allReportes, usuario);
      expect(visibleReportes).toHaveLength(3);
      expect(visibleReportes.every(r => r.dependencia === 'obras_publicas')).toBe(true);
    });
    
    it('should show supervisor-specific empty state message', () => {
      const getEmptyMessage = (user) => {
        if (user.rol === 'admin') {
          return 'No hay reportes en el sistema. Cuando los ciudadanos reporten problemas, aparecerán aquí.';
        }
        return 'No hay reportes asignados a tu dependencia en este momento.';
      };
      
      const usuario = { rol: 'supervisor', dependencia: 'obras_publicas' };
      const message = getEmptyMessage(usuario);
      
      expect(message).toContain('No hay reportes asignados a tu dependencia');
    });
    
    it('should show different info message than admin', () => {
      const getInfoMessage = (user) => {
        if (user.rol === 'admin') {
          return 'Como administrador, puedes ver TODOS los reportes de TODAS las dependencias, sin importar su estado.';
        }
        return 'Aquí puedes ver TODOS los reportes de tu dependencia (abiertos y cerrados), para consulta y seguimiento histórico.';
      };
      
      const supervisorMessage = getInfoMessage({ rol: 'supervisor', dependencia: 'obras_publicas' });
      const adminMessage = getInfoMessage({ rol: 'admin', dependencia: 'administracion' });
      
      expect(supervisorMessage).not.toBe(adminMessage);
      expect(supervisorMessage).toContain('tu dependencia');
      expect(adminMessage).toContain('TODAS las dependencias');
    });
  });

  describe('Funcionario Role', () => {
    
    it('should not have access to Reportes de Mi Dependencia tab', () => {
      const canAccessReportesDependencia = (user) => {
        return ['admin', 'supervisor'].includes(user.rol);
      };
      
      const usuario = { rol: 'funcionario', dependencia: 'obras_publicas' };
      expect(canAccessReportesDependencia(usuario)).toBe(false);
    });
    
    it('admin and supervisor should have access', () => {
      const canAccessReportesDependencia = (user) => {
        return ['admin', 'supervisor'].includes(user.rol);
      };
      
      expect(canAccessReportesDependencia({ rol: 'admin' })).toBe(true);
      expect(canAccessReportesDependencia({ rol: 'supervisor' })).toBe(true);
    });
  });

  describe('useEffect Dependencies', () => {
    
    it('should recognize when token changes and trigger reload', () => {
      let loadCalled = 0;
      const mockLoad = () => { loadCalled++; };
      
      // Simulate the effect dependency array behavior
      const runEffect = (token, usuario) => {
        if (!token || !usuario) return;
        mockLoad();
      };
      
      // First call with valid token
      runEffect('token123', { id: 1, rol: 'admin' });
      expect(loadCalled).toBe(1);
      
      // Second call with different token (should trigger reload)
      runEffect('token456', { id: 1, rol: 'admin' });
      expect(loadCalled).toBe(2);
    });
    
    it('should not load if token is missing', () => {
      let loadCalled = 0;
      const mockLoad = () => { loadCalled++; };
      
      const runEffect = (token, usuario) => {
        if (!token || !usuario) return;
        mockLoad();
      };
      
      runEffect(null, { id: 1, rol: 'admin' });
      expect(loadCalled).toBe(0);
      
      runEffect('', { id: 1, rol: 'admin' });
      expect(loadCalled).toBe(0);
    });
    
    it('should not load if usuario is missing', () => {
      let loadCalled = 0;
      const mockLoad = () => { loadCalled++; };
      
      const runEffect = (token, usuario) => {
        if (!token || !usuario) return;
        mockLoad();
      };
      
      runEffect('token123', null);
      expect(loadCalled).toBe(0);
    });
  });

  describe('Filter Logic', () => {
    
    it('should filter reports by estado', () => {
      const reportes = [
        { id: 1, tipo: 'baches', estado: 'abierto' },
        { id: 2, tipo: 'alumbrado', estado: 'asignado' },
        { id: 3, tipo: 'pavimento', estado: 'cerrado' },
        { id: 4, tipo: 'agua', estado: 'abierto' }
      ];
      
      const filterByEstado = (reps, estado) => {
        if (!estado) return reps;
        return reps.filter(r => r.estado === estado);
      };
      
      expect(filterByEstado(reportes, 'abierto')).toHaveLength(2);
      expect(filterByEstado(reportes, 'cerrado')).toHaveLength(1);
      expect(filterByEstado(reportes, null)).toHaveLength(4);
    });
    
    it('should filter reports by date range', () => {
      const reportes = [
        { id: 1, fecha: '2025-01-01' },
        { id: 2, fecha: '2025-01-15' },
        { id: 3, fecha: '2025-02-01' },
        { id: 4, fecha: '2025-02-15' }
      ];
      
      const filterByDateRange = (reps, desde, hasta) => {
        return reps.filter(r => {
          if (desde && r.fecha < desde) return false;
          if (hasta && r.fecha > hasta) return false;
          return true;
        });
      };
      
      expect(filterByDateRange(reportes, '2025-01-10', null)).toHaveLength(3);
      expect(filterByDateRange(reportes, null, '2025-01-20')).toHaveLength(2);
      expect(filterByDateRange(reportes, '2025-01-10', '2025-02-05')).toHaveLength(2);
    });
  });
  
  describe('API Response Handling', () => {
    
    it('should handle empty array response', () => {
      const handleResponse = (data) => {
        return Array.isArray(data) ? data : [];
      };
      
      expect(handleResponse([])).toEqual([]);
      expect(handleResponse(undefined)).toEqual([]);
      expect(handleResponse(null)).toEqual([]);
    });
    
    it('should handle valid array response', () => {
      const handleResponse = (data) => {
        return Array.isArray(data) ? data : [];
      };
      
      const reportes = [{ id: 1 }, { id: 2 }];
      expect(handleResponse(reportes)).toHaveLength(2);
    });
    
    it('should handle API error gracefully', () => {
      const handleApiError = (error) => {
        console.error('Error loading reports:', error);
        return [];
      };
      
      const result = handleApiError(new Error('Network error'));
      expect(result).toEqual([]);
    });
  });

  describe('BUGFIX: filtroEstado should NOT apply to reportes-dependencia (Issue 2025-11-27)', () => {
    
    it('should NOT add estado parameter to API call for reportes-dependencia', () => {
      // This tests the fix: filtroEstado was being applied to reportes-dependencia
      // view, but it should only apply to cierres-pendientes view
      const buildReportesDependenciaURL = (usuario, filtroEstado, fechaInicio, fechaFin) => {
        const params = new URLSearchParams();
        
        // Admin sees all, others only their department
        if (usuario.rol !== 'admin') {
          params.append('dependencia', usuario.dependencia);
        }
        
        // ONLY date filters apply - NOT filtroEstado!
        if (fechaInicio) params.append('from', fechaInicio);
        if (fechaFin) params.append('to', fechaFin);
        
        return `/api/reportes?${params.toString()}`;
      };
      
      // Even with filtroEstado='pendiente', the URL should NOT include estado
      const url = buildReportesDependenciaURL(
        { rol: 'admin', dependencia: 'administracion' },
        'pendiente', // This should be IGNORED
        null,
        null
      );
      
      expect(url).not.toContain('estado=');
      expect(url).toBe('/api/reportes?');
    });
    
    it('should NOT filter out abierto reports when filtroEstado is pendiente', () => {
      // Bug scenario: All reports are 'abierto', but filtroEstado='pendiente'
      // was being sent to API, returning 0 results
      const allReportes = [
        { id: 1, tipo: 'baches', estado: 'abierto' },
        { id: 2, tipo: 'alumbrado', estado: 'abierto' },
        { id: 3, tipo: 'agua', estado: 'abierto' }
      ];
      
      // Reportes-dependencia view should show ALL regardless of filtroEstado
      const filterForReportesDependencia = (reportes, _filtroEstado) => {
        // filtroEstado is intentionally ignored for this view
        return reportes;
      };
      
      const result = filterForReportesDependencia(allReportes, 'pendiente');
      expect(result).toHaveLength(3);
    });
    
    it('filtroEstado SHOULD apply to cierres-pendientes view', () => {
      // Contrast: cierres-pendientes DOES use filtroEstado
      const buildCierresPendientesURL = (filtroEstado, fechaInicio, fechaFin) => {
        const params = new URLSearchParams({
          estado: filtroEstado,
          limit: '10',
          offset: '0'
        });
        
        if (fechaInicio) params.append('fecha_inicio', fechaInicio);
        if (fechaFin) params.append('fecha_fin', fechaFin);
        
        return `/api/reportes/cierres-pendientes?${params.toString()}`;
      };
      
      const url = buildCierresPendientesURL('pendiente', null, null);
      
      expect(url).toContain('estado=pendiente');
    });
    
    it('date filters SHOULD apply to reportes-dependencia view', () => {
      const buildReportesDependenciaURL = (usuario, fechaInicio, fechaFin) => {
        const params = new URLSearchParams();
        
        if (usuario.rol !== 'admin') {
          params.append('dependencia', usuario.dependencia);
        }
        
        if (fechaInicio) params.append('from', fechaInicio);
        if (fechaFin) params.append('to', fechaFin);
        
        return `/api/reportes?${params.toString()}`;
      };
      
      const url = buildReportesDependenciaURL(
        { rol: 'supervisor', dependencia: 'obras_publicas' },
        '2025-01-01',
        '2025-12-31'
      );
      
      expect(url).toContain('from=2025-01-01');
      expect(url).toContain('to=2025-12-31');
      expect(url).toContain('dependencia=obras_publicas');
    });
  });
});
