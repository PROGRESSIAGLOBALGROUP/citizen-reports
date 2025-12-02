import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AdminDashboard from '../../client/src/AdminDashboard.jsx';

// Mock localStorage
const mockToken = 'test-admin-token-123';
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => mockToken),
    setItem: vi.fn(),
    removeItem: vi.fn()
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AdminDashboard', () => {
  it('muestra estado de carga inicial', () => {
    // Mock fetch para que no resuelva inmediatamente
    global.fetch = vi.fn(() => new Promise(() => {}));
    
    render(<AdminDashboard />);
    
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('muestra dashboard con datos después de cargar', async () => {
    const mockData = {
      general: {
        total_reportes: 150,
        reportes_cerrados: 100,
        reportes_pendientes: 30,
        reportes_hoy: 5,
        usuarios_activos: 10,
        promedio_resolucion: 2.5
      },
      porEstado: [
        { estado: 'pendiente', cantidad: 30 },
        { estado: 'en_proceso', cantidad: 20 },
        { estado: 'cerrado', cantidad: 100 }
      ],
      porTipo: [
        { tipo: 'Bache', cantidad: 50 },
        { tipo: 'Alumbrado', cantidad: 30 }
      ],
      porDependencia: [
        { dependencia: 'Obras Públicas', cantidad: 80 },
        { dependencia: 'Servicios Públicos', cantidad: 70 }
      ],
      tendenciaSemanal: [
        { periodo: '2025-01-01', cantidad: 10 }
      ],
      tendenciaMensual: [
        { periodo: '2025-01', cantidad: 150 }
      ],
      tiempoResolucion: {
        promedio: 2.5,
        maximo: 10,
        minimo: 0.5
      },
      personal: {
        funcionarios: 8,
        supervisores: 2,
        admins: 1
      },
      cierresPendientes: 3,
      recientes24h: 5,
      porPrioridad: [
        { prioridad: 'alta', cantidad: 20 },
        { prioridad: 'media', cantidad: 50 },
        { prioridad: 'baja', cantidad: 80 }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard de Métricas')).toBeInTheDocument();
    });

    // Verifica KPIs usando getAllByText cuando puede haber duplicados
    expect(screen.getByText('150')).toBeInTheDocument(); // Total reportes
    const cerradosElements = screen.getAllByText('100');
    expect(cerradosElements.length).toBeGreaterThanOrEqual(1);
  });

  it('muestra error cuando falla la carga', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      // Busca el elemento específico de error
      expect(screen.getByText('Error al cargar datos')).toBeInTheDocument();
    });
  });

  it('usa token de localStorage para autenticación', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        general: { total_reportes: 0 },
        porEstado: [],
        porTipo: [],
        porDependencia: [],
        tendenciaSemanal: [],
        tendenciaMensual: [],
        tiempoResolucion: {},
        personal: {},
        cierresPendientes: 0,
        recientes24h: 0,
        porPrioridad: []
      })
    });

    render(<AdminDashboard />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/admin/dashboard'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`
          })
        })
      );
    });
  });
});
