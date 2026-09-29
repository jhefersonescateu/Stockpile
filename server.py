import json
import os
from urllib.parse import unquote

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from libsql_client import create_client_sync

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.getenv("PORT", "5001"))
TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL") or os.getenv("TURSO_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN") or os.getenv("TURSO_TOKEN")
DEFAULT_ACCESS_CODE = (
    os.getenv("APP_ACCESS_CODE") or os.getenv("ACCESS_CODE") or "STOCKPILE2026"
).strip().upper()

db = None
SOURCE_NAME = "Turso DB"
DB_CONNECTION_ERROR = None


def normalize_turso_rows(result):
    if not result or not hasattr(result, "rows") or not hasattr(result, "columns"):
        return []

    columns = list(result.columns or [])
    normalized = []
    for row in result.rows or []:
        item = {}
        for index, column in enumerate(columns):
            item[column] = row[index] if index < len(row) else None
        normalized.append(item)
    return normalized


def ensure_db_connection():
    global db
    global DB_CONNECTION_ERROR

    if db is not None:
        return db

    if not TURSO_DATABASE_URL or not TURSO_AUTH_TOKEN:
        DB_CONNECTION_ERROR = "Faltan TURSO_DATABASE_URL o TURSO_AUTH_TOKEN para conectar con Turso."
        raise RuntimeError(DB_CONNECTION_ERROR)

    client = None
    try:
        client = create_client_sync(TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
        client.execute("SELECT 1 AS ok")
        db = client
        DB_CONNECTION_ERROR = None
    except Exception as exc:
        DB_CONNECTION_ERROR = str(exc)
        if client is not None:
            client.close()
        raise
    return db


def format_item_row(row):
    if row is None:
        return None

    custom_fields = {}
    value = row.get("custom_fields")
    if value:
        try:
            custom_fields = json.loads(value) if isinstance(value, str) else value
        except (TypeError, ValueError):
            custom_fields = {}

    return {
        "id": row.get("id"),
        "code": row.get("code") or row.get("id"),
        "name": row.get("name") or "",
        "category": row.get("category") or "",
        "location": row.get("location") or "",
        "brand": row.get("brand") or "",
        "model": row.get("model") or "",
        "serialNumber": row.get("serial_number") or "",
        "quantity": int(row.get("quantity") or 1),
        "status": row.get("status") or "Bueno",
        "details": row.get("details") or "",
        "notes": row.get("notes") or "",
        "alto": row.get("alto") or "",
        "ancho": row.get("ancho") or "",
        "largo": row.get("largo") or "",
        "tipoMaterial": row.get("tipo_material") or "",
        "color": row.get("color") or "",
        "situacion": row.get("situacion") or "",
        "customFields": custom_fields,
        "createdAt": row.get("created_at"),
        "updatedAt": row.get("updated_at"),
    }


def ensure_schema():
    connection = ensure_db_connection()

    connection.execute(
        """
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
            alto TEXT,
            ancho TEXT,
            largo TEXT,
            tipo_material TEXT,
            color TEXT,
            situacion TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS cuestionarios_categoria (
            category TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            icon TEXT,
            fields TEXT NOT NULL
        )
        """
    )

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS ubicaciones (
            name TEXT PRIMARY KEY
        )
        """
    )

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS access_codes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    existing_access = normalize_turso_rows(
        connection.execute(
            "SELECT COUNT(*) AS cnt FROM access_codes WHERE code = ?",
            [DEFAULT_ACCESS_CODE],
        )
    )
    if not existing_access or int(existing_access[0].get("cnt") or 0) == 0:
        connection.execute(
            "INSERT INTO access_codes (code, is_active) VALUES (?, 1)",
            [DEFAULT_ACCESS_CODE],
        )

    default_questionnaires = [
        (
            "Equipos Tecnológicos",
            "Especificaciones Técnicas y Conectividad",
            "💻",
            json.dumps([
                {"key": "voltage", "label": "Voltaje / Alimentación", "type": "select", "options": ["220V AC", "110V AC", "Batería Recargable", "USB 5V / Type-C", "PoE"]},
                {"key": "ports", "label": "Puertos / Conectividad", "type": "text", "placeholder": "Ej. HDMI, VGA, Wi-Fi 6, Ethernet"},
                {"key": "macAddress", "label": "Dirección MAC / IP", "type": "text", "placeholder": "Ej. AA:BB:CC:DD:EE:FF"},
                {"key": "warrantyExpiry", "label": "Vencimiento de Garantía", "type": "date"},
                {"key": "maintenanceStatus", "label": "Estado de Mantenimiento", "type": "select", "options": ["Al día / Operativo", "Mantenimiento Preventivo Pendiente", "En Diagnóstico / Reparación", "Garantía Vigente"]},
                {"key": "accessories", "label": "Accesorios Incluidos", "type": "text", "placeholder": "Ej. Cable de poder, Control remoto"},
            ]),
        ),
        (
            "Mobiliario Escolar",
            "Materiales y Estado Estructural",
            "🪑",
            json.dumps([
                {"key": "material", "label": "Material de Fabricación", "type": "select", "options": ["Madera Prensada y Metal", "Melamina con Marco de Fierro", "Plástico Inyectado Reforzado", "Madera Maciza", "Aluminio y Vidrio"]},
                {"key": "dimensions", "label": "Dimensiones (Alto x Ancho x Prof.)", "type": "text", "placeholder": "Ej. 120cm x 50cm x 75cm"},
                {"key": "capacity", "label": "Capacidad de Personas", "type": "select", "options": ["Unipersonal (1 estudiante)", "Bipersonal (2 estudiantes)", "Mesa Grupal (4-6 estudiantes)", "Uso Docente"]},
                {"key": "color", "label": "Color Predominante", "type": "text", "placeholder": "Ej. Marrón Claro, Azul Institucional"},
                {"key": "structureState", "label": "Estado de la Estructura", "type": "select", "options": ["Óptimo sin detalles", "Requiere ajuste de pernos", "Superficie desgastada", "Inestable"]},
            ]),
        ),
        (
            "Material Didáctico y Libros",
            "Ficha Pedagógica y Editorial",
            "📚",
            json.dumps([
                {"key": "publisherOrAuthor", "label": "Editorial / Autor", "type": "text", "placeholder": "Ej. Santillana, MINEDU"},
                {"key": "isbnCode", "label": "Código ISBN / Depósito Legal", "type": "text", "placeholder": "Ej. 978-612-345-678-9"},
                {"key": "educationalLevel", "label": "Nivel Educativo Target", "type": "select", "options": ["Educación Inicial", "Educación Primaria", "Educación Secundaria", "Docentes"]},
                {"key": "subject", "label": "Área Curricular / Asignatura", "type": "select", "options": ["Matemática", "Comunicación", "Ciencia y Tecnología", "Ciencias Sociales", "Inglés", "Robótica"]},
                {"key": "editionYear", "label": "Año de Edición", "type": "number", "placeholder": "Ej. 2024"},
            ]),
        ),
        (
            "Artículos Deportivos y Educación Física",
            "Ficha Deportiva y Educación Física",
            "⚽",
            json.dumps([
                {"key": "sportType", "label": "Disciplina / Deporte", "type": "select", "options": ["Fútbol / Balompié", "Básquet / Baloncesto", "Vóley / Voleibol", "Atletismo y Gimnasia", "Ajedrez y Juegos de Mesa"]},
                {"key": "equipmentCondition", "label": "Estado y Presión", "type": "select", "options": ["Óptimo (Inflado / Presión ok)", "Requiere aire / inflador", "Desgastado", "Inoperativo"]},
                {"key": "safetyGear", "label": "Accesorios / Protecciones", "type": "text", "placeholder": "Ej. Incluye 10 conos, 12 chalecos"},
                {"key": "storageBag", "label": "Almacenamiento", "type": "select", "options": ["Guardado en Red de Nylon", "Estante Deportivo", "Caja Plástica"]},
            ]),
        ),
        (
            "Utensilios de Cocina y Comedor (Qali Warma)",
            "Ficha Técnica de Cocina Escolar y Qali Warma",
            "🍳",
            json.dumps([
                {"key": "utensilMaterial", "label": "Material Grado Alimenticio", "type": "select", "options": ["Acero Inoxidable Quirúrgico", "Aluminio Reforzado", "Plástico Térmico Alimenticio", "Porcelana / Vidrio"]},
                {"key": "sanitaryStatus", "label": "Higiene / Registro Sanitario", "type": "select", "options": ["Apto y certificado para consumo", "Desinfección profunda requerida", "Para reemplazo"]},
                {"key": "capacityRations", "label": "Capacidad / Raciones", "type": "text", "placeholder": "Ej. 50 Litros / 120 raciones diarias"},
                {"key": "energySupply", "label": "Fuente de Energía / Gas", "type": "select", "options": ["Gas GLP Industrial", "Eléctrico 220V", "Manual / Sin energía"]},
            ]),
        ),
        (
            "Arte, Música y Banda Escolar",
            "Ficha de Instrumentos y Artes Plásticas",
            "🎷",
            json.dumps([
                {"key": "instrumentCategory", "label": "Familia del Instrumento", "type": "select", "options": ["Viento Metal", "Viento Madera", "Percusión / Tambor", "Cuerdas", "Artes Plásticas / Caballetes"]},
                {"key": "tuningStatus", "label": "Estado de Afinación", "type": "select", "options": ["Afinado y operativo", "Requiere afinación / ajuste", "En reparación"]},
                {"key": "includesCase", "label": "Estuche / Funda", "type": "select", "options": ["Sí, estuche rígido", "Funda acolchada", "Sin estuche"]},
            ]),
        ),
        (
            "Enfermería y Botiquín de Auxilios",
            "Ficha de Emergencia Médica Escolar",
            "🩺",
            json.dumps([
                {"key": "medicalCategory", "label": "Tipo de Equipo / Insumo", "type": "select", "options": ["Botiquín Completo", "Camilla de Evacuación", "Tensiómetro / Termómetro", "Antisépticos y Gasas"]},
                {"key": "expiryDate", "label": "Fecha Vencimiento", "type": "date"},
                {"key": "sanitarySeal", "label": "Estado de Esterilización", "type": "select", "options": ["Empaque estéril sellado", "Reutilizable desinfectado", "Para descarte"]},
            ]),
        ),
        (
            "Climatización y Audio",
            "Ficha Técnica de Clima y Sonido",
            "❄️",
            json.dumps([
                {"key": "powerRating", "label": "Potencia (Watts / BTU)", "type": "text", "placeholder": "Ej. 150W, 12000 BTU"},
                {"key": "installationType", "label": "Tipo de Instalación", "type": "select", "options": ["Fijado en Techo", "Mural en Pared", "Portátil", "Sobremesa"]},
                {"key": "hasRemote", "label": "Control Remoto / Switch", "type": "select", "options": ["Control Remoto Inalámbrico", "Selector de Pared", "Sin control"]},
                {"key": "lastServiceDate", "label": "Fecha de Mantenimiento", "type": "date"},
            ]),
        ),
        (
            "Herramientas y Mantenimiento",
            "Ficha de Herramientas",
            "🛠️",
            json.dumps([
                {"key": "toolCategory", "label": "Tipo de Herramienta", "type": "select", "options": ["Manual", "Eléctrica 220V", "Inalámbrica a Batería", "Medición", "Jardinería"]},
                {"key": "voltagePower", "label": "Potencia / Especificación", "type": "text", "placeholder": "Ej. 750W / 18V Litio"},
                {"key": "includesCase", "label": "Maletín Incluido", "type": "select", "options": ["Sí, maletín original", "No, guardado en estante"]},
                {"key": "riskLevel", "label": "Nivel de Riesgo", "type": "select", "options": ["Bajo", "Moderado", "Alto (Personal capacitado)"]},
            ]),
        ),
        (
            "Suministros y Consumibles",
            "Control de Stock y Caducidad",
            "📦",
            json.dumps([
                {"key": "expirationDate", "label": "Fecha de Vencimiento", "type": "date"},
                {"key": "lotNumber", "label": "Número de Lote", "type": "text", "placeholder": "Ej. LOT-202408-B"},
                {"key": "minStock", "label": "Stock Mínimo (Alerta)", "type": "number", "placeholder": "Ej. 5"},
                {"key": "unitMeasure", "label": "Unidad de Medida", "type": "select", "options": ["Unidades", "Cajas", "Paquetes", "Litros", "Rollos"]},
            ]),
        ),
        (
            "Otros / Varios",
            "Ficha General para Bienes Varios",
            "📑",
            json.dumps([
                {"key": "itemType", "label": "Tipo / Clasificación del Bien", "type": "text", "placeholder": "Ej. Adorno, Cortina, Escudo, Trofeo"},
                {"key": "specification", "label": "Especificación Técnica / Descripción", "type": "text", "placeholder": "Ej. Dimensiones, peso o detalles especiales"},
                {"key": "additionalNotes", "label": "Observaciones / Notas de Conservación", "type": "text", "placeholder": "Ej. Ubicación exacta, donante o estado de conservación"},
            ]),
        ),
    ]

    for category, title, icon, fields in default_questionnaires:
        connection.execute(
            "INSERT OR REPLACE INTO cuestionarios_categoria (category, title, icon, fields) VALUES (?, ?, ?, ?)",
            [category, title, icon, fields],
        )

    default_locations = [
        "Aula-05",
        "Aula-01",
        "Aula-02",
        "Lab. de Cómputo",
        "Biblioteca",
        "Lab. de Ciencias",
        "Dirección",
        "Sala de Profesores",
        "Patio Principal",
        "Almacén Deportivo",
        "Cocina / Comedor",
    ]
    for location_name in default_locations:
        connection.execute(
            "INSERT OR IGNORE INTO ubicaciones (name) VALUES (?)",
            [location_name],
        )


def get_inventory_rows():
    connection = ensure_db_connection()
    result = connection.execute("SELECT * FROM inventario ORDER BY rowid DESC")
    rows = normalize_turso_rows(result)
    return [format_item_row(row) for row in rows]


def get_inventory_by_id(item_id):
    connection = ensure_db_connection()
    result = connection.execute("SELECT * FROM inventario WHERE id = ? LIMIT 1", [item_id])
    rows = normalize_turso_rows(result)
    if not rows:
        return None
    return format_item_row(rows[0])


@app.route("/api/access/verify", methods=["POST"])
def verify_access_code():
    data = request.get_json(silent=True) or {}
    raw_code = str(data.get("code") or "").strip()
    normalized_code = raw_code.upper()

    if not normalized_code:
        return jsonify({"success": False, "message": "Ingresa el código de acceso."}), 400

    try:
        connection = ensure_db_connection()
        result = connection.execute(
            "SELECT 1 FROM access_codes WHERE code = ? AND is_active = 1 LIMIT 1",
            [normalized_code],
        )
        if not normalize_turso_rows(result):
            return jsonify({"success": False, "message": "Código incorrecto o no autorizado."}), 401
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo conectar a Turso. Verifica la URL y el token de la base de datos.", "error": str(exc)}), 503

    return jsonify({"success": True, "message": "Acceso autorizado.", "code": normalized_code})


@app.route("/api/inventory", methods=["GET"])
def get_inventory():
    try:
        items = get_inventory_rows()
        return jsonify({"success": True, "count": len(items), "source": SOURCE_NAME, "data": items})
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo consultar la base de datos de Turso.", "error": str(exc)}), 503


@app.route("/api/inventory/<item_id>", methods=["GET"])
def get_item(item_id):
    try:
        item = get_inventory_by_id(item_id)
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo consultar el ítem en Turso.", "error": str(exc)}), 503
    if item is None:
        return jsonify({"success": False, "error": "Ítem no encontrado"}), 404
    return jsonify({"success": True, "source": SOURCE_NAME, "data": item})


@app.route("/api/inventory", methods=["POST"])
def create_item():
    data = request.get_json(force=True, silent=True) or {}
    name = (data.get("name") or "").strip()
    category = (data.get("category") or "").strip()
    location = (data.get("location") or "").strip()

    if not name or not category or not location:
        return jsonify({"success": False, "error": "Nombre, categoría y ubicación son requeridos"}), 400

    try:
        connection = ensure_db_connection()
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo guardar en Turso. Verifica la conexión a la base de datos.", "error": str(exc)}), 503
    code = (data.get("code") or "").strip()
    if not code:
        cat_prefix = "".join(ch for ch in category[:3].upper() if ch.isalnum()) or "CAT"
        count_result = normalize_turso_rows(connection.execute("SELECT COUNT(*) AS cnt FROM inventario"))
        count = int((count_result[0].get("cnt") if count_result else 0) or 0)
        code = f"QUI-{cat_prefix}-{(count + 1):03d}"

    item_id = data.get("id") or code
    custom_fields = data.get("customFields") or {}

    connection.execute(
        """
        INSERT INTO inventario (
            id, code, name, category, location, brand, model, serial_number, quantity,
            status, details, notes, custom_fields, alto, ancho, largo,
            tipo_material, color, situacion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        [
            item_id,
            code,
            name,
            category,
            location,
            data.get("brand") or "",
            data.get("model") or "",
            data.get("serialNumber") or "",
            int(data.get("quantity") or 1),
            data.get("status") or "Bueno",
            data.get("details") or "",
            data.get("notes") or "",
            json.dumps(custom_fields),
            data.get("alto") or "",
            data.get("ancho") or "",
            data.get("largo") or "",
            data.get("tipoMaterial") or "",
            data.get("color") or "",
            data.get("situacion") or "",
        ],
    )

    created_item = get_inventory_by_id(item_id)
    return jsonify({"success": True, "message": "Registrado exitosamente en Turso", "source": SOURCE_NAME, "data": created_item}), 201


@app.route("/api/inventory/<item_id>", methods=["PUT"])
def update_item(item_id):
    try:
        connection = ensure_db_connection()
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo actualizar en Turso. Verifica la conexión a la base de datos.", "error": str(exc)}), 503
    existing = get_inventory_by_id(item_id)
    if existing is None:
        return jsonify({"success": False, "error": "Ítem no encontrado en base de datos"}), 404

    data = request.get_json(force=True, silent=True) or {}
    code = data.get("code") or existing["code"]
    name = data.get("name") or existing["name"]
    category = data.get("category") or existing["category"]
    location = data.get("location") or existing["location"]
    brand = data.get("brand") if data.get("brand") is not None else existing["brand"]
    model = data.get("model") if data.get("model") is not None else existing["model"]
    serial_number = data.get("serialNumber") if data.get("serialNumber") is not None else existing["serialNumber"]
    quantity = int(data.get("quantity") if data.get("quantity") is not None else existing["quantity"])
    status = data.get("status") or existing["status"]
    details = data.get("details") if data.get("details") is not None else existing["details"]
    notes = data.get("notes") if data.get("notes") is not None else existing["notes"]
    alto = data.get("alto") if data.get("alto") is not None else existing["alto"]
    ancho = data.get("ancho") if data.get("ancho") is not None else existing["ancho"]
    largo = data.get("largo") if data.get("largo") is not None else existing["largo"]
    tipo_material = data.get("tipoMaterial") if data.get("tipoMaterial") is not None else existing["tipoMaterial"]
    color = data.get("color") if data.get("color") is not None else existing["color"]
    situacion = data.get("situacion") if data.get("situacion") is not None else existing["situacion"]

    custom_fields = data.get("customFields")
    if custom_fields is None:
        custom_fields = existing.get("customFields") or {}

    connection.execute(
        """
        UPDATE inventario
        SET code = ?, name = ?, category = ?, location = ?, brand = ?, model = ?, serial_number = ?,
            quantity = ?, status = ?, details = ?, notes = ?, custom_fields = ?,
            alto = ?, ancho = ?, largo = ?, tipo_material = ?, color = ?, situacion = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        [
            code,
            name,
            category,
            location,
            brand,
            model,
            serial_number,
            quantity,
            status,
            details,
            notes,
            json.dumps(custom_fields),
            alto,
            ancho,
            largo,
            tipo_material,
            color,
            situacion,
            item_id,
        ],
    )

    updated_item = get_inventory_by_id(item_id)
    return jsonify({"success": True, "message": "Actualizado en Turso", "source": SOURCE_NAME, "data": updated_item})


@app.route("/api/inventory/<item_id>", methods=["DELETE"])
def delete_item(item_id):
    try:
        connection = ensure_db_connection()
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo eliminar en Turso. Verifica la conexión a la base de datos.", "error": str(exc)}), 503
    existing = get_inventory_by_id(item_id)
    if existing is None:
        return jsonify({"success": False, "error": "Ítem no encontrado"}), 404

    connection.execute("DELETE FROM inventario WHERE id = ?", [item_id])
    return jsonify({"success": True, "message": f"Ítem {item_id} eliminado"})


@app.route("/api/categories/questionnaires", methods=["GET"])
def get_questionnaires():
    try:
        connection = ensure_db_connection()
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo cargar los cuestionarios de Turso.", "error": str(exc)}), 503
    rows = normalize_turso_rows(connection.execute("SELECT * FROM cuestionarios_categoria"))
    questionnaires_map = {}
    for row in rows:
        fields = row.get("fields") or "[]"
        try:
            parsed_fields = json.loads(fields)
        except (TypeError, ValueError):
            parsed_fields = []
        questionnaires_map[row["category"]] = {
            "title": row.get("title") or "",
            "icon": row.get("icon") or "📑",
            "fields": parsed_fields,
        }
    return jsonify({"success": True, "source": SOURCE_NAME, "data": questionnaires_map})


@app.route("/api/locations", methods=["GET"])
def get_locations():
    try:
        connection = ensure_db_connection()
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo cargar las ubicaciones de Turso.", "error": str(exc)}), 503
    rows = normalize_turso_rows(connection.execute("SELECT name FROM ubicaciones ORDER BY name ASC"))
    location_names = [row.get("name") for row in rows if row.get("name")]
    return jsonify({"success": True, "data": location_names})


@app.route("/api/locations", methods=["POST"])
def add_location():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"success": False, "error": "Nombre de ubicación requerido"}), 400

    try:
        connection = ensure_db_connection()
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo guardar la ubicación en Turso.", "error": str(exc)}), 503
    connection.execute("INSERT OR IGNORE INTO ubicaciones (name) VALUES (?)", [name])
    return jsonify({"success": True, "message": f"Ubicación {name} agregada con éxito", "name": name})


@app.route("/api/locations/<path:location_name>", methods=["DELETE"])
def delete_location(location_name):
    location_name = unquote(location_name)
    try:
        connection = ensure_db_connection()
    except Exception as exc:
        return jsonify({"success": False, "message": "No se pudo eliminar la ubicación en Turso.", "error": str(exc)}), 503
    connection.execute("DELETE FROM ubicaciones WHERE name = ?", [location_name])
    return jsonify({"success": True, "message": f"Ubicación {location_name} eliminada"})


@app.route("/api/db-status", methods=["GET"])
@app.route("/api/db/status", methods=["GET"])
def db_status():
    try:
        connection = ensure_db_connection()
        connection.execute("SELECT 1 AS ok")
        return jsonify({
            "success": True,
            "mode": "turso",
            "source": SOURCE_NAME,
            "dbUrl": TURSO_DATABASE_URL,
        })
    except Exception as exc:
        return jsonify({
            "success": False,
            "mode": "turso",
            "source": SOURCE_NAME,
            "dbUrl": TURSO_DATABASE_URL,
            "error": str(exc),
            "message": "La conexión con Turso falló. Verifica que la URL y el token sean válidos.",
        }), 503


def start_server():
    try:
        ensure_schema()
        print(f"[+] Servidor Python listo con Turso: {TURSO_DATABASE_URL}")
    except Exception as exc:
        print(f"[!] No se pudo establecer la conexión con Turso: {exc}")
        print("[!] El servidor seguirá arrancando, pero las rutas devolverán 503 hasta que la URL/token sean válidos.")


if __name__ == "__main__":
    start_server()
    app.run(host="0.0.0.0", port=PORT, debug=False, use_reloader=False)
