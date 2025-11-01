  const [vista, setVista] = useState('mis-reportes'); // 'mis-reportes', 'cierres-pendientes', 'reportes-dependencia'
  const [reportes, setReportes] = useState([]);
  const [reportesDependencia, setReportesDependencia] = useState([]);
  const [cierresPendientes, setCierresPendientes] = useState([]);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal de cierre
  const [mostrarModalCierre, setMostrarModalCierre] = useState(false);
  const [notasCierre, setNotasCierre] = useState('');
  const [firmaDigital, setFirmaDigital] = useState('');
  const [evidenciaFotos, setEvidenciaFotos] = useState([]);

  // Modal de asignación
  const [mostrarModalAsignacion, setMostrarModalAsignacion] = useState(false);
  const [funcionariosDisponibles, setFuncionariosDisponibles] = useState([]);
  const [funcionarioSeleccionado, setFuncionarioSeleccionado] = useState('');
  const [notasAsignacion, setNotasAsignacion] = useState('');
