import pymongo
import sqlite3
import json
import os

MONGO_URI = "mongodb+srv://jhefersonescateu_db_user:990246774@cluster0.gfvpqxm.mongodb.net/?appName=Cluster0"
DB_NAME = "inventario"
DB_DIR = os.path.dirname(__file__)
SQLITE_PATH = os.path.join(DB_DIR, "inventario.db")

print(f"[*] Conectando a MongoDB Atlas ({DB_NAME}) y SQLite Local ({SQLITE_PATH})...")

# --- 1. MongoDB Setup ---
mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
db = mongo_client[DB_NAME]

inventario_col = db["inventario"]
inventario_col.create_index("id", unique=True)
inventario_col.create_index("code", unique=True)
inventario_col.create_index("category")

cuestionarios_col = db["cuestionarios_categoria"]
cuestionarios_col.create_index("category", unique=True)

ubicaciones_col = db["ubicaciones"]
ubicaciones_col.create_index("name", unique=True)

# --- 2. Complete School Inventory Data (All 11 Categories) ---
full_inventory = [
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
        "id": "QUI-TEC-002",
        "code": "QUI-TEC-002",
        "name": "Laptop Docente ProBook G8",
        "category": "Equipos Tecnológicos",
        "location": "Sala de Profesores",
        "brand": "HP",
        "model": "ProBook 445 G8",
        "serialNumber": "5CG12498XY",
        "quantity": 12,
        "status": "Bueno",
        "details": "AMD Ryzen 5, 16GB RAM, 512GB SSD, Windows 11 Pro",
        "notes": "Asignadas a coordinadores pedagógicos y docentes tutores",
        "customFields": {
            "voltage": "220V AC",
            "ports": "USB-C, HDMI, Wi-Fi 6, RJ45",
            "macAddress": "F4:B3:01:8A:2C:99",
            "warrantyExpiry": "2027-06-30",
            "maintenanceStatus": "Al día / Operativo",
            "accessories": "Cargador original, Maletín acolchado"
        }
    },
    {
        "id": "QUI-TEC-003",
        "code": "QUI-TEC-003",
        "name": "Computadora All-In-One Lab Cómputo",
        "category": "Equipos Tecnológicos",
        "location": "Lab. de Cómputo",
        "brand": "Lenovo",
        "model": "V50a 24IAP",
        "serialNumber": "LN-2024-88A",
        "quantity": 25,
        "status": "Bueno",
        "details": "Pantalla 23.8\" Full HD, Core i5 12th Gen, 16GB RAM, SSD 512GB",
        "notes": "Equipos del Laboratorio de Informática y Robótica",
        "customFields": {
            "voltage": "220V AC",
            "ports": "HDMI, DisplayPort, USB 3.2, Ethernet Gigabit",
            "macAddress": "00:50:56:C0:00:08",
            "warrantyExpiry": "2027-03-15",
            "maintenanceStatus": "Al día / Operativo",
            "accessories": "Teclado y Mouse Lenovo USB"
        }
    },
    {
        "id": "QUI-LIB-001",
        "code": "QUI-LIB-001",
        "name": "Texto Escolar Matemática 5° Secundaria",
        "category": "Material Didáctico y Libros",
        "location": "Biblioteca",
        "brand": "MINEDU / Santillana",
        "model": "Edición Especial 2024",
        "serialNumber": "ISBN 978-612-345-001",
        "quantity": 40,
        "status": "Bueno",
        "details": "Tapa blanda thermolaminada, 320 páginas a todo color",
        "notes": "Dotación oficial del Ministerio de Educación para biblioteca escolar",
        "customFields": {
            "publisherOrAuthor": "Santillana / MINEDU",
            "isbnCode": "978-612-345-001",
            "educationalLevel": "Educación Secundaria",
            "subject": "Matemática",
            "editionYear": 2024
        }
    },
    {
        "id": "QUI-LIB-002",
        "code": "QUI-LIB-002",
        "name": "Kit de Robótica Educativa Mindstorms",
        "category": "Material Didáctico y Libros",
        "location": "Lab. de Ciencias",
        "brand": "Lego Education",
        "model": "EV3 Core Set",
        "serialNumber": "LEGO-EV3-954",
        "quantity": 8,
        "status": "Bueno",
        "details": "Incluye ladrillo inteligente EV3, motores, sensores ultrasónicos y de color",
        "notes": "Asignado para talleres de ciencia, tecnología y robótica STEM",
        "customFields": {
            "publisherOrAuthor": "Lego Education",
            "isbnCode": "SET-5413-EV3",
            "educationalLevel": "Educación Secundaria",
            "subject": "Robótica / STEM",
            "editionYear": 2024
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
            "safetyGear": "Incluye inflador de doble acción y mallas",
            "storageBag": "Guardado en Red de Nylon"
        }
    },
    {
        "id": "QUI-DEP-002",
        "code": "QUI-DEP-002",
        "name": "Malla y Balones de Vóley Oficial",
        "category": "Artículos Deportivos y Educación Física",
        "location": "Almacén Deportivo",
        "brand": "Mikasa",
        "model": "V200W Escolar",
        "serialNumber": "N/A",
        "quantity": 10,
        "status": "Bueno",
        "details": "Balones de cuero sintético suave con 18 paneles aerodinámicos y red con cable de acero",
        "notes": "Para competencias escolares inter-aulas",
        "customFields": {
            "sportType": "Vóley / Voleibol",
            "equipmentCondition": "Óptimo (Inflado / Presión ok)",
            "safetyGear": "Red de vóley profesional con parantes",
            "storageBag": "Estante Deportivo"
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
    },
    {
        "id": "QUI-COC-002",
        "code": "QUI-COC-002",
        "name": "Vaso Térmico Polipropileno Qali Warma",
        "category": "Utensilios de Cocina y Comedor (Qali Warma)",
        "location": "Cocina / Comedor",
        "brand": "Reyware",
        "model": "Grado Alimenticio 350ml",
        "serialNumber": "N/A",
        "quantity": 180,
        "status": "Bueno",
        "details": "Vasos libres de BPA, reutilizables y resistentes a temperaturas elevadas",
        "notes": "Utilizados para la distribución de desayunos escolares",
        "customFields": {
            "utensilMaterial": "Plástico Térmico Alimenticio",
            "sanitaryStatus": "Apto y certificado para consumo",
            "capacityRations": "350 ml por unidad / 180 raciones",
            "energySupply": "Manual / Sin energía"
        }
    },
    {
        "id": "QUI-MUS-001",
        "code": "QUI-MUS-001",
        "name": "Tarola de Banda de Guerra Escolar",
        "category": "Arte, Música y Banda Escolar",
        "location": "Taller de Música y Banda",
        "brand": "Pearl",
        "model": "Marching Championship 14\"",
        "serialNumber": "PR-MARCH-09",
        "quantity": 6,
        "status": "Bueno",
        "details": "Cuerpo de madera de arce con aros de aluminio y porta tarola arnés acolchado",
        "notes": "Usadas en desfiles patrióticos y ceremonias cívicas del colegio",
        "customFields": {
            "instrumentCategory": "Percusión / Tambor",
            "tuningStatus": "Afinado y operativo",
            "includesCase": "Sí, estuche rígido"
        }
    },
    {
        "id": "QUI-MUS-002",
        "code": "QUI-MUS-002",
        "name": "Trompeta en Sib de Latón Dorado",
        "category": "Arte, Música y Banda Escolar",
        "location": "Taller de Música y Banda",
        "brand": "Yamaha",
        "model": "YTR-2330",
        "serialNumber": "YM-65120-T",
        "quantity": 4,
        "status": "Bueno",
        "details": "Acabado en laca dorada, pistones de monel y boquilla Yamaha 11B4",
        "notes": "Instrumentos para la Banda de Música Institucional",
        "customFields": {
            "instrumentCategory": "Viento Metal",
            "tuningStatus": "Afinado y operativo",
            "includesCase": "Sí, estuche rígido"
        }
    },
    {
        "id": "QUI-ENF-001",
        "code": "QUI-ENF-001",
        "name": "Botiquín Escolar de Primeros Auxilios",
        "category": "Enfermería y Botiquín de Auxilios",
        "location": "Enfermería Escolar",
        "brand": "Becton Medical",
        "model": "Mural de Acero 2026",
        "serialNumber": "BOT-ENF-01",
        "quantity": 3,
        "status": "Bueno",
        "details": "Gabinete metálico blanco con llave, equipado con gasas, apósitos, antisépticos y férulas",
        "notes": "Ubicados en Enfermería, Dirección y Patio Principal",
        "customFields": {
            "medicalCategory": "Botiquín Completo",
            "expiryDate": "2027-12-31",
            "sanitarySeal": "Empaque estéril sellado"
        }
    },
    {
        "id": "QUI-ENF-002",
        "code": "QUI-ENF-002",
        "name": "Camilla de Evacuación Plegable",
        "category": "Enfermería y Botiquín de Auxilios",
        "location": "Enfermería Escolar",
        "brand": "RescueTech",
        "model": "Aluminium Foldable ST-01",
        "serialNumber": "CAM-ESC-02",
        "quantity": 2,
        "status": "Bueno",
        "details": "Estructura de aleación de aluminio de alta resistencia con lona lavable de PVC",
        "notes": "Equipo obligatorio del plan de gestión de riesgos de desastres",
        "customFields": {
            "medicalCategory": "Camilla de Evacuación",
            "expiryDate": "2030-01-01",
            "sanitarySeal": "Reutilizable desinfectado"
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
        "details": "Color Blanco, 3 aspas de aluminio, selector de 5 velocidades de pared",
        "notes": "Operativos con selector de pared fijo",
        "customFields": {
            "powerRating": "75W por unidad",
            "installationType": "Fijado en Techo",
            "hasRemote": "Selector de Pared Fijo",
            "lastServiceDate": "2026-02-15"
        }
    },
    {
        "id": "QUI-CLI-002",
        "code": "QUI-CLI-002",
        "name": "Sistema de Sonido Potenciado para Actuaciones",
        "category": "Climatización y Audio",
        "location": "Patio Principal",
        "brand": "Behringer",
        "model": "Europort PPA500BT",
        "serialNumber": "BE-500BT-88",
        "quantity": 1,
        "status": "Bueno",
        "details": "Consola de 500 Watts de 6 canales, Bluetooth y 2 micrófonos inalámbricos",
        "notes": "Utilizado para actuaciones, formaciones matutinas y eventos deportivos",
        "customFields": {
            "powerRating": "500 Watts RMS",
            "installationType": "Portátil / Móvil con Ruedas",
            "hasRemote": "Control Remoto Inalámbrico",
            "lastServiceDate": "2026-03-01"
        }
    },
    {
        "id": "QUI-HER-001",
        "code": "QUI-HER-001",
        "name": "Taladro Percutor Eléctrico 750W",
        "category": "Herramientas y Mantenimiento",
        "location": "Dirección",
        "brand": "DeWalt",
        "model": "DWD024-B2",
        "serialNumber": "DW-750W-9912",
        "quantity": 1,
        "status": "Bueno",
        "details": "Motor de 750W, mandato de 1/2 pulgada, empuñadura lateral y varilla de profundidad",
        "notes": "Herramienta asignada al personal de mantenimiento institucional",
        "customFields": {
            "toolCategory": "Eléctrica con Cable 220V",
            "voltagePower": "750W / 220V AC",
            "includesCase": "Sí, incluye maletín original",
            "riskLevel": "Alto (Solo personal especializado de mantenimiento)"
        }
    },
    {
        "id": "QUI-SUM-001",
        "code": "QUI-SUM-001",
        "name": "Caja de Papel Bond A4 75g (5 Millar)",
        "category": "Suministros y Consumibles",
        "location": "Dirección",
        "brand": "Report / Chamex",
        "model": "A4 75g/m²",
        "serialNumber": "LOT-2026-02",
        "quantity": 25,
        "status": "Bueno",
        "details": "Papel ultra blanco multiuso para impresión de exámenes y material educativo",
        "notes": "Lote de útiles de oficina para el primer semestre 2026",
        "customFields": {
            "expirationDate": "2028-12-31",
            "lotNumber": "LOT-2026-02",
            "minStock": 5,
            "unitMeasure": "Cajas"
        }
    },
    {
        "id": "QUI-VAR-001",
        "code": "QUI-VAR-001",
        "name": "Escudo Institucional de Madera Tallada",
        "category": "Otros / Varios",
        "location": "Dirección",
        "brand": "Artesanal Cusco",
        "model": "Tallado Cedro 80cm",
        "serialNumber": "N/A",
        "quantity": 1,
        "status": "Bueno",
        "details": "Escudo oficial de la I.E. José Abelardo Quiñones tallado a mano en cedro barnizado",
        "notes": "Ubicado en el salón principal de la Dirección del establecimiento educativo",
        "customFields": {
            "itemType": "Símbolo Institucional / Cuadro",
            "specification": "80cm x 60cm, Madera Cedro Macizo",
            "additionalNotes": "Donado en las bodas de plata de la institución"
        }
    }
]

# --- 3. Questionnaires Schemas (All 11 Categories) ---
all_questionnaires = [
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
    },
    {
        "category": "Climatización y Audio",
        "title": "Ficha Técnica de Clima y Sonido",
        "icon": "❄️",
        "fields": [
            {"key": "powerRating", "label": "Potencia (Watts / BTU)", "type": "text", "placeholder": "Ej. 150W, 12000 BTU"},
            {"key": "installationType", "label": "Tipo de Instalación", "type": "select", "options": ["Fijado en Techo", "Mural en Pared", "Portátil", "Sobremesa"]},
            {"key": "hasRemote", "label": "Control Remoto / Switch", "type": "select", "options": ["Control Remoto Inalámbrico", "Selector de Pared", "Sin control"]},
            {"key": "lastServiceDate", "label": "Fecha de Mantenimiento", "type": "date"}
        ]
    },
    {
        "category": "Herramientas y Mantenimiento",
        "title": "Ficha de Herramientas",
        "icon": "🛠️",
        "fields": [
            {"key": "toolCategory", "label": "Tipo de Herramienta", "type": "select", "options": ["Manual", "Eléctrica 220V", "Inalámbrica a Batería", "Medición", "Jardinería"]},
            {"key": "voltagePower", "label": "Potencia / Especificación", "type": "text", "placeholder": "Ej. 750W / 18V Litio"},
            {"key": "includesCase", "label": "Maletín Incluido", "type": "select", "options": ["Sí, maletín original", "No, guardado en estante"]},
            {"key": "riskLevel", "label": "Nivel de Riesgo", "type": "select", "options": ["Bajo", "Moderado", "Alto (Personal capacitado)"]}
        ]
    },
    {
        "category": "Suministros y Consumibles",
        "title": "Control de Stock y Caducidad",
        "icon": "📦",
        "fields": [
            {"key": "expirationDate", "label": "Fecha de Vencimiento", "type": "date"},
            {"key": "lotNumber", "label": "Número de Lote", "type": "text", "placeholder": "Ej. LOT-202408-B"},
            {"key": "minStock", "label": "Stock Mínimo (Alerta)", "type": "number", "placeholder": "Ej. 5"},
            {"key": "unitMeasure", "label": "Unidad de Medida", "type": "select", "options": ["Unidades", "Cajas", "Paquetes", "Litros", "Rollos"]}
        ]
    },
    {
        "category": "Otros / Varios",
        "title": "Ficha General para Bienes Varios",
        "icon": "📑",
        "fields": [
            {"key": "itemType", "label": "Tipo / Clasificación del Bien", "type": "text", "placeholder": "Ej. Adorno, Cortina, Escudo, Trofeo"},
            {"key": "specification", "label": "Especificación Técnica / Descripción", "type": "text", "placeholder": "Ej. Dimensiones, peso o detalles especiales"},
            {"key": "additionalNotes", "label": "Observaciones / Notas de Conservación", "type": "text", "placeholder": "Ej. Ubicación exacta, donante o estado de conservación"}
        ]
    }
]

