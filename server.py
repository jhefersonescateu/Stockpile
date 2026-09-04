import os
import json
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    import pymongo
    PYMONGO_AVAILABLE = True
except ImportError:
    PYMONGO_AVAILABLE = False

app = Flask(__name__)
CORS(app)

DB_DIR = os.path.join(os.path.dirname(__file__), 'db')
DB_PATH = os.path.join(DB_DIR, 'inventario.db')
MONGO_CONFIG_PATH = os.path.join(DB_DIR, 'mongo_config.json')

# --- MongoDB Setup ---
mongo_client = None
mongo_db = None
mongo_collection = None
is_mongo_connected = False
mongo_source_name = "SQLite Local"

def init_mongo():
    global mongo_client, mongo_db, mongo_collection, is_mongo_connected, mongo_source_name
    if not PYMONGO_AVAILABLE:
        print("[!] pymongo no está instalado. Operando en modo SQLite.")
        return False

    mongo_uri = os.environ.get('MONGO_URI')
    db_name = 'inventario'
    collection_name = 'inventario'

    if os.path.exists(MONGO_CONFIG_PATH):
        try:
            with open(MONGO_CONFIG_PATH, 'r', encoding='utf-8') as f:
                cfg = json.load(f)
                mongo_uri = mongo_uri or cfg.get('mongo_uri')
                db_name = cfg.get('db_name', db_name)
                collection_name = cfg.get('collection_name', collection_name)
        except Exception as e:
            print(f"[!] Error al leer {MONGO_CONFIG_PATH}: {e}")

    if not mongo_uri:
        mongo_uri = "mongodb://localhost:27017"

    try:
        print(f"[*] Intentando conectar a MongoDB ({mongo_uri.split('@')[-1]})...")
        client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=10000)
        # Test connection ping
        client.admin.command('ping')
        mongo_client = client
        mongo_db = client[db_name]
        mongo_collection = mongo_db[collection_name]
        is_mongo_connected = True
        
        if "mongodb+srv" in mongo_uri or ".mongodb.net" in mongo_uri:
            mongo_source_name = "MongoDB Atlas (Nube)"
        else:
            mongo_source_name = "MongoDB Local"
            
        print(f"[+] Conexion exitosa a {mongo_source_name}! Base de datos: '{db_name}', Coleccion: '{collection_name}'")
        return True
    except Exception as err:
        err_msg = str(err).encode('ascii', 'ignore').decode('ascii')
        print(f"[!] No se pudo conectar a MongoDB ({err_msg}). Usando SQLite local.")
        is_mongo_connected = False
        mongo_source_name = "SQLite Local"
        return False

