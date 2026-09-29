import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const tursoUrl = process.env.TURSO_DATABASE_URL || process.env.TURSO_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN || process.env.TURSO_TOKEN;
const forceDbMode = (process.env.DB_MODE || process.env.DATABASE_MODE || '').toLowerCase();
const useTurso = forceDbMode === 'turso' || (!forceDbMode || forceDbMode === 'auto') && Boolean(tursoUrl) && Boolean(tursoAuthToken);

// Middleware
app.use(cors());
app.use(express.json());

function normalizeTursoRows(resultSet) {
  if (!resultSet || !Array.isArray(resultSet.rows)) {
    return [];
  }

  const columns = resultSet.columns || [];
  return resultSet.rows.map((row) => {
    const obj = {};
    columns.forEach((column, index) => {
      obj[column] = row[index];
    });
    return obj;
  });
}

function normalizePayloadRow(row) {
  if (!row) return null;
  let customFieldsParsed = {};
  try {
    if (row.custom_fields) {
      customFieldsParsed = typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields) : row.custom_fields;
    }
  } catch (e) {
    customFieldsParsed = {};
  }

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    category: row.category,
    location: row.location,
    brand: row.brand || '',
    model: row.model || '',
    serialNumber: row.serial_number || '',
    quantity: Number(row.quantity) || 1,
    status: row.status || 'Bueno',
    details: row.details || '',
    notes: row.notes || '',
    customFields: customFieldsParsed,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

let db;
let sourceName = 'SQLite Local';

async function ensureSqliteDatabase() {
  const dbPath = path.join(__dirname, 'db', 'inventario.db');
  if (!fs.existsSync(dbPath)) {
    console.log('Base de datos no encontrada. Inicializando base de datos...');
    await import('./db/initDb.js');
  }

  const sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  db = sqliteDb;
  sourceName = 'SQLite Local';
  console.log(`✅ Conectado a SQLite local: ${dbPath}`);
}

async function ensureTursoDatabase() {
  if (!tursoUrl || !tursoAuthToken) {
    throw new Error('Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN. Define ambas variables para usar Turso.');
  }

  const tursoDb = createClient({ url: tursoUrl, authToken: tursoAuthToken });
  await tursoDb.execute('SELECT 1');
  db = tursoDb;
  sourceName = 'Turso DB';
  console.log(`✅ Conectado a Turso: ${tursoUrl}`);
}

async function ensureDatabaseSchema() {
  if (useTurso) {
    await ensureTursoDatabase();
    await db.execute(`
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
        custom_fields TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS cuestionarios_categoria (
        category TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        icon TEXT,
        fields TEXT NOT NULL
      )
    `);

    const defaultQuestionnaires = [
      {
        category: 'Equipos Tecnológicos',
        title: 'Cuestionario Tecnológico',
        icon: '💻',
        fields: JSON.stringify([
          { key: 'tipo', label: 'Tipo (Material)', type: 'select', options: ['Plástico', 'Metal / Acero', 'Aluminio', 'Madera', 'Lata', 'Vidrio', 'Tela / Textil', 'Caucho / Goma', 'Cerámica', 'Otro'], required: false },
          { key: 'dimensiones', label: 'Dimensiones (Alto x Largo x Ancho)', type: 'text', placeholder: 'Ej. 30cm x 20cm x 10cm', required: false }
        ])
      },
      {
        category: 'Mobiliario Escolar',
        title: 'Cuestionario de Mobiliario',
        icon: '🪑',
        fields: JSON.stringify([
          { key: 'tipo', label: 'Tipo (Material)', type: 'select', options: ['Plástico', 'Metal / Acero', 'Aluminio', 'Madera', 'Lata', 'Vidrio', 'Tela / Textil', 'Caucho / Goma', 'Cerámica', 'Otro'], required: false },
          { key: 'material', label: 'Material de Fabricación', type: 'select', options: ['Madera Prensada y Metal', 'Melamina con Marco de Fierro', 'Plástico Inyectado Reforzado', 'Madera Maciza (Cedro/Tornillo)', 'Aluminio y Vidrio'], required: true }
        ])
      }
    ];

    for (const row of defaultQuestionnaires) {
      await db.execute({
        sql: `INSERT OR REPLACE INTO cuestionarios_categoria (category, title, icon, fields) VALUES (?, ?, ?, ?)`,
        args: [row.category, row.title, row.icon, row.fields]
      });
    }

    return;
  }

  await ensureSqliteDatabase();
}