# --- 4. Default School Locations ---
default_locations = [
    "Aula-05", "Aula-01", "Aula-02", "Lab. de Cómputo", "Biblioteca",
    "Lab. de Ciencias", "Dirección", "Sala de Profesores", "Patio Principal",
    "Almacén Deportivo", "Cocina / Comedor", "Enfermería Escolar", "Taller de Música y Banda"
]

# ==================== SEED MONGODB ATLAS ====================
print("[*] Sincronizando datos en MongoDB Atlas...")

# 1. Inventario
for item in full_inventory:
    inventario_col.update_one({"id": item["id"]}, {"$set": item}, upsert=True)

# 2. Cuestionarios por categoría
for q in all_questionnaires:
    cuestionarios_col.update_one({"category": q["category"]}, {"$set": q}, upsert=True)

# 3. Ubicaciones
for loc in default_locations:
    ubicaciones_col.update_one({"name": loc}, {"$set": {"name": loc}}, upsert=True)

print(f"[+] MongoDB Atlas: {len(full_inventory)} bienes patrimoniales, {len(all_questionnaires)} plantillas de cuestionarios y {len(default_locations)} ubicaciones registradas con éxito.")

# ==================== SEED SQLITE LOCAL ====================
print(f"[*] Sincronizando datos en SQLite Local ({SQLITE_PATH})...")
conn = sqlite3.connect(SQLITE_PATH)
cursor = conn.cursor()

