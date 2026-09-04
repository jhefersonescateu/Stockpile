import React, { useState, useEffect } from 'react';

const defaultQuestionnaireSchemas = {
  'Equipos Tecnológicos': {
    title: 'Especificaciones Técnicas y Conectividad',
    icon: '💻',
    fields: [
      { key: 'voltage', label: 'Voltaje / Alimentación', type: 'select', options: ['220V AC', '110V AC', 'Batería Recargable', 'USB 5V / Type-C', 'PoE (Power over Ethernet)'] },
      { key: 'ports', label: 'Puertos / Conectividad', type: 'text', placeholder: 'Ej. HDMI, VGA, Wi-Fi 6, Ethernet RJ45' },
      { key: 'macAddress', label: 'Dirección MAC / IP', type: 'text', placeholder: 'Ej. AA:BB:CC:DD:EE:FF / 192.168.1.50' },
      { key: 'warrantyExpiry', label: 'Vencimiento de Garantía', type: 'date' },
      { key: 'maintenanceStatus', label: 'Estado de Mantenimiento', type: 'select', options: ['Al día / Operativo', 'Mantenimiento Preventivo Pendiente', 'En Diagnóstico / Reparación', 'Garantía Vigente'] },
      { key: 'accessories', label: 'Accesorios Incluidos', type: 'text', placeholder: 'Ej. Cable de poder, Control remoto, Soporte de techo' }
    ]
  },
  'Mobiliario Escolar': {
    title: 'Materiales y Estado Estructural',
    icon: '🪑',
    fields: [
      { key: 'material', label: 'Material de Fabricación', type: 'select', options: ['Madera Prensada y Metal', 'Melamina con Marco de Fierro', 'Plástico Inyectado Reforzado', 'Madera Maciza (Cedro/Tornillo)', 'Aluminio y Vidrio'] },
      { key: 'dimensions', label: 'Dimensiones (Alto x Ancho x Prof.)', type: 'text', placeholder: 'Ej. 120cm x 50cm x 75cm' },
      { key: 'capacity', label: 'Capacidad de Personas', type: 'select', options: ['Unipersonal (1 estudiante)', 'Bipersonal (2 estudiantes)', 'Mesa Grupal (4-6 estudiantes)', 'Uso Docente / Administrativo'] },
      { key: 'color', label: 'Color Predominante', type: 'text', placeholder: 'Ej. Marrón Claro, Azul Institucional, Gris Metalizado' },
      { key: 'structureState', label: 'Estado de la Estructura', type: 'select', options: ['Óptimo sin detalles', 'Requiere ajuste de pernos/soldadura', 'Superficie desgastada/rayada', 'Inestable / Para reparación'] }
    ]
  },
  'Material Didáctico y Libros': {
    title: 'Ficha Pedagógica y Editorial',
    icon: '📚',
    fields: [
      { key: 'publisherOrAuthor', label: 'Editorial / Autor', type: 'text', placeholder: 'Ej. Santillana, MINEDU, Ediciones Corefo' },
      { key: 'isbnCode', label: 'Código ISBN / Depósito Legal', type: 'text', placeholder: 'Ej. 978-612-345-678-9 / Lote MINEDU 2024' },
      { key: 'educationalLevel', label: 'Nivel Educativo Target', type: 'select', options: ['Educación Inicial', 'Educación Primaria', 'Educación Secundaria', 'Docentes / Biblioteca central'] },
      { key: 'subject', label: 'Área Curricular / Asignatura', type: 'select', options: ['Matemática', 'Comunicación', 'Ciencia y Tecnología', 'Ciencias Sociales', 'Inglés', 'Arte y Cultura', 'Robótica / STEM'] },
      { key: 'editionYear', label: 'Año de Edición / Publicación', type: 'number', placeholder: 'Ej. 2024' }
    ]
  },
  'Climatización y Audio': {
    title: 'Ficha Técnica de Equipos de Clima y Sonido',
    icon: '❄️',
    fields: [
      { key: 'powerRating', label: 'Potencia (Watts / Lumens / BTU)', type: 'text', placeholder: 'Ej. 150W, 12000 BTU, 3800 Lumens' },
      { key: 'installationType', label: 'Tipo de Instalación', type: 'select', options: ['Fijado en Techo', 'Mural / Colgado en Pared', 'Portátil / Móvil con Ruedas', 'Sobremesa / Consola'] },
      { key: 'hasRemote', label: 'Control Remoto / Interruptor', type: 'select', options: ['Incluye Control Remoto Inalámbrico', 'Selector de Pared Fijo', 'Sin control remoto'] },
      { key: 'lastServiceDate', label: 'Fecha de Último Mantenimiento', type: 'date' }
    ]
  },
  'Herramientas y Mantenimiento': {
    title: 'Ficha de Herramientas y Seguridad',
    icon: '🛠️',
    fields: [
      { key: 'toolCategory', label: 'Tipo de Herramienta', type: 'select', options: ['Manual (Alicate, Llave, Martillo)', 'Eléctrica con Cable 220V', 'Inalámbrica a Batería', 'Medición y Calibración', 'Corte y Jardinería'] },
      { key: 'voltagePower', label: 'Especificación Técnica / Potencia', type: 'text', placeholder: 'Ej. 750W / 18V Litio / 1/2 pulgada' },
      { key: 'includesCase', label: 'Maletín / Caja de Almacenamiento', type: 'select', options: ['Sí, incluye maletín original', 'No, guardado en estante común'] },
      { key: 'riskLevel', label: 'Nivel de Riesgo de Manipulación', type: 'select', options: ['Bajo (Uso general)', 'Moderado (Supervisión requerida)', 'Alto (Solo personal especializado de mantenimiento)'] }
    ]
  },
  'Suministros y Consumibles': {
    title: 'Control de Lote, Vencimiento y Reorden',
    icon: '📦',
    fields: [
      { key: 'expirationDate', label: 'Fecha de Vencimiento / Caducidad', type: 'date' },
      { key: 'lotNumber', label: 'Número de Lote de Fabricación', type: 'text', placeholder: 'Ej. LOT-202408-B' },
      { key: 'minStock', label: 'Punto de Reorden (Stock Mínimo Alerta)', type: 'number', placeholder: 'Ej. 5' },
      { key: 'unitMeasure', label: 'Unidad de Medida', type: 'select', options: ['Unidades / Piezas', 'Cajas', 'Paquetes / Paqs', 'Litros / Galones', 'Rollos', 'Kits'] }
    ]
  },
  'Artículos Deportivos y Educación Física': {
    title: 'Ficha de Implementación Deportiva y Educación Física',
    icon: '⚽',
    fields: [
      { key: 'sportType', label: 'Disciplina / Deporte Target', type: 'select', options: ['Fútbol / Balompié', 'Básquet / Baloncesto', 'Vóley / Voleibol', 'Atletismo y Gimnasia', 'Ajedrez y Juegos de Mesa', 'Psicomotricidad Inicial'] },
      { key: 'equipmentCondition', label: 'Estado de Uso y Presión', type: 'select', options: ['Óptimo (Inflado / Presión correcta)', 'Requiere aire / inflador', 'Costura / Superficie desgastada', 'Inoperativo / De baja'] },
      { key: 'safetyGear', label: 'Accesorios y Protección', type: 'text', placeholder: 'Ej. Incluye 10 conos, 12 chalecos/petos, colchonetas' },
      { key: 'storageBag', label: 'Malla / Red de Almacenamiento', type: 'select', options: ['Guardado en Red de Nylon Reforzada', 'Estante Abierto de Almacén Deportivo', 'Caja Organizadora Plástica'] }
    ]
  },
  'Utensilios de Cocina y Comedor (Qali Warma)': {
    title: 'Ficha Técnica de Cocina Escolar y Qali Warma',
    icon: '🍳',
    fields: [
      { key: 'utensilMaterial', label: 'Material Grado Alimenticio', type: 'select', options: ['Acero Inoxidable Quirúrgico', 'Aluminio Reforzado', 'Plástico Térmico Grado Alimenticio', 'Vidrio Templado / Porcelana'] },
      { key: 'sanitaryStatus', label: 'Registro e Higiene Sanitaria', type: 'select', options: ['Apto y certificado para consumo escolar', 'Requiere desinfección profunda / mantenimiento', 'Desgastado para reemplazo'] },
      { key: 'capacityRations', label: 'Capacidad de Raciones / Volumen', type: 'text', placeholder: 'Ej. 50 Litros / 120 raciones diarias' },
      { key: 'energySupply', label: 'Fuente de Calentamiento / Operación', type: 'select', options: ['Gas GLP Industrial', 'Eléctrico 220V', 'Manual / Utensilio sin energía'] }
    ]
  },
  'Arte, Música y Banda Escolar': {
    title: 'Ficha de Instrumentos Musicales y Artes Plásticas',
    icon: '🎷',
    fields: [
      { key: 'instrumentCategory', label: 'Familia del Instrumento / Arte', type: 'select', options: ['Viento Metal (Trompeta, Trombón, Tuba)', 'Viento Madera (Flauta, Clarinete)', 'Percusión (Tarola, Bombo, Platillos)', 'Cuerdas (Guitarra, Violín)', 'Artes Plásticas / Caballetes'] },
      { key: 'tuningStatus', label: 'Estado de Calibración / Afinación', type: 'select', options: ['Afinado y operativo para presentaciones', 'Requiere afinación / ajuste leve', 'Parche / Llave dañada para reparación'] },
      { key: 'includesCase', label: 'Funda / Estuche de Protección', type: 'select', options: ['Sí, incluye estuche rígido original', 'Sí, funda acolchada de tela', 'Sin funda de protección'] }
    ]
  },
  'Enfermería y Botiquín de Auxilios': {
    title: 'Ficha de Emergencia Médica Escolar',
    icon: '🩺',
    fields: [
      { key: 'medicalCategory', label: 'Tipo de Equipo / Insumo', type: 'select', options: ['Botiquín Completo de Primeros Auxilios', 'Camilla de Evacuación / Rescate', 'Equipo de Medición (Tensiómetro, Termómetro)', 'Antisépticos, Vendajes y Gasas'] },
      { key: 'expiryDate', label: 'Fecha de Vencimiento de Medicamentos', type: 'date' },
      { key: 'sanitarySeal', label: 'Estado de Empaque / Esterilidad', type: 'select', options: ['Empaque estéril sellado de fábrica', 'Reutilizable desinfectado', 'Vencido / Para descarte'] }
    ]
  }
};

