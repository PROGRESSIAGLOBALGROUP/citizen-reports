# Almacenamiento de Firmas y Evidencias Fotográficas

## 📋 Resumen Ejecutivo

Las **firmas digitales** y **evidencias fotográficas** se almacenan directamente en la base de datos SQLite en formato **base64** dentro de campos de tipo TEXT. Esta es la solución óptima para un sistema de escala municipal donde:

- Volumen moderado de datos (< 10,000 reportes/año)
- Simplicidad operativa (un solo archivo `.db` para backup/restore)
- Sin necesidad de infraestructura adicional (buckets S3, CDN, etc.)

---

## 🔐 Firmas Digitales

### Almacenamiento

**Tabla: `usuarios`**
```sql
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
  firma_digital TEXT,  -- Firma predeterminada del usuario
  ...
);
```

**Tabla: `cierres_pendientes`**
```sql
CREATE TABLE cierres_pendientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
  firma_digital TEXT NOT NULL,  -- Firma específica para este cierre
  ...
);
```

### Formato de Datos

**Formato:** Data URI con imagen PNG en base64

```javascript
// Ejemplo de firma almacenada:
"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWCAYAAABkW7XSAA..."
```

### Tamaño Aproximado

- Firma típica (canvas 400x150px, PNG): **~15-30 KB**
- En base64: **~20-40 KB** (33% más grande que binario)
- SQLite TEXT puede almacenar hasta **1 GB** por campo

### Captura de Firma (Frontend)

```javascript
import SignatureCanvas from 'react-signature-canvas';

// Componente React
const [firmaRef] = useState(useRef());

// Capturar firma
const capturarFirma = () => {
  if (firmaRef.current.isEmpty()) {
    alert('Debes firmar antes de continuar');
    return;
  }
  
  // Obtener data URL en base64
  const dataURL = firmaRef.current.toDataURL('image/png');
  setFirmaDigital(dataURL);
};

// Componente de firma
<SignatureCanvas
  ref={firmaRef}
  canvasProps={{
    width: 400,
    height: 150,
    className: 'signature-canvas'
  }}
/>
```

### Envío al Backend

```javascript
// POST /api/reportes/:id/solicitar-cierre
const response = await fetch(`/api/reportes/${reporteId}/solicitar-cierre`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    funcionario_id: usuario.id,
    notas_cierre: 'Trabajo completado satisfactoriamente',
    firma_digital: dataURL,  // Data URI completo
    evidencia_fotos: [...]
  })
});
```

### Almacenamiento en BD (Backend)

```javascript
// server/reportes_auth_routes.js
export function solicitarCierre(req, res) {
  const { id } = req.params;
  const { funcionario_id, notas_cierre, firma_digital, evidencia_fotos } = req.body;
  
  // Validar que la firma es un data URL válido
  if (!firma_digital || !firma_digital.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Firma digital inválida' });
  }
  
  const sql = `
    INSERT INTO cierres_pendientes 
    (reporte_id, funcionario_id, notas_cierre, firma_digital, evidencia_fotos)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [id, funcionario_id, notas_cierre, firma_digital, evidencia_fotos], ...);
}
```

---

## 📸 Evidencias Fotográficas

### Almacenamiento

**Tabla: `cierres_pendientes`**
```sql
CREATE TABLE cierres_pendientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ...
  evidencia_fotos TEXT,  -- JSON array de data URLs en base64
  ...
);
```

### Formato de Datos

**Formato:** JSON array de Data URIs

```javascript
// Ejemplo de evidencia_fotos almacenado:
'["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...", "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD..."]'
```

### Límites Recomendados

- **Máximo 3 fotos** por cierre
- Resolución máxima: **1024x1024 px**
- Calidad JPEG: **80%**
- Tamaño por foto: **~150-300 KB** en base64
- Tamaño total: **~450-900 KB** por cierre (aceptable para SQLite)

### Captura de Fotos (Frontend)

```javascript
// Estado para almacenar fotos
const [evidenciaFotos, setEvidenciaFotos] = useState([]);

// Manejador de input file
const handleFileChange = async (event) => {
  const files = Array.from(event.target.files);
  
  if (evidenciaFotos.length + files.length > 3) {
    alert('Máximo 3 fotos permitidas');
    return;
  }
  
  // Convertir cada archivo a data URL con compresión
  const promises = files.map(file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Comprimir imagen
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calcular dimensiones (max 1024px)
          let width = img.width;
          let height = img.height;
          const maxSize = 1024;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a JPEG con calidad 80%
          const compressedDataURL = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedDataURL);
        };
        img.src = e.target.result;
      };
      
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });
  
  const dataURLs = await Promise.all(promises);
  setEvidenciaFotos([...evidenciaFotos, ...dataURLs]);
};

// Input de archivo
<input
  type="file"
  accept="image/*"
  multiple
  onChange={handleFileChange}
  style={{ display: 'none' }}
  id="evidencia-input"
/>
<label htmlFor="evidencia-input">
  <button type="button">📷 Agregar Fotos</button>
</label>

