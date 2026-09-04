import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'inventario.db');
const db = new Database(dbPath);

// Enable foreign keys & WAL mode for speed and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log(`Conectado a la base de datos SQLite en: ${dbPath}`);

// 1. Create inventario table
db.exec(`
  CREATE TABLE IF NOT EXISTS inventario (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    serial_number TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'Bueno',
    details TEXT,
    notes TEXT,
    custom_fields TEXT, -- JSON string with category specific questionnaire answers
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// 2. Create cuestionarios_categoria table
db.exec(`
  CREATE TABLE IF NOT EXISTS cuestionarios_categoria (
    category TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    icon TEXT,
    fields TEXT NOT NULL -- JSON array of field schemas
  );
`);

// Initial category questionnaires schema
const defaultQuestionnaires = [
  {
    category: 'Equipos Tecnológicos',
    title: 'Cuestionario Tecnológico',
    icon: '💻',
    fields: JSON.stringify([
      { key: 'voltage', label: 'Voltaje / Alimentación', type: 'select', options: ['220V AC', '110V AC', 'Batería Recargable', 'USB 5V / Type-C', 'PoE (Power over Ethernet)'], required: false },
      { key: 'ports', label: 'Puertos / Conectividad', type: 'text', placeholder: 'Ej. HDMI, VGA, Wi-Fi 6, Ethernet RJ45, Bluetooth 5.0', required: false },
      { key: 'macAddress', label: 'Dirección MAC / IP', type: 'text', placeholder: 'Ej. AA:BB:CC:DD:EE:FF / 192.168.1.50', required: false },
      { key: 'warrantyExpiry', label: 'Vencimiento de Garantía', type: 'date', required: false },
      { key: 'maintenanceStatus', label: 'Estado de Mantenimiento', type: 'select', options: ['Al día / Operativo', 'Mantenimiento Preventivo Pendiente', 'En Diagnóstico / Reparación', 'Garantía Vigente'], required: false },
      { key: 'accessories', label: 'Accesorios Incluidos', type: 'text', placeholder: 'Ej. Cable de poder, Control remoto, Soporte de techo, Adaptador', required: false }
    ])
  },
  {
    category: 'Mobiliario Escolar',
    title: 'Cuestionario de Mobiliario',
    icon: '🪑',
    fields: JSON.stringify([
      { key: 'material', label: 'Material de Fabricación', type: 'select', options: ['Madera Prensada y Metal', 'Melamina con Marco de Fierro', 'Plástico Inyectado Reforzado', 'Madera Maciza (Cedro/Tornillo)', 'Aluminio y Vidrio'], required: true },
      { key: 'dimensions', label: 'Dimensiones (Alto x Ancho x Prof.)', type: 'text', placeholder: 'Ej. 120cm x 50cm x 75cm', required: false },
      { key: 'capacity', label: 'Capacidad de Personas', type: 'select', options: ['Unipersonal (1 estudiante)', 'Bipersonal (2 estudiantes)', 'Mesa Grupal (4-6 estudiantes)', 'Uso Docente / Administrativo'], required: false },
      { key: 'color', label: 'Color Predominante', type: 'text', placeholder: 'Ej. Marrón Claro, Azul Institucional, Gris Metalizado', required: false },
      { key: 'structureState', label: 'Estado de la Estructura', type: 'select', options: ['Óptimo sin detalles', 'Requiere ajuste de pernos/soldadura', 'Superficie desgastada/rayada', 'Inestable / Para reparación'], required: false }
    ])
  },
  {
    category: 'Material Didáctico y Libros',
    title: 'Cuestionario de Material Didáctico',
    icon: '📚',
    fields: JSON.stringify([
      { key: 'publisherOrAuthor', label: 'Editorial / Autor', type: 'text', placeholder: 'Ej. Santillana, MINEDU, Ediciones Corefo', required: false },
      { key: 'isbnCode', label: 'Código ISBN / Depósito Legal', type: 'text', placeholder: 'Ej. 978-612-345-678-9 / Lote MINEDU 2024', required: false },
      { key: 'educationalLevel', label: 'Nivel Educativo Target', type: 'select', options: ['Educación Inicial', 'Educación Primaria', 'Educación Secundaria', 'Docentes / Biblioteca central'], required: true },
      { key: 'subject', label: 'Área Curricular / Asignatura', type: 'select', options: ['Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Ciencias Sociales', 'Inglés', 'Arte y Cultura', 'Robótica / STEM'], required: true },
      { key: 'editionYear', label: 'Año de Edición / Publicación', type: 'number', placeholder: 'Ej. 2024', required: false }
    ])
  },
  {
    category: 'Climatización y Audio',
    title: 'Cuestionario de Climatización y Sonido',
    icon: '❄️',
    fields: JSON.stringify([
      { key: 'powerRating', label: 'Potencia (Watts / Lumens / BTU)', type: 'text', placeholder: 'Ej. 150W, 12000 BTU, 3800 Lumens', required: false },
      { key: 'installationType', label: 'Tipo de Instalación', type: 'select', options: ['Fijado en Techo', 'Mural / Colgado en Pared', 'Portátil / Móvil con Ruedas', 'Sobremesa / Consola'], required: false },
      { key: 'hasRemote', label: 'Control Remoto / Interruptor', type: 'select', options: ['Incluye Control Remoto Inalámbrico', 'Selector de Pared Fijo', 'Sin control remoto'], required: false },
      { key: 'lastServiceDate', label: 'Fecha de Último Mantenimiento / Limpieza', type: 'date', required: false }
    ])
  },
  {
    category: 'Herramientas y Mantenimiento',
    title: 'Cuestionario de Herramientas',
    icon: '🛠️',
    fields: JSON.stringify([
      { key: 'toolCategory', label: 'Tipo de Herramienta', type: 'select', options: ['Manual (Alicate, Llave, Martillo)', 'Eléctrica con Cable 220V', 'Inalámbrica a Batería', 'Medición y Calibración', 'Corte y Jardinería'], required: true },
      { key: 'voltagePower', label: 'Especificación Técnica / Potencia', type: 'text', placeholder: 'Ej. 750W / 18V Litio / 1/2 pulgada', required: false },
      { key: 'includesCase', label: 'Maletín / Caja de Almacenamiento', type: 'select', options: ['Sí, incluye maletín original', 'No, guardado en estante común'], required: false },
      { key: 'riskLevel', label: 'Nivel de Riesgo de Manipulación', type: 'select', options: ['Bajo (Uso general)', 'Moderado (Supervisión requerida)', 'Alto (Solo personal especializado de mantenimiento)'], required: false }
    ])
  },
  {
    category: 'Suministros y Consumibles',
    title: 'Cuestionario de Consumibles y Stock',
    icon: '📦',
    fields: JSON.stringify([
      { key: 'expirationDate', label: 'Fecha de Vencimiento / Caducidad', type: 'date', required: false },
      { key: 'lotNumber', label: 'Número de Lote de Fabricación', type: 'text', placeholder: 'Ej. LOT-202408-B', required: false },
      { key: 'minStock', label: 'Punto de Reorden (Stock Mínimo Alerta)', type: 'number', placeholder: 'Ej. 5', required: false },
      { key: 'unitMeasure', label: 'Unidad de Medida', type: 'select', options: ['Unidades / Piezas', 'Cajas', 'Paquetes / Paqs', 'Litros / Galones', 'Rollos', 'Kits'], required: true }
    ])
  }
];

// Insert default categories
const insertQuestionnaire = db.prepare(`
  INSERT OR REPLACE INTO cuestionarios_categoria (category, title, icon, fields)
  VALUES (@category, @title, @icon, @fields)
`);

const insertQuestionnaireTx = db.transaction((rows) => {
  for (const row of rows) insertQuestionnaire.run(row);
});

insertQuestionnaireTx(defaultQuestionnaires);
console.log('✔ Cuestionarios por categoría registrados exitosamente en SQLite.');

// Initial Inventory table ready for 0 items
console.log('✔ Base de datos inventario.db inicializada con 0 ítems.');

export default db;
