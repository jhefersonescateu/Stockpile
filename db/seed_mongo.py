import pymongo
import json
import os

MONGO_URI = "mongodb+srv://jhefersonescateu_db_user:990246774@cluster0.gfvpqxm.mongodb.net/?appName=Cluster0"
DB_NAME = "inventario"

print(f"[*] Conectando a MongoDB Atlas en {DB_NAME}...")
client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]

# 1. Colección de Inventario
inventario_col = db["inventario"]
inventario_col.create_index("id", unique=True)
inventario_col.create_index("code", unique=True)
inventario_col.create_index("category")

initial_items = [
    {
        "id": "QUI-MOB-001",
        "code": "QUI-MOB-001",
        "name": "Mesa Bipersonal Escolar",
        "category": "Mobiliario Escolar",
        "location": "Aula-05",
        "brand": "MINEDU Standard",
        "model": "Estándar Secundario",
        "serialNumber": "N/A",
        "quantity": 18,
        "status": "Bueno",
        "details": "Color Marrón Claro, madera prensada y estructura metálica (120x50cm)",
        "notes": "Lote 2024 asignado para estudiantes de 5to año",
        "customFields": {
            "material": "Madera Prensada y Metal",
            "capacity": "Bipersonal (2 estudiantes)",
            "color": "Marrón Claro",
            "dimensions": "120cm x 50cm x 75cm",
            "structureState": "Óptimo sin detalles"
        }
    },
    {
        "id": "QUI-MOB-002",
        "code": "QUI-MOB-002",
        "name": "Silla Pedagógica Estudiantil",
        "category": "Mobiliario Escolar",
        "location": "Aula-05",
        "brand": "MINEDU",
        "model": "Reforzada 2024",
        "serialNumber": "N/A",
        "quantity": 35,
        "status": "Bueno",
        "details": "Color Azul institucional, estructura tubular en fierro gris",
        "notes": "En óptimo estado de conservación",
        "customFields": {
            "material": "Plástico Inyectado Reforzado",
            "capacity": "Unipersonal (1 estudiante)",
            "color": "Azul Institucional",
            "dimensions": "45cm x 40cm x 80cm",
            "structureState": "Óptimo sin detalles"
        }
    },
    {
        "id": "QUI-TEC-001",
        "code": "QUI-TEC-001",
        "name": "Proyector Multimedia HD",
        "category": "Equipos Tecnológicos",
        "location": "Aula-05",
        "brand": "Epson",
        "model": "PowerLite 118",
        "serialNumber": "EP-981024-X",
        "quantity": 1,
        "status": "Bueno",
        "details": "3800 Lumens, HDMI/VGA, Altavoz integrado 16W, Control remoto",
        "notes": "Soporte fijado al techo. Incluye cable HDMI de 10 metros",
        "customFields": {
            "voltage": "220V AC",
            "ports": "HDMI, VGA, Wi-Fi, Ethernet RJ45, USB",
            "macAddress": "00:1A:2B:3C:4D:5E",
            "warrantyExpiry": "2026-12-31",
            "maintenanceStatus": "Al día / Operativo",
            "accessories": "Control remoto, cable HDMI 10m, soporte de techo"
        }
    },
    {
        "id": "QUI-CLI-001",
        "code": "QUI-CLI-001",
        "name": "Ventilador de Techo Industrial",
        "category": "Climatización y Audio",
        "location": "Aula-05",
        "brand": "National",
        "model": "HeavyDuty 56\"",
        "serialNumber": "N/A",
        "quantity": 2,
        "status": "Bueno",
        "details": "Color Blanco, 3 aspas de aluminio, selector de 5 velocidades",
        "notes": "Operativos con control de pared",
        "customFields": {
            "powerRating": "75W per unit",
            "installationType": "Fijado en Techo",
            "hasRemote": "Selector de Pared Fijo",
            "lastServiceDate": "2026-02-15"
        }
    },
    {
        "id": "QUI-DEP-001",
        "code": "QUI-DEP-001",
        "name": "Kit de Balones Oficiales de Fútbol y Básquet",
        "category": "Artículos Deportivos y Educación Física",
        "location": "Almacén Deportivo",
        "brand": "Molten / Walon",
        "model": "Edición Escolar 2024",
        "serialNumber": "N/A",
        "quantity": 22,
        "status": "Bueno",
        "details": "10 Balones Molten Básquet N°7, 12 Balones Walon Fútbol N°5",
        "notes": "Guardados en redes de nylon reforzadas",
        "customFields": {
            "sportType": "Fútbol / Balompié",
            "equipmentCondition": "Óptimo (Inflado / Presión ok)",
            "storageBag": "Guardado en Red de Nylon"
        }
    },
    {
        "id": "QUI-COC-001",
        "code": "QUI-COC-001",
        "name": "Olla Industrial de Acero Inoxidable 50L",
        "category": "Utensilios de Cocina y Comedor (Qali Warma)",
        "location": "Cocina / Comedor",
        "brand": "Record",
        "model": "Profesional 50L",
        "serialNumber": "REC-50L-2024",
        "quantity": 2,
        "status": "Bueno",
        "details": "Acero inoxidable de triple fondo térmico con asas reforzadas",
        "notes": "Asignada para la preparación del programa Qali Warma",
        "customFields": {
            "utensilMaterial": "Acero Inoxidable Quirúrgico",
            "sanitaryStatus": "Apto y certificado para consumo",
            "capacityRations": "50 Litros / 150 raciones",
            "energySupply": "Gas GLP Industrial"
        }
    }
]

