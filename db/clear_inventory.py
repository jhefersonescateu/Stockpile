import pymongo
import sqlite3
import os

MONGO_URI = "mongodb+srv://jhefersonescateu_db_user:990246774@cluster0.gfvpqxm.mongodb.net/?appName=Cluster0"
DB_NAME = "inventario"
DB_DIR = os.path.dirname(__file__)
SQLITE_PATH = os.path.join(DB_DIR, "inventario.db")

print("[*] Limpiando datos de prueba del inventario...")

# 1. Limpiar MongoDB Atlas
try:
    client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
    db = client[DB_NAME]
    res_mongo = db["inventario"].delete_many({})
    print(f"[+] MongoDB Atlas: Eliminados {res_mongo.deleted_count} registros de la coleccion 'inventario'.")
    print("[+] Las plantillas de cuestionarios dinámicos 'cuestionarios_categoria' se mantuvieron intactas.")
except Exception as e:
    print(f"[!] Error al limpiar MongoDB: {e}")

# 2. Limpiar SQLite local
if os.path.exists(SQLITE_PATH):
    try:
        conn = sqlite3.connect(SQLITE_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM inventario")
        conn.commit()
        print(f"[+] SQLite Local: Eliminados {cursor.rowcount} registros de la tabla 'inventario'.")
        conn.close()
    except Exception as e:
        print(f"[!] Error al limpiar SQLite: {e}")

print("[+] Inventario completamente vaciado y listo para ingreso real de datos.")