async function getInventoryRows() {
  if (useTurso) {
    const result = await db.execute('SELECT * FROM inventario ORDER BY rowid DESC');
    return normalizeTursoRows(result);
  }

  return db.prepare('SELECT * FROM inventario ORDER BY rowid DESC').all();
}

async function getInventoryById(id) {
  if (useTurso) {
    const result = await db.execute({ sql: 'SELECT * FROM inventario WHERE id = ?', args: [id] });
    const rows = normalizeTursoRows(result);
    return rows[0] || null;
  }

  return db.prepare('SELECT * FROM inventario WHERE id = ?').get(id);
}

async function getQuestionnaireRows() {
  if (useTurso) {
    const result = await db.execute('SELECT * FROM cuestionarios_categoria');
    return normalizeTursoRows(result);
  }

  return db.prepare('SELECT * FROM cuestionarios_categoria').all();
}

async function countInventory() {
  if (useTurso) {
    const result = await db.execute('SELECT COUNT(*) as cnt FROM inventario');
    const rows = normalizeTursoRows(result);
    return Number(rows[0]?.cnt || 0);
  }

  const row = db.prepare('SELECT COUNT(*) as cnt FROM inventario').get();
  return Number(row.cnt || 0);
}

function withSource(payload) {
  return { ...payload, source: sourceName };
}

await ensureDatabaseSchema();

// ==================== ROUTES ==================== //