for item in initial_items:
    inventario_col.update_one({"id": item["id"]}, {"$set": item}, upsert=True)

print(f"[+] {len(initial_items)} objetos patrimoniales registrados en la coleccion 'inventario' de MongoDB Atlas.")

# 2. Coleccion de Cuestionarios por Categoria
cuestionarios_col = db["cuestionarios_categoria"]
cuestionarios_col.create_index("category", unique=True)

default_questionnaires = [
    {
        "category": "Equipos Tecnológicos",
        "title": "Especificaciones Técnicas y Conectividad",
        "icon": "💻",
        "fields": [
            {"key": "voltage", "label": "Voltaje / Alimentación", "type": "select", "options": ["220V AC", "110V AC", "Batería Recargable", "USB 5V / Type-C", "PoE"]},
            {"key": "ports", "label": "Puertos / Conectividad", "type": "text", "placeholder": "Ej. HDMI, VGA, Wi-Fi 6, Ethernet"},
            {"key": "macAddress", "label": "Dirección MAC / IP", "type": "text", "placeholder": "Ej. AA:BB:CC:DD:EE:FF"},
            {"key": "warrantyExpiry", "label": "Vencimiento de Garantía", "type": "date"},
            {"key": "maintenanceStatus", "label": "Estado de Mantenimiento", "type": "select", "options": ["Al día / Operativo", "Mantenimiento Preventivo Pendiente", "En Diagnóstico / Reparación", "Garantía Vigente"]},
            {"key": "accessories", "label": "Accesorios Incluidos", "type": "text", "placeholder": "Ej. Cable de poder, Control remoto"}
        ]
    },
    {
        "category": "Mobiliario Escolar",
        "title": "Materiales y Estado Estructural",
        "icon": "🪑",
        "fields": [
            {"key": "material", "label": "Material de Fabricación", "type": "select", "options": ["Madera Prensada y Metal", "Melamina con Marco de Fierro", "Plástico Inyectado Reforzado", "Madera Maciza", "Aluminio y Vidrio"]},
            {"key": "dimensions", "label": "Dimensiones (Alto x Ancho x Prof.)", "type": "text", "placeholder": "Ej. 120cm x 50cm x 75cm"},
            {"key": "capacity", "label": "Capacidad de Personas", "type": "select", "options": ["Unipersonal (1 estudiante)", "Bipersonal (2 estudiantes)", "Mesa Grupal (4-6 estudiantes)", "Uso Docente"]},
            {"key": "color", "label": "Color Predominante", "type": "text", "placeholder": "Ej. Marrón Claro, Azul Institucional"},
            {"key": "structureState", "label": "Estado de la Estructura", "type": "select", "options": ["Óptimo sin detalles", "Requiere ajuste de pernos", "Superficie desgastada", "Inestable"]}
        ]
    },
    {
        "category": "Material Didáctico y Libros",
        "title": "Ficha Pedagógica y Editorial",
        "icon": "📚",
        "fields": [
            {"key": "publisherOrAuthor", "label": "Editorial / Autor", "type": "text", "placeholder": "Ej. Santillana, MINEDU"},
            {"key": "isbnCode", "label": "Código ISBN / Depósito Legal", "type": "text", "placeholder": "Ej. 978-612-345-678-9"},
            {"key": "educationalLevel", "label": "Nivel Educativo Target", "type": "select", "options": ["Educación Inicial", "Educación Primaria", "Educación Secundaria", "Docentes"]},
            {"key": "subject", "label": "Área Curricular / Asignatura", "type": "select", "options": ["Matemática", "Comunicación", "Ciencia y Tecnología", "Ciencias Sociales", "Inglés", "Robótica"]},
            {"key": "editionYear", "label": "Año de Edición", "type": "number", "placeholder": "Ej. 2024"}
        ]
    },
    {
        "category": "Artículos Deportivos y Educación Física",
        "title": "Ficha Deportiva y Educación Física",
        "icon": "⚽",
        "fields": [
            {"key": "sportType", "label": "Disciplina / Deporte", "type": "select", "options": ["Fútbol / Balompié", "Básquet / Baloncesto", "Vóley / Voleibol", "Atletismo y Gimnasia", "Ajedrez y Juegos de Mesa"]},
            {"key": "equipmentCondition", "label": "Estado y Presión", "type": "select", "options": ["Óptimo (Inflado / Presión ok)", "Requiere aire / inflador", "Desgastado", "Inoperativo"]},
            {"key": "safetyGear", "label": "Accesorios / Protecciones", "type": "text", "placeholder": "Ej. Incluye 10 conos, 12 chalecos"},
            {"key": "storageBag", "label": "Almacenamiento", "type": "select", "options": ["Guardado en Red de Nylon", "Estante Deportivo", "Caja Plástica"]}
        ]
    },
    {
        "category": "Utensilios de Cocina y Comedor (Qali Warma)",
        "title": "Ficha Técnica de Cocina Escolar y Qali Warma",
        "icon": "🍳",
        "fields": [
            {"key": "utensilMaterial", "label": "Material Grado Alimenticio", "type": "select", "options": ["Acero Inoxidable Quirúrgico", "Aluminio Reforzado", "Plástico Térmico Alimenticio", "Porcelana / Vidrio"]},
            {"key": "sanitaryStatus", "label": "Higiene / Registro Sanitario", "type": "select", "options": ["Apto y certificado para consumo", "Desinfección profunda requerida", "Para reemplazo"]},
            {"key": "capacityRations", "label": "Capacidad / Raciones", "type": "text", "placeholder": "Ej. 50 Litros / 120 raciones diarias"},
            {"key": "energySupply", "label": "Fuente de Energía / Gas", "type": "select", "options": ["Gas GLP Industrial", "Eléctrico 220V", "Manual / Sin energía"]}
        ]
    },
    {
        "category": "Arte, Música y Banda Escolar",
        "title": "Ficha de Instrumentos y Artes Plásticas",
        "icon": "🎷",
        "fields": [
            {"key": "instrumentCategory", "label": "Familia del Instrumento", "type": "select", "options": ["Viento Metal", "Viento Madera", "Percusión / Tambor", "Cuerdas", "Artes Plásticas / Caballetes"]},
            {"key": "tuningStatus", "label": "Estado de Afinación", "type": "select", "options": ["Afinado y operativo", "Requiere afinación / ajuste", "En reparación"]},
            {"key": "includesCase", "label": "Estuche / Funda", "type": "select", "options": ["Sí, estuche rígido", "Funda acolchada", "Sin estuche"]}
        ]
    },
    {
        "category": "Enfermería y Botiquín de Auxilios",
        "title": "Ficha de Emergencia Médica Escolar",
        "icon": "🩺",
        "fields": [
            {"key": "medicalCategory", "label": "Tipo de Equipo / Insumo", "type": "select", "options": ["Botiquín Completo", "Camilla de Evacuación", "Tensiómetro / Termómetro", "Antisépticos y Gasas"]},
            {"key": "expiryDate", "label": "Fecha Vencimiento", "type": "date"},
            {"key": "sanitarySeal", "label": "Estado de Esterilización", "type": "select", "options": ["Empaque estéril sellado", "Reutilizable desinfectado", "Para descarte"]}
        ]
    }
]

for q in default_questionnaires:
    cuestionarios_col.update_one({"category": q["category"]}, {"$set": q}, upsert=True)

print(f"[+] {len(default_questionnaires)} plantillas de cuestionarios dinámicos registradas en la coleccion 'cuestionarios_categoria' de MongoDB Atlas.")
print("[+] MongoDB Atlas inicializado y estructurado con éxito para el sistema web y escritorio.")