# --- SQLite Setup ---
def get_db_connection():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_sqlite_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create inventario table
    cursor.execute('''
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
        );
    ''')

    # 2. Create cuestionarios_categoria table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cuestionarios_categoria (
            category TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            icon TEXT,
            fields TEXT NOT NULL
        );
    ''')

    # 3. Create ubicaciones table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ubicaciones (
            name TEXT PRIMARY KEY
        );
    ''')

    # Seed questionnaires (All 11 categories including Otros / Varios)
    all_questionnaires = [
        ('Equipos Tecnológicos', 'Especificaciones Técnicas y Conectividad', '💻', json.dumps([
            {'key': 'voltage', 'label': 'Voltaje / Alimentación', 'type': 'select', 'options': ['220V AC', '110V AC', 'Batería Recargable', 'USB 5V / Type-C', 'PoE']},
            {'key': 'ports', 'label': 'Puertos / Conectividad', 'type': 'text', 'placeholder': 'Ej. HDMI, VGA, Wi-Fi 6, Ethernet'},
            {'key': 'macAddress', 'label': 'Dirección MAC / IP', 'type': 'text', 'placeholder': 'Ej. AA:BB:CC:DD:EE:FF'},
            {'key': 'warrantyExpiry', 'label': 'Vencimiento de Garantía', 'type': 'date'},
            {'key': 'maintenanceStatus', 'label': 'Estado de Mantenimiento', 'type': 'select', 'options': ['Al día / Operativo', 'Mantenimiento Preventivo Pendiente', 'En Diagnóstico / Reparación', 'Garantía Vigente']},
            {'key': 'accessories', 'label': 'Accesorios Incluidos', 'type': 'text', 'placeholder': 'Ej. Cable de poder, Control remoto'}
        ])),
        ('Mobiliario Escolar', 'Materiales y Estado Estructural', '🪑', json.dumps([
            {'key': 'material', 'label': 'Material de Fabricación', 'type': 'select', 'options': ['Madera Prensada y Metal', 'Melamina con Marco de Fierro', 'Plástico Inyectado Reforzado', 'Madera Maciza', 'Aluminio y Vidrio']},
            {'key': 'dimensions', 'label': 'Dimensiones (Alto x Ancho x Prof.)', 'type': 'text', 'placeholder': 'Ej. 120cm x 50cm x 75cm'},
            {'key': 'capacity', 'label': 'Capacidad de Personas', 'type': 'select', 'options': ['Unipersonal (1 estudiante)', 'Bipersonal (2 estudiantes)', 'Mesa Grupal (4-6 estudiantes)', 'Uso Docente']},
            {'key': 'color', 'label': 'Color Predominante', 'type': 'text', 'placeholder': 'Ej. Marrón Claro, Azul Institucional'},
            {'key': 'structureState', 'label': 'Estado de la Estructura', 'type': 'select', 'options': ['Óptimo sin detalles', 'Requiere ajuste de pernos', 'Superficie desgastada', 'Inestable']}
        ])),
        ('Material Didáctico y Libros', 'Ficha Pedagógica y Editorial', '📚', json.dumps([
            {'key': 'publisherOrAuthor', 'label': 'Editorial / Autor', 'type': 'text', 'placeholder': 'Ej. Santillana, MINEDU'},
            {'key': 'isbnCode', 'label': 'Código ISBN / Depósito Legal', 'type': 'text', 'placeholder': 'Ej. 978-612-345-678-9'},
            {'key': 'educationalLevel', 'label': 'Nivel Educativo Target', 'type': 'select', 'options': ['Educación Inicial', 'Educación Primaria', 'Educación Secundaria', 'Docentes']},
            {'key': 'subject', 'label': 'Área Curricular / Asignatura', 'type': 'select', 'options': ['Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Ciencias Sociales', 'Inglés', 'Robótica']},
            {'key': 'editionYear', 'label': 'Año de Edición', 'type': 'number', 'placeholder': 'Ej. 2024'}
        ])),
        ('Artículos Deportivos y Educación Física', 'Ficha Deportiva y Educación Física', '⚽', json.dumps([
            {'key': 'sportType', 'label': 'Disciplina / Deporte', 'type': 'select', 'options': ['Fútbol / Balompié', 'Básquet / Baloncesto', 'Vóley / Voleibol', 'Atletismo y Gimnasia', 'Ajedrez y Juegos de Mesa']},
            {'key': 'equipmentCondition', 'label': 'Estado y Presión', 'type': 'select', 'options': ['Óptimo (Inflado / Presión ok)', 'Requiere aire / inflador', 'Desgastado', 'Inoperativo']},
            {'key': 'safetyGear', 'label': 'Accesorios / Protecciones', 'type': 'text', 'placeholder': 'Ej. Incluye 10 conos, 12 chalecos'},
            {'key': 'storageBag', 'label': 'Almacenamiento', 'type': 'select', 'options': ['Guardado en Red de Nylon', 'Estante Deportivo', 'Caja Plástica']}
        ])),
        ('Utensilios de Cocina y Comedor (Qali Warma)', 'Ficha Técnica de Cocina Escolar y Qali Warma', '🍳', json.dumps([
            {'key': 'utensilMaterial', 'label': 'Material Grado Alimenticio', 'type': 'select', 'options': ['Acero Inoxidable Quirúrgico', 'Aluminio Reforzado', 'Plástico Térmico Alimenticio', 'Porcelana / Vidrio']},
            {'key': 'sanitaryStatus', 'label': 'Higiene / Registro Sanitario', 'type': 'select', 'options': ['Apto y certificado para consumo', 'Desinfección profunda requerida', 'Para reemplazo']},
            {'key': 'capacityRations', 'label': 'Capacidad / Raciones', 'type': 'text', 'placeholder': 'Ej. 50 Litros / 120 raciones diarias'},
            {'key': 'energySupply', 'label': 'Fuente de Energía / Gas', 'type': 'select', 'options': ['Gas GLP Industrial', 'Eléctrico 220V', 'Manual / Sin energía']}
        ])),
        ('Arte, Música y Banda Escolar', 'Ficha de Instrumentos y Artes Plásticas', '🎷', json.dumps([
            {'key': 'instrumentCategory', 'label': 'Familia del Instrumento', 'type': 'select', 'options': ['Viento Metal', 'Viento Madera', 'Percusión / Tambor', 'Cuerdas', 'Artes Plásticas / Caballetes']},
            {'key': 'tuningStatus', 'label': 'Estado de Afinación', 'type': 'select', 'options': ['Afinado y operativo', 'Requiere afinación / ajuste', 'En reparación']},
            {'key': 'includesCase', 'label': 'Estuche / Funda', 'type': 'select', 'options': ['Sí, estuche rígido', 'Funda acolchada', 'Sin estuche']}
        ])),
        ('Enfermería y Botiquín de Auxilios', 'Ficha de Emergencia Médica Escolar', '🩺', json.dumps([
            {'key': 'medicalCategory', 'label': 'Tipo de Equipo / Insumo', 'type': 'select', 'options': ['Botiquín Completo', 'Camilla de Evacuación', 'Tensiómetro / Termómetro', 'Antisépticos y Gasas']},
            {'key': 'expiryDate', 'label': 'Fecha Vencimiento', 'type': 'date'},
            {'key': 'sanitarySeal', 'label': 'Estado de Esterilización', 'type': 'select', 'options': ['Empaque estéril sellado', 'Reutilizable desinfectado', 'Para descarte']}
        ])),
        ('Climatización y Audio', 'Ficha Técnica de Clima y Sonido', '❄️', json.dumps([
            {'key': 'powerRating', 'label': 'Potencia (Watts / BTU)', 'type': 'text', 'placeholder': 'Ej. 150W, 12000 BTU'},
            {'key': 'installationType', 'label': 'Tipo de Instalación', 'type': 'select', 'options': ['Fijado en Techo', 'Mural en Pared', 'Portátil', 'Sobremesa']},
            {'key': 'hasRemote', 'label': 'Control Remoto / Switch', 'type': 'select', 'options': ['Control Remoto Inalámbrico', 'Selector de Pared', 'Sin control']},
            {'key': 'lastServiceDate', 'label': 'Fecha de Mantenimiento', 'type': 'date'}
        ])),
        ('Herramientas y Mantenimiento', 'Ficha de Herramientas', '🛠️', json.dumps([
            {'key': 'toolCategory', 'label': 'Tipo de Herramienta', 'type': 'select', 'options': ['Manual', 'Eléctrica 220V', 'Inalámbrica a Batería', 'Medición', 'Jardinería']},
            {'key': 'voltagePower', 'label': 'Potencia / Especificación', 'type': 'text', 'placeholder': 'Ej. 750W / 18V Litio'},
            {'key': 'includesCase', 'label': 'Maletín Incluido', 'type': 'select', 'options': ['Sí, maletín original', 'No, guardado en estante']},
            {'key': 'riskLevel', 'label': 'Nivel de Riesgo', 'type': 'select', 'options': ['Bajo', 'Moderado', 'Alto (Personal capacitado)']}
        ])),
        ('Suministros y Consumibles', 'Control de Stock y Caducidad', '📦', json.dumps([
            {'key': 'expirationDate', 'label': 'Fecha de Vencimiento', 'type': 'date'},
            {'key': 'lotNumber', 'label': 'Número de Lote', 'type': 'text', 'placeholder': 'Ej. LOT-202408-B'},
            {'key': 'minStock', 'label': 'Stock Mínimo (Alerta)', 'type': 'number', 'placeholder': 'Ej. 5'},
            {'key': 'unitMeasure', 'label': 'Unidad de Medida', 'type': 'select', 'options': ['Unidades', 'Cajas', 'Paquetes', 'Litros', 'Rollos']}
        ])),
        ('Otros / Varios', 'Ficha General para Bienes Varios', '📑', json.dumps([
            {'key': 'itemType', 'label': 'Tipo / Clasificación del Bien', 'type': 'text', 'placeholder': 'Ej. Adorno, Cortina, Escudo, Trofeo'},
            {'key': 'specification', 'label': 'Especificación Técnica / Descripción', 'type': 'text', 'placeholder': 'Ej. Dimensiones, peso o detalles especiales'},
            {'key': 'additionalNotes', 'label': 'Observaciones / Notas de Conservación', 'type': 'text', 'placeholder': 'Ej. Ubicación exacta, donante o estado de conservación'}
        ]))
    ]
    cursor.executemany('INSERT OR REPLACE INTO cuestionarios_categoria (category, title, icon, fields) VALUES (?, ?, ?, ?)', all_questionnaires)

    # Seed default locations if empty
    cursor.execute('SELECT COUNT(*) FROM ubicaciones')
    if cursor.fetchone()[0] == 0:
        default_locations = [
            ('Aula-05',), ('Aula-01',), ('Aula-02',), ('Lab. de Cómputo',), ('Biblioteca',),
            ('Lab. de Ciencias',), ('Dirección',), ('Sala de Profesores',), ('Patio Principal',),
            ('Almacén Deportivo',), ('Cocina / Comedor',)
        ]
        cursor.executemany('INSERT OR IGNORE INTO ubicaciones (name) VALUES (?)', default_locations)

    conn.commit()
    conn.close()