# 1. Tabla inventario
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

for item in full_inventory:
    cursor.execute('''
        INSERT OR REPLACE INTO inventario (id, code, name, category, location, brand, model, serial_number, quantity, status, details, notes, custom_fields)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        item["id"],
        item["code"],
        item["name"],
        item["category"],
        item["location"],
        item.get("brand", ""),
        item.get("model", ""),
        item.get("serialNumber", ""),
        int(item.get("quantity", 1)),
        item.get("status", "Bueno"),
        item.get("details", ""),
        item.get("notes", ""),
        json.dumps(item.get("customFields", {}))
    ))

# 2. Tabla cuestionarios_categoria
cursor.execute('''
    CREATE TABLE IF NOT EXISTS cuestionarios_categoria (
        category TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        icon TEXT,
        fields TEXT NOT NULL
    );
''')

for q in all_questionnaires:
    cursor.execute('''
        INSERT OR REPLACE INTO cuestionarios_categoria (category, title, icon, fields)
        VALUES (?, ?, ?, ?)
    ''', (
        q["category"],
        q["title"],
        q["icon"],
        json.dumps(q["fields"])
    ))

# 3. Tabla ubicaciones
cursor.execute('''
    CREATE TABLE IF NOT EXISTS ubicaciones (
        name TEXT PRIMARY KEY
    );
''')

for loc in default_locations:
    cursor.execute('INSERT OR IGNORE INTO ubicaciones (name) VALUES (?)', (loc,))

conn.commit()
conn.close()

print("[+] PROCESO COMPLETADO: MongoDB Atlas Cloud y SQLite local actualizados con todos los datos requeridos.")