export default function DynamicQuestionnaireModal({ isOpen, onClose, onSave, itemToEdit = null, categorySchemas = {} }) {
  const combinedSchemas = { ...defaultQuestionnaireSchemas, ...categorySchemas };

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: 'Equipos Tecnológicos',
    location: 'Aula-05',
    brand: '',
    model: '',
    serialNumber: '',
    quantity: 1,
    status: 'Bueno',
    details: '',
    notes: '',
    customFields: {}
  });

  const [activeStep, setActiveStep] = useState(1); // 1: Datos Generales, 2: Cuestionario Específico por Categoría

  useEffect(() => {
    if (!isOpen) return;
    if (itemToEdit) {
      setFormData({
        id: itemToEdit.id,
        code: itemToEdit.code || '',
        name: itemToEdit.name || '',
        category: itemToEdit.category || 'Equipos Tecnológicos',
        location: itemToEdit.location || 'Aula-05',
        brand: itemToEdit.brand || '',
        model: itemToEdit.model || '',
        serialNumber: itemToEdit.serialNumber || '',
        quantity: itemToEdit.quantity || 1,
        status: itemToEdit.status || 'Bueno',
        details: itemToEdit.details || '',
        notes: itemToEdit.notes || '',
        customFields: itemToEdit.customFields || itemToEdit.custom_fields || {}
      });
    } else {
      setFormData({
        code: '',
        name: '',
        category: 'Equipos Tecnológicos',
        location: 'Aula-05',
        brand: '',
        model: '',
        serialNumber: '',
        quantity: 1,
        status: 'Bueno',
        details: '',
        notes: '',
        customFields: {}
      });
    }
    setActiveStep(1);
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleGeneralChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Reset step if category changes
      if (name === 'category' && !combinedSchemas[value]) {
        // preserve
      }
      return updated;
    });
  };

  const handleCustomFieldChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [key]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const currentCategorySchema = combinedSchemas[formData.category] || {
    title: 'Cuestionario General',
    icon: '📝',
    fields: [
      { key: 'department', label: 'Área Responsable', type: 'text', placeholder: 'Ej. Coordinación Pedagógica' },
      { key: 'acquisitionOrigin', label: 'Origen del Objeto', type: 'select', options: ['Asignación MINEDU', 'Donación APAFA', 'Presupuesto Propio', 'Transferencia'] }
    ]
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="modal-container" style={{
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '16px',
        border: '1px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '90vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#38bdf8', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>{itemToEdit ? '✏️ Editar Registro en SQLite' : '➕ Registrar Nuevo Objeto en Inventario'}</span>
            </h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
              Base de Datos: <span style={{ color: '#4ade80', fontWeight: '600' }}>db/inventario.db</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.2rem 0.5rem',
              borderRadius: '6px'
            }}
          >
            &times;
          </button>
        </div>

        {/* Stepper Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #334155',
          backgroundColor: '#0f172a'
        }}>
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeStep === 1 ? '#1e293b' : 'transparent',
              color: activeStep === 1 ? '#38bdf8' : '#64748b',
              border: 'none',
              borderBottom: activeStep === 1 ? '3px solid #38bdf8' : 'none',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>1. Datos Básicos y Ubicación</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            style={{
              flex: 1,
              padding: '0.85rem 1rem',
              background: activeStep === 2 ? '#1e293b' : 'transparent',
              color: activeStep === 2 ? '#a855f7' : '#64748b',
              border: 'none',
              borderBottom: activeStep === 2 ? '3px solid #a855f7' : 'none',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <span>2. Cuestionario Dinámico {currentCategorySchema.icon}</span>
            <span style={{
              backgroundColor: '#a855f722',
              color: '#c084fc',
              fontSize: '0.75rem',
              padding: '0.1rem 0.5rem',
              borderRadius: '10px',
              border: '1px solid #a855f744'
            }}>
              {currentCategorySchema.fields.length} preguntas
            </span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* STEP 1: DATOS GENERALES */}
          {activeStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Categoría del Objeto *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleGeneralChange}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                    required
                  >
                    <option value="Equipos Tecnológicos">💻 Equipos Tecnológicos</option>
                    <option value="Mobiliario Escolar">🪑 Mobiliario Escolar</option>
                    <option value="Material Didáctico y Libros">📚 Material Didáctico y Libros</option>
                    <option value="Artículos Deportivos y Educación Física">⚽ Artículos Deportivos y Educación Física</option>
                    <option value="Utensilios de Cocina y Comedor (Qali Warma)">🍳 Utensilios de Cocina y Comedor (Qali Warma)</option>
                    <option value="Arte, Música y Banda Escolar">🎷 Arte, Música y Banda Escolar</option>
                    <option value="Enfermería y Botiquín de Auxilios">🩺 Enfermería y Botiquín de Auxilios</option>
                    <option value="Climatización y Audio">❄️ Climatización y Audio</option>
                    <option value="Herramientas y Mantenimiento">🛠️ Herramientas y Mantenimiento</option>
                    <option value="Suministros y Consumibles">📦 Suministros y Consumibles</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Nombre / Descripción del Objeto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleGeneralChange}
                    placeholder="Ej. Laptop Lenovo Core i5"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Ubicación / Aula *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleGeneralChange}
                    placeholder="Ej. Aula-05, Laboratorio"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleGeneralChange}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Estado Operativo
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleGeneralChange}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="Bueno">✅ Bueno / Operativo</option>
                    <option value="Regular">⚠️ Regular / Desgaste</option>
                    <option value="Mantenimiento">🔧 En Mantenimiento</option>
                    <option value="Malo">❌ Malo / Inoperativo</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Marca
                  </label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleGeneralChange}
                    placeholder="Ej. Epson, HP, MINEDU"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Modelo
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleGeneralChange}
                    placeholder="Ej. PowerLite 118"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                    Número de Serie / Código
                  </label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleGeneralChange}
                    placeholder="Ej. SN-984021"
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      color: '#f8fafc',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Detalles / Especificaciones Adicionales
                </label>
                <textarea
                  name="details"
                  rows="2"
                  value={formData.details}
                  onChange={handleGeneralChange}
                  placeholder="Detalles sobre características físicas o instalación..."
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{
                backgroundColor: '#1e1b4b',
                border: '1px solid #4338ca',
                borderRadius: '10px',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{currentCategorySchema.icon}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#c084fc', fontSize: '0.9rem' }}>
                      Cuestionario listo para {formData.category}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#a5b4fc' }}>
                      Haz clic en "Continuar al Cuestionario" para ingresar los campos específicos de esta categoría.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  style={{
                    backgroundColor: '#6366f1',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Siguiente ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CUESTIONARIO DINÁMICO POR CATEGORÍA */}
          {activeStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                backgroundColor: '#0f172a',
                padding: '1rem',
                borderRadius: '12px',
                border: '1px solid #3b82f644',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '2rem' }}>{currentCategorySchema.icon}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#38bdf8' }}>
                    {currentCategorySchema.title}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    Formulario adaptado específicamente para la categoría: <strong style={{ color: '#f1f5f9' }}>{formData.category}</strong>
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {currentCategorySchema.fields.map((field) => {
                  const currentValue = formData.customFields[field.key] || '';
                  return (
                    <div key={field.key} style={{ gridColumn: field.type === 'textarea' ? '1 / -1' : 'auto' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            borderRadius: '8px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #475569',
                            color: '#f8fafc',
                            fontSize: '0.9rem'
                          }}
                        >
                          <option value="">-- Seleccionar opcional --</option>
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={currentValue}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            borderRadius: '8px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #475569',
                            color: '#f8fafc',
                            fontSize: '0.9rem'
                          }}
                        />
                      ) : field.type === 'number' ? (
                        <input
                          type="number"
                          value={currentValue}
                          placeholder={field.placeholder || ''}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            borderRadius: '8px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #475569',
                            color: '#f8fafc',
                            fontSize: '0.9rem'
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentValue}
                          placeholder={field.placeholder || ''}
                          onChange={(e) => handleCustomFieldChange(field.key, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.65rem',
                            borderRadius: '8px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #475569',
                            color: '#f8fafc',
                            fontSize: '0.9rem'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  Observaciones adicionales / Notas internas
                </label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleGeneralChange}
                  placeholder="Ej. Entregado mediante acta de recepción Lote 2024"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #475569',
                    color: '#f8fafc',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {activeStep === 2 ? (
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                style={{
                  backgroundColor: '#334155',
                  color: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.2rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ⬅ Volver a Datos Básicos
              </button>
            ) : (
              <div></div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '0.65rem 1.25rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.5rem',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>💾 Guardar en SQLite</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
