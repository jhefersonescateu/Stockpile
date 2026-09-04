import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// SQLite Database Connection
const dbPath = path.join(__dirname, 'db', 'inventario.db');
if (!fs.existsSync(dbPath)) {
  console.log('Base de datos no encontrada. Inicializando base de datos...');
  await import('./db/initDb.js');
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Helper functions for parsing JSON stored fields
function formatItemRow(row) {
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

// ==================== ROUTES ==================== //

// 1. GET /api/inventory - Get all inventory items
app.get('/api/inventory', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM inventario ORDER BY rowid DESC').all();
    const formatted = rows.map(formatItemRow);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (error) {
    console.error('Error al consultar inventario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET /api/inventory/:id - Get a single item
app.get('/api/inventory/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM inventario WHERE id = ?').get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, error: 'Elemento no encontrado' });
    }
    res.json({ success: true, data: formatItemRow(row) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. POST /api/inventory - Create a new item with category questionnaire responses
app.post('/api/inventory', (req, res) => {
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
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes: nombre, categoría y ubicación son obligatorios.'
      });
    }

    // Auto generate code if empty
    let itemCode = code ? code.trim() : '';
    if (!itemCode) {
      const catPrefix = category.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'CAT');
      const countRow = db.prepare('SELECT COUNT(*) as cnt FROM inventario').get();
      const num = (countRow.cnt + 1).toString().padStart(3, '0');
      itemCode = `QUI-${catPrefix}-${num}`;
    }

    const id = itemCode;
    const customFieldsJson = JSON.stringify(customFields || {});

    const stmt = db.prepare(`
      INSERT INTO inventario (id, code, name, category, location, brand, model, serial_number, quantity, status, details, notes, custom_fields)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, itemCode, name, category, location, brand, model, serialNumber, quantity, status, details, notes, customFieldsJson);

    const inserted = db.prepare('SELECT * FROM inventario WHERE id = ?').get(id);
    res.status(201).json({ success: true, message: 'Ítem agregado a SQLite con éxito', data: formatItemRow(inserted) });
  } catch (error) {
    console.error('Error al insertar ítem:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. PUT /api/inventory/:id - Update item
app.put('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM inventario WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Ítem no encontrado en base de datos' });
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

    const stmt = db.prepare(`
      UPDATE inventario
      SET name = ?, category = ?, location = ?, brand = ?, model = ?, serial_number = ?,
          quantity = ?, status = ?, details = ?, notes = ?, custom_fields = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(name, category, location, brand, model, serialNumber, quantity, status, details, notes, updatedCustomFieldsJson, id);

    const updatedRow = db.prepare('SELECT * FROM inventario WHERE id = ?').get(id);
    res.json({ success: true, message: 'Ítem actualizado exitosamente', data: formatItemRow(updatedRow) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. DELETE /api/inventory/:id - Delete item
app.delete('/api/inventory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const info = db.prepare('DELETE FROM inventario WHERE id = ?').run(id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: 'Ítem no encontrado' });
    }
    res.json({ success: true, message: `Ítem ${id} eliminado de la base de datos` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. GET /api/categories/questionnaires - Get question schemas for all or a category
app.get('/api/categories/questionnaires', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM cuestionarios_categoria').all();
    const questionnairesMap = {};
    rows.forEach(r => {
      let fieldsParsed = [];
      try { fieldsParsed = JSON.parse(r.fields); } catch (e) { fieldsParsed = []; }
      questionnairesMap[r.category] = {
        title: r.title,
        icon: r.icon,
        fields: fieldsParsed
      };
    });
    res.json({ success: true, data: questionnairesMap });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. GET /api/stats - Statistics dashboard
app.get('/api/stats', (req, res) => {
  try {
    const totalItems = db.prepare('SELECT SUM(quantity) as totalQty, COUNT(*) as totalUnique FROM inventario').get();
    const byCategory = db.prepare('SELECT category, SUM(quantity) as count FROM inventario GROUP BY category').all();
    const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM inventario GROUP BY status').all();
    const byLocation = db.prepare('SELECT location, COUNT(*) as count FROM inventario GROUP BY location').all();

    res.json({
      success: true,
      stats: {
        totalQuantity: totalItems.totalQty || 0,
        totalUniqueItems: totalItems.totalUnique || 0,
        byCategory,
        byStatus,
        byLocation
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Servidor Node.js con SQLite activo en: http://localhost:${PORT}`);
  console.log(`📁 Base de Datos vinculada: ${dbPath}`);
});