app.get('/api/inventory', async (req, res) => {
  try {
    const rows = await getInventoryRows();
    const formatted = rows.map(normalizePayloadRow);
    res.json(withSource({ success: true, count: formatted.length, data: formatted }));
  } catch (error) {
    console.error('Error al consultar inventario:', error);
    res.status(500).json(withSource({ success: false, error: error.message }));
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  try {
    const row = await getInventoryById(req.params.id);
    if (!row) {
      return res.status(404).json(withSource({ success: false, error: 'Elemento no encontrado' }));
    }
    res.json(withSource({ success: true, data: normalizePayloadRow(row) }));
  } catch (error) {
    res.status(500).json(withSource({ success: false, error: error.message }));
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const {
      code,
      name,
      category,
      location,
      brand = '',
      model = '',
      serialNumber = '',
      quantity = 1,
      status = 'Bueno',
      details = '',
      notes = '',
      customFields = {}
    } = req.body;

    if (!name || !category || !location) {
      return res.status(400).json(withSource({
        success: false,
        error: 'Campos requeridos faltantes: nombre, categoría y ubicación son obligatorios.'
      }));
    }

    let itemCode = code ? code.trim() : '';
    if (!itemCode) {
      const catPrefix = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CAT');
      const count = await countInventory();
      const num = (count + 1).toString().padStart(3, '0');
      itemCode = `QUI-${catPrefix}-${num}`;
    }

    const id = itemCode;
    const customFieldsJson = JSON.stringify(customFields || {});

    if (useTurso) {
      await db.execute({
        sql: `INSERT INTO inventario (id, code, name, category, location, brand, model, serial_number, quantity, status, details, notes, custom_fields)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, itemCode, name, category, location, brand, model, serialNumber, quantity, status, details, notes, customFieldsJson]
      });
    } else {
      db.prepare(`
        INSERT INTO inventario (id, code, name, category, location, brand, model, serial_number, quantity, status, details, notes, custom_fields)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, itemCode, name, category, location, brand, model, serialNumber, quantity, status, details, notes, customFieldsJson);
    }

    const inserted = await getInventoryById(id);
    res.status(201).json(withSource({ success: true, message: `Ítem agregado a ${sourceName} con éxito`, data: normalizePayloadRow(inserted) }));
  } catch (error) {
    console.error('Error al insertar ítem:', error);
    res.status(500).json(withSource({ success: false, error: error.message }));
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getInventoryById(id);
    if (!existing) {
      return res.status(404).json(withSource({ success: false, error: 'Ítem no encontrado en base de datos' }));
    }

    const {
      name = existing.name,
      category = existing.category,
      location = existing.location,
      brand = existing.brand,
      model = existing.model,
      serialNumber = existing.serial_number,
      quantity = existing.quantity,
      status = existing.status,
      details = existing.details,
      notes = existing.notes,
      customFields = null
    } = req.body;

    let updatedCustomFieldsJson = existing.custom_fields;
    if (customFields !== null && customFields !== undefined) {
      updatedCustomFieldsJson = JSON.stringify(customFields);
    }

    if (useTurso) {
      await db.execute({
        sql: `UPDATE inventario
              SET name = ?, category = ?, location = ?, brand = ?, model = ?, serial_number = ?,
                  quantity = ?, status = ?, details = ?, notes = ?, custom_fields = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?`,
        args: [name, category, location, brand, model, serialNumber, quantity, status, details, notes, updatedCustomFieldsJson, id]
      });
    } else {
      db.prepare(`
        UPDATE inventario
        SET name = ?, category = ?, location = ?, brand = ?, model = ?, serial_number = ?,
            quantity = ?, status = ?, details = ?, notes = ?, custom_fields = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, category, location, brand, model, serialNumber, quantity, status, details, notes, updatedCustomFieldsJson, id);
    }

    const updatedRow = await getInventoryById(id);
    res.json(withSource({ success: true, message: 'Ítem actualizado exitosamente', data: normalizePayloadRow(updatedRow) }));
  } catch (error) {
    res.status(500).json(withSource({ success: false, error: error.message }));
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (useTurso) {
      const result = await db.execute({ sql: 'DELETE FROM inventario WHERE id = ?', args: [id] });
      if (result.rowsAffected === 0) {
        return res.status(404).json(withSource({ success: false, error: 'Ítem no encontrado' }));
      }
    } else {
      const info = db.prepare('DELETE FROM inventario WHERE id = ?').run(id);
      if (info.changes === 0) {
        return res.status(404).json(withSource({ success: false, error: 'Ítem no encontrado' }));
      }
    }

    res.json(withSource({ success: true, message: `Ítem ${id} eliminado de la base de datos` }));
  } catch (error) {
    res.status(500).json(withSource({ success: false, error: error.message }));
  }
});

app.get('/api/categories/questionnaires', async (req, res) => {
  try {
    const rows = await getQuestionnaireRows();
    const questionnairesMap = {};
    rows.forEach((r) => {
      let fieldsParsed = [];
      try {
        fieldsParsed = JSON.parse(r.fields);
      } catch (e) {
        fieldsParsed = [];
      }
      questionnairesMap[r.category] = {
        title: r.title,
        icon: r.icon,
        fields: fieldsParsed
      };
    });
    res.json(withSource({ success: true, data: questionnairesMap }));
  } catch (error) {
    res.status(500).json(withSource({ success: false, error: error.message }));
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    let totalItems;
    let byCategory;
    let byStatus;
    let byLocation;

    if (useTurso) {
      totalItems = normalizeTursoRows(await db.execute('SELECT SUM(quantity) as totalQty, COUNT(*) as totalUnique FROM inventario'))[0] || { totalQty: 0, totalUnique: 0 };
      byCategory = normalizeTursoRows(await db.execute('SELECT category, SUM(quantity) as count FROM inventario GROUP BY category'));
      byStatus = normalizeTursoRows(await db.execute('SELECT status, COUNT(*) as count FROM inventario GROUP BY status'));
      byLocation = normalizeTursoRows(await db.execute('SELECT location, COUNT(*) as count FROM inventario GROUP BY location'));
    } else {
      totalItems = db.prepare('SELECT SUM(quantity) as totalQty, COUNT(*) as totalUnique FROM inventario').get();
      byCategory = db.prepare('SELECT category, SUM(quantity) as count FROM inventario GROUP BY category').all();
      byStatus = db.prepare('SELECT status, COUNT(*) as count FROM inventario GROUP BY status').all();
      byLocation = db.prepare('SELECT location, COUNT(*) as count FROM inventario GROUP BY location').all();
    }

    res.json(withSource({
      success: true,
      stats: {
        totalQuantity: Number(totalItems.totalQty || 0),
        totalUniqueItems: Number(totalItems.totalUnique || 0),
        byCategory,
        byStatus,
        byLocation
      }
    }));
  } catch (error) {
    res.status(500).json(withSource({ success: false, error: error.message }));
  }
});

app.get('/api/db-status', (req, res) => {
  res.json(withSource({
    success: true,
    mode: useTurso ? 'turso' : 'sqlite',
    source: sourceName
  }));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Node.js activo en: http://localhost:${PORT}`);
  console.log(`📁 Modo de base de datos: ${useTurso ? 'Turso' : 'SQLite Local'}`);
  if (useTurso) {
    console.log(`🔐 Conexión: ${tursoUrl}`);
  }
});