def format_row(row):
    if not row:
        return None
    custom_fields = {}
    if row['custom_fields']:
        try:
            custom_fields = json.loads(row['custom_fields'])
        except Exception:
            custom_fields = {}
    return {
        'id': row['id'],
        'code': row['code'],
        'name': row['name'],
        'category': row['category'],
        'location': row['location'],
        'brand': row['brand'] or '',
        'model': row['model'] or '',
        'serialNumber': row['serial_number'] or '',
        'quantity': int(row['quantity'] or 1),
        'status': row['status'] or 'Bueno',
        'details': row['details'] or '',
        'notes': row['notes'] or '',
        'customFields': custom_fields,
        'createdAt': row['created_at'],
        'updatedAt': row['updated_at']
    }

def format_mongo_doc(doc):
    if not doc:
        return None
    item_id = str(doc.get('id') or doc.get('_id'))
    return {
        'id': item_id,
        'code': doc.get('code') or item_id,
        'name': doc.get('name', ''),
        'category': doc.get('category', ''),
        'location': doc.get('location', ''),
        'brand': doc.get('brand', ''),
        'model': doc.get('model', ''),
        'serialNumber': doc.get('serialNumber') or doc.get('serial_number') or '',
        'quantity': int(doc.get('quantity', 1)),
        'status': doc.get('status', 'Bueno'),
        'details': doc.get('details', ''),
        'notes': doc.get('notes', ''),
        'customFields': doc.get('customFields') or doc.get('custom_fields') or {},
        'createdAt': str(doc.get('createdAt') or doc.get('created_at') or ''),
        'updatedAt': str(doc.get('updatedAt') or doc.get('updated_at') or '')
    }