// Previsualización
{evidenciaFotos.map((foto, idx) => (
  <div key={idx} style={{ position: 'relative' }}>
    <img src={foto} alt={`Evidencia ${idx+1}`} style={{ width: 100, height: 100 }} />
    <button onClick={() => {
      setEvidenciaFotos(evidenciaFotos.filter((_, i) => i !== idx));
    }}>
      🗑️
    </button>
  </div>
))}
```

### Envío al Backend

```javascript
// Convertir array a JSON string antes de enviar
const response = await fetch(`/api/reportes/${reporteId}/solicitar-cierre`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    funcionario_id: usuario.id,
    notas_cierre: 'Reparación completada',
    firma_digital: firmaDataURL,
    evidencia_fotos: JSON.stringify(evidenciaFotos)  // Array → JSON string
  })
});
```

### Almacenamiento en BD (Backend)

```javascript
// server/reportes_auth_routes.js
export function solicitarCierre(req, res) {
  const { evidencia_fotos } = req.body;
  
  // Validar que es un JSON array válido
  let fotosArray;
  try {
    fotosArray = JSON.parse(evidencia_fotos);
    if (!Array.isArray(fotosArray)) {
      throw new Error('Debe ser un array');
    }
  } catch (err) {
    return res.status(400).json({ error: 'Formato de evidencia_fotos inválido' });
  }
  
  // Validar límite de fotos
  if (fotosArray.length > 3) {
    return res.status(400).json({ error: 'Máximo 3 fotos permitidas' });
  }
  
  // Validar que cada foto es un data URL válido
  const isValid = fotosArray.every(foto => 
    typeof foto === 'string' && foto.startsWith('data:image/')
  );
  
  if (!isValid) {
    return res.status(400).json({ error: 'Una o más fotos tienen formato inválido' });
  }
  
  // Guardar en BD (ya como JSON string)
  const sql = `
    INSERT INTO cierres_pendientes 
    (reporte_id, funcionario_id, notas_cierre, firma_digital, evidencia_fotos)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [id, funcionario_id, notas_cierre, firma_digital, evidencia_fotos], ...);
}
```

### Recuperación y Visualización

```javascript
// Backend - Obtener cierre
export function obtenerCierrePendiente(req, res) {
  const sql = `SELECT * FROM cierres_pendientes WHERE id = ?`;
  
  db.get(sql, [id], (err, row) => {
    if (err) return res.status(500).json({ error: 'Error de BD' });
    
    // Parsear evidencia_fotos de JSON string a array
    if (row.evidencia_fotos) {
      row.evidencia_fotos = JSON.parse(row.evidencia_fotos);
    }
    
    res.json(row);
  });
}

// Frontend - Mostrar fotos
{cierre.evidencia_fotos && cierre.evidencia_fotos.map((foto, idx) => (
  <img
    key={idx}
    src={foto}  // Data URL se usa directamente como src
    alt={`Evidencia ${idx+1}`}
    style={{
      width: 200,
      height: 200,
      objectFit: 'cover',
      borderRadius: 8
    }}
  />
))}
```

---

## ⚖️ Consideraciones de Escalabilidad

### Capacidad Actual (SQLite)

Con límites establecidos:
- **Firma**: ~30 KB
- **Evidencias**: ~900 KB (3 fotos × 300 KB)
- **Total por cierre**: ~930 KB
- **10,000 cierres/año**: ~9.3 GB/año
- **SQLite máximo**: 281 TB (límite teórico)

✅ **Adecuado para sistema municipal** (5-10 años sin problemas)

### Cuándo Migrar a Almacenamiento Externo

Considerar S3/Azure Blob cuando:
- Volumen > 50,000 reportes/año
- Necesidad de CDN para carga rápida
- Múltiples instancias del servidor (escalado horizontal)
- Backups exceden 10 GB

### Migración Futura (si es necesario)

```javascript
// Ejemplo con Azure Blob Storage
import { BlobServiceClient } from '@azure/storage-blob';

const uploadToBlob = async (dataURL, containerName, blobName) => {
  // Convertir data URL a buffer
  const base64Data = dataURL.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Upload
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
  await blockBlobClient.upload(buffer, buffer.length);
  
  // Devolver URL pública
  return blockBlobClient.url;
};

// En BD solo guardaríamos la URL, no el base64
firma_digital: "https://citizen-reports.blob.core.windows.net/firmas/cierre-123.png"
```

---

## 🔒 Seguridad y Privacidad

### Protecciones Implementadas

1. **Validación de Formato**: Solo acepta data URLs con prefijo `data:image/`
2. **Límite de Tamaño**: Máximo 3 fotos, compresión obligatoria
3. **No-PII**: Las fotos de evidencia NO deben contener rostros o datos personales
4. **Acceso Controlado**: Solo supervisores/admins pueden ver evidencias de cierres

### Recomendaciones

```javascript
// Agregar validación de tamaño en backend
if (evidencia_fotos) {
  const totalSize = evidencia_fotos.length;  // bytes del JSON string
  const maxSize = 2 * 1024 * 1024;  // 2 MB límite
  
  if (totalSize > maxSize) {
    return res.status(400).json({ 
      error: 'El tamaño total de las evidencias excede el límite (2 MB)' 
    });
  }
}
```

---

## ✅ Implementación Actual

El sistema **YA TIENE** la estructura de BD lista:

```sql
-- Tabla usuarios con campo de firma
CREATE TABLE usuarios (
  ...
  firma_digital TEXT,  -- ✅ Ya existe
  ...
);

-- Tabla cierres_pendientes con campos de firma y evidencias
CREATE TABLE cierres_pendientes (
  ...
  firma_digital TEXT NOT NULL,     -- ✅ Ya existe
  evidencia_fotos TEXT,             -- ✅ Ya existe
  ...
);
```

**Solo falta implementar en el frontend:**
1. Canvas de firma (usar `react-signature-canvas`)
2. Input de fotos con compresión
3. Envío en el flujo de "Solicitar Cierre"

---

## 📚 Referencias

- **Data URLs**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URLs
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- **FileReader API**: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
- **SQLite Limits**: https://www.sqlite.org/limits.html