def sync_mongo_to_sqlite(formatted_docs):
    """Sincroniza automáticamente los datos de MongoDB Atlas hacia SQLite local para respaldo offline."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        for item in formatted_docs:
            item_id = item.get('id')
            if not item_id:
                continue
            cursor.execute('''
                INSERT OR REPLACE INTO inventario (id, code, name, category, location, brand, model, serial_number, quantity, status, details, notes, custom_fields)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                item_id,
                item.get('code', item_id),
                item.get('name', ''),
                item.get('category', ''),
                item.get('location', ''),
                item.get('brand', ''),
                item.get('model', ''),
                item.get('serialNumber', ''),
                int(item.get('quantity', 1)),
                item.get('status', 'Bueno'),
                item.get('details', ''),
                item.get('notes', ''),
                json.dumps(item.get('customFields', {}))
            ))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"[!] Error sincronizando MongoDB a SQLite: {e}")

# ==================== REST API ENDPOINTS ==================== #

@app.route('/api/inventory', methods=['GET'])
def get_inventory():
    if is_mongo_connected and mongo_collection is not None:
        try:
            docs = list(mongo_collection.find({}, {'_id': 0}))
            formatted = [format_mongo_doc(d) for d in docs]
            # Sincronizar en SQLite local como respaldo local instantáneo
            sync_mongo_to_sqlite(formatted)
            return jsonify({'success': True, 'count': len(formatted), 'source': mongo_source_name, 'data': formatted})
        except Exception as e:
            print(f"[!] Error al consultar MongoDB: {e}. Usando SQLite fallback.")

    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM inventario ORDER BY rowid DESC').fetchall()
    conn.close()
    formatted = [format_row(r) for r in rows]
    return jsonify({'success': True, 'count': len(formatted), 'source': 'SQLite Local', 'data': formatted})

@app.route('/api/inventory/<item_id>', methods=['GET'])
def get_item(item_id):
    if is_mongo_connected and mongo_collection is not None:
        try:
            doc = mongo_collection.find_one({'id': item_id}, {'_id': 0})
            if doc:
                return jsonify({'success': True, 'source': mongo_source_name, 'data': format_mongo_doc(doc)})
        except Exception:
            pass

    conn = get_db_connection()
    row = conn.execute('SELECT * FROM inventario WHERE id = ?', (item_id,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'success': False, 'error': 'Ítem no encontrado'}), 404
    return jsonify({'success': True, 'source': 'SQLite Local', 'data': format_row(row)})

@app.route('/api/inventory', methods=['POST'])
def create_item():
    data = request.get_json() or {}
    name = data.get('name')
    category = data.get('category')
    location = data.get('location')

    if not name or not category or not location:
        return jsonify({'success': False, 'error': 'Nombre, categoría y ubicación son requeridos'}), 400

    conn = get_db_connection()
    code = (data.get('code') or '').strip()
    if not code:
        cat_prefix = ''.join(e for e in category[:3].upper() if e.isalnum()) or 'CAT'
        count = conn.execute('SELECT COUNT(*) FROM inventario').fetchone()[0]
        code = f'QUI-{cat_prefix}-{(count + 1):03d}'

    item_id = data.get('id') or code
    custom_fields = data.get('customFields') or {}
    custom_fields_json = json.dumps(custom_fields)

    # 1. Guardar en SQLite
    try:
        conn.execute('''
            INSERT OR REPLACE INTO inventario (id, code, name, category, location, brand, model, serial_number, quantity, status, details, notes, custom_fields)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            item_id, code, name, category, location,
            data.get('brand', ''), data.get('model', ''), data.get('serialNumber', ''),
            int(data.get('quantity', 1)), data.get('status', 'Bueno'),
            data.get('details', ''), data.get('notes', ''), custom_fields_json
        ))
        conn.commit()
    except Exception as err_sql:
        print(f"[!] Error guardando en SQLite: {err_sql}")
    finally:
        conn.close()

    item_doc = {
        'id': item_id,
        'code': code,
        'name': name,
        'category': category,
        'location': location,
        'brand': data.get('brand', ''),
        'model': data.get('model', ''),
        'serialNumber': data.get('serialNumber', ''),
        'quantity': int(data.get('quantity', 1)),
        'status': data.get('status', 'Bueno'),
        'details': data.get('details', ''),
        'notes': data.get('notes', ''),
        'customFields': custom_fields
    }

    # 2. Guardar en MongoDB
    if is_mongo_connected and mongo_collection is not None:
        try:
            mongo_collection.update_one({'id': item_id}, {'$set': item_doc}, upsert=True)
            print(f"[✓] Ítem {item_id} guardado en MongoDB ({mongo_source_name})")
        except Exception as err_m:
            print(f"[!] Error guardando en MongoDB: {err_m}")

    return jsonify({'success': True, 'message': f'Registrado exitosamente en {mongo_source_name}', 'data': item_doc}), 201

@app.route('/api/inventory/<item_id>', methods=['PUT'])
def update_item(item_id):
    data = request.get_json() or {}
    
    # 1. Guardar en SQLite
    conn = get_db_connection()
    existing = conn.execute('SELECT * FROM inventario WHERE id = ?', (item_id,)).fetchone()
    
    name = data.get('name', existing['name'] if existing else '')
    category = data.get('category', existing['category'] if existing else '')
    location = data.get('location', existing['location'] if existing else '')
    brand = data.get('brand', existing['brand'] if existing else '')
    model = data.get('model', existing['model'] if existing else '')
    serial_number = data.get('serialNumber', existing['serial_number'] if existing else '')
    quantity = int(data.get('quantity', existing['quantity'] if existing else 1))
    status = data.get('status', existing['status'] if existing else 'Bueno')
    details = data.get('details', existing['details'] if existing else '')
    notes = data.get('notes', existing['notes'] if existing else '')

    custom_fields = data.get('customFields')
    if custom_fields is None and existing:
        try:
            custom_fields = json.loads(existing['custom_fields'])
        except Exception:
            custom_fields = {}

    if existing:
        conn.execute('''
            UPDATE inventario
            SET name = ?, category = ?, location = ?, brand = ?, model = ?, serial_number = ?,
                quantity = ?, status = ?, details = ?, notes = ?, custom_fields = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (name, category, location, brand, model, serial_number, quantity, status, details, notes, json.dumps(custom_fields or {}), item_id))
        conn.commit()
    conn.close()

    updated_doc = {
        'id': item_id,
        'code': data.get('code', item_id),
        'name': name,
        'category': category,
        'location': location,
        'brand': brand,
        'model': model,
        'serialNumber': serial_number,
        'quantity': quantity,
        'status': status,
        'details': details,
        'notes': notes,
        'customFields': custom_fields or {}
    }

    # 2. Guardar en MongoDB
    if is_mongo_connected and mongo_collection is not None:
        try:
            mongo_collection.update_one({'id': item_id}, {'$set': updated_doc}, upsert=True)
        except Exception as err_m:
            print(f"[!] Error actualizando en MongoDB: {err_m}")

    return jsonify({'success': True, 'message': f'Actualizado en {mongo_source_name}', 'data': updated_doc})

@app.route('/api/inventory/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM inventario WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()

    if is_mongo_connected and mongo_collection is not None:
        try:
            mongo_collection.delete_one({'id': item_id})
        except Exception:
            pass

    return jsonify({'success': True, 'message': f'Ítem {item_id} eliminado'})

@app.route('/api/categories/questionnaires', methods=['GET'])
def get_questionnaires():
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM cuestionarios_categoria').fetchall()
    conn.close()
    res = {}
    for r in rows:
        try:
            fields = json.loads(r['fields'])
        except Exception:
            fields = []
        res[r['category']] = {
            'title': r['title'],
            'icon': r['icon'],
            'fields': fields
        }
    return jsonify({'success': True, 'data': res})

@app.route('/api/locations', methods=['GET'])
def get_locations():
    if is_mongo_connected and mongo_db is not None:
        try:
            locs = list(mongo_db['ubicaciones'].find({}, {'_id': 0}))
            if locs:
                names = [l['name'] for l in locs if 'name' in l]
                return jsonify({'success': True, 'data': names})
        except Exception as e:
            print(f"[!] Error leyendo ubicaciones de Mongo: {e}")

    conn = get_db_connection()
    rows = conn.execute('SELECT name FROM ubicaciones ORDER BY name ASC').fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [r['name'] for r in rows]})

@app.route('/api/locations', methods=['POST'])
def add_location():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'success': False, 'error': 'Nombre de ubicación requerido'}), 400

    conn = get_db_connection()
    conn.execute('INSERT OR IGNORE INTO ubicaciones (name) VALUES (?)', (name,))
    conn.commit()
    conn.close()

    if is_mongo_connected and mongo_db is not None:
        try:
            mongo_db['ubicaciones'].update_one({'name': name}, {'$set': {'name': name}}, upsert=True)
        except Exception as e:
            print(f"[!] Error guardando ubicación en Mongo: {e}")

    return jsonify({'success': True, 'message': f'Ubicación {name} agregada con éxito', 'name': name})

@app.route('/api/locations/<path:location_name>', methods=['DELETE'])
def delete_location(location_name):
    conn = get_db_connection()
    conn.execute('DELETE FROM ubicaciones WHERE name = ?', (location_name,))
    conn.commit()
    conn.close()

    if is_mongo_connected and mongo_db is not None:
        try:
            mongo_db['ubicaciones'].delete_one({'name': location_name})
        except Exception as e:
            print(f"[!] Error eliminando ubicación en Mongo: {e}")

    return jsonify({'success': True, 'message': f'Ubicación {location_name} eliminada'})

@app.route('/api/db/status', methods=['GET'])
def db_status():
    return jsonify({
        'success': True,
        'isMongoConnected': is_mongo_connected,
        'source': mongo_source_name,
        'mongoConfigPath': MONGO_CONFIG_PATH,
        'sqlitePath': DB_PATH
    })

if __name__ == '__main__':
    init_sqlite_db()
    init_mongo()
    print(f"[+] Servidor Backend en ejecución con base de datos: {mongo_source_name}")
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
