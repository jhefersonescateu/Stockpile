import React, { useState, useMemo, useEffect } from 'react';
import QRManagerModule from './components/QRManagerModule';
import DynamicQuestionnaireModal from './components/DynamicQuestionnaireModal';


// Sample School Inventory Data - Start with 0 items
const initialSchoolInventory = [];


const categoriesList = [
  'Todas las Categorías',
  'Mobiliario Escolar',
  'Equipos Tecnológicos',
  'Material Didáctico y Libros',
  'Artículos Deportivos y Educación Física',
  'Utensilios de Cocina y Comedor (Qali Warma)',
  'Arte, Música y Banda Escolar',
  'Enfermería y Botiquín de Auxilios',
  'Climatización y Audio',
  'Herramientas y Mantenimiento',
  'Suministros y Consumibles',
  'Otros / Varios'
];

const defaultLocations = [
  'Todas las Ubicaciones',
  'Aula-05',
  'Aula-01',
  'Aula-02',
  'Lab. de Cómputo',
  'Biblioteca',
  'Lab. de Ciencias',
  'Dirección',
  'Sala de Profesores',
  'Patio Principal',
  'Almacén Deportivo'
];

export default function App() {
  const [items, setItems] = useState(initialSchoolInventory);
  const [locations, setLocations] = useState(defaultLocations);

  // Navigation Tabs state ('inventory' | 'qr')
  const [activeMainTab, setActiveMainTab] = useState('inventory');
  const [selectedQrItem, setSelectedQrItem] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedLocation, setSelectedLocation] = useState('Todas las Ubicaciones');
  const [selectedCategory, setSelectedCategory] = useState('Todas las Categorías');
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagItem, setTagItem] = useState(null);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [newLocationInput, setNewLocationInput] = useState('');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbSourceName, setDbSourceName] = useState('SQLite Local');

  // Cargar inventario desde el servidor Python (server.py) con MongoDB / SQLite
  const loadFromBackend = async () => {
    try {
      let res;
      try {
        res = await fetch('http://localhost:5001/api/inventory');
      } catch (errPy) {
        res = await fetch('http://localhost:3001/api/inventory');
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
        setIsDbConnected(true);
        if (json.source) {
          setDbSourceName(json.source);
        }
      }
    } catch (err) {
      console.warn('Servidor Backend no detectado, usando memoria local fallback');
      setIsDbConnected(false);
    }
  };

  // Cargar ubicaciones guardadas en la base de datos
  const loadLocations = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/locations');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setLocations(['Todas las Ubicaciones', ...json.data.filter(l => l !== 'Todas las Ubicaciones')]);
      }
    } catch (err) { }
  };

  useEffect(() => {
    loadFromBackend();
    loadLocations();
  }, []);

  // Abrir modal para NUEVO ítem con cuestionario dinámico
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  // Abrir modal para EDITAR ítem
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  // Guardar ítem (Crear o Actualizar en SQLite)
  const handleSaveDynamicQuestionnaire = async (itemData) => {
    const backendBase = 'http://localhost:5001/api/inventory';
    try {
      if (itemData.id) {
        // Actualizar en SQLite via API Python
        let res;
        try {
          res = await fetch(`${backendBase}/${itemData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
          });
        } catch (e1) {
          res = await fetch(`http://localhost:3001/api/inventory/${itemData.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
          });
        }
        const json = await res.json();
        if (json.success) {
          setItems(prev => prev.map(it => it.id === itemData.id ? json.data : it));
          showToast(`✅ Objeto "${itemData.name}" actualizado en SQLite db/inventario.db`);
        } else {
          setItems(prev => prev.map(it => it.id === itemData.id ? itemData : it));
        }
      } else {
        // Crear nuevo en SQLite via API Python
        let res;
        try {
          res = await fetch(backendBase, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
          });
        } catch (e2) {
          res = await fetch('http://localhost:3001/api/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemData)
          });
        }
        const json = await res.json();
        if (json.success) {
          setItems(prev => [json.data, ...prev]);
          showToast(`📦 Objeto "${itemData.name}" registrado en SQLite db/inventario.db`);
        } else {
          const newItem = { ...itemData, id: itemData.code || `QUI-${Date.now()}` };
          setItems(prev => [newItem, ...prev]);
        }
      }
      setIsDbConnected(true);
    } catch (err) {
      console.error('Error al conectar con backend:', err);
      if (itemData.id) {
        setItems(prev => prev.map(it => it.id === itemData.id ? itemData : it));
      } else {
        const newItem = { ...itemData, id: itemData.code || `QUI-${Date.now()}` };
        setItems(prev => [newItem, ...prev]);
      }
      showToast(`📦 Objeto "${itemData.name}" guardado localmente.`);
    }
    setIsItemModalOpen(false);
  };

  // Duplicar Ítem
  const handleDuplicateItem = async (item) => {
    const nextNum = items.length + 1;
    const duplicated = {
      ...item,
      id: '',
      code: `QUI-REG-${String(nextNum).padStart(3, '0')}`,
      name: `${item.name} (Copia)`
    };
    await handleSaveDynamicQuestionnaire(duplicated);
  };

  // Eliminar Ítem de SQLite
  const handleDeleteItem = async (id, name) => {
    if (window.confirm(`¿Está seguro de eliminar el bien "${name}" de la base de datos db/inventario.db?`)) {
      try {
        await fetch(`http://localhost:5000/api/inventory/${id}`, { method: 'DELETE' });
      } catch (e) {
        try {
          await fetch(`http://localhost:3001/api/inventory/${id}`, { method: 'DELETE' });
        } catch (e2) { }
      }
      setItems(prev => prev.filter(item => item.id !== id));
      showToast(`🗑️ Bien "${name}" eliminado de la base de datos SQLite.`);
    }
  };

  // Printable QR Tag Modal
  const handleOpenTagModal = (item) => {
    setTagItem(item);
    setIsTagModalOpen(true);
  };


  // Add new classroom location (Guarda en la base de datos)
  const handleAddLocation = async (e) => {
    e.preventDefault();
    if (!newLocationInput.trim()) return;
    const formatted = newLocationInput.trim();
    if (locations.includes(formatted)) {
      alert('Esta ubicación ya se encuentra registrada.');
      return;
    }

    try {
      await fetch('http://localhost:5001/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formatted })
      });
    } catch (err) { }

    setLocations(prev => [...prev, formatted]);
    setSelectedLocation(formatted);
    setNewLocationInput('');
    showToast(`🏫 Nueva ubicación "${formatted}" guardada en la base de datos con éxito.`);
  };

  // Delete location from DB and state
  const handleDeleteLocation = async (locName) => {
    if (window.confirm(`¿Está seguro de eliminar la ubicación "${locName}" de la base de datos?`)) {
      try {
        await fetch(`http://localhost:5001/api/locations/${encodeURIComponent(locName)}`, {
          method: 'DELETE'
        });
      } catch (err) { }

      setLocations(prev => prev.filter(l => l !== locName));
      if (selectedLocation === locName) {
        setSelectedLocation('Todas las Ubicaciones');
      }
      showToast(`🗑️ Ubicación "${locName}" eliminada de la base de datos.`);
    }
  };

  // Filter Items
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    return items.filter(item => {
      if (!item) return false;
      // Search term
      const query = (searchQuery || '').toLowerCase();
      const nameMatch = (item.name || '').toLowerCase().includes(query);
      const codeMatch = (item.code || '').toLowerCase().includes(query);
      const locationMatch = (item.location || '').toLowerCase().includes(query);
      const brandMatch = (item.brand || '').toLowerCase().includes(query);
      const detailsMatch = (item.details || '').toLowerCase().includes(query);
      const serialMatch = (item.serialNumber || '').toLowerCase().includes(query);

      const matchesSearch = nameMatch || codeMatch || locationMatch || brandMatch || detailsMatch || serialMatch;

      // Location
      const matchesLocation = selectedLocation === 'Todas las Ubicaciones' || item.location === selectedLocation;

      // Category
      const matchesCategory = selectedCategory === 'Todas las Categorías' || item.category === selectedCategory;

      // Status
      const matchesStatus = selectedStatus === 'Todos' || item.status === selectedStatus;

      return matchesSearch && matchesLocation && matchesCategory && matchesStatus;
    });
  }, [items, searchQuery, selectedLocation, selectedCategory, selectedStatus]);

  // Dynamic KPI Metrics
  const metrics = useMemo(() => {
    const totalRecords = filteredItems.length;
    const totalQuantityUnits = filteredItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    const techCount = filteredItems
      .filter(i => i.category === 'Equipos Tecnológicos')
      .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    const furnitureCount = filteredItems
      .filter(i => i.category === 'Mobiliario Escolar')
      .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    const goodCount = filteredItems.filter(i => i.status === 'Bueno').length;
    const regularCount = filteredItems.filter(i => i.status === 'Regular').length;
    const badCount = filteredItems.filter(i => i.status === 'Malo').length;

    const operationalPercent = totalRecords > 0 ? Math.round(((goodCount + regularCount) / totalRecords) * 100) : 100;

    return {
      totalRecords,
      totalQuantityUnits,
      techCount,
      furnitureCount,
      goodCount,
      regularCount,
      badCount,
      operationalPercent
    };
  }, [filteredItems]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      alert('No hay datos para exportar con los filtros actuales.');
      return;
    }

    const headers = [
      'CÓDIGO',
      'UBICACIÓN',
      'CATEGORÍA',
      'BIEN / OBJETO',
      'MARCA',
      'MODELO',
      'SERIE',
      'DETALLES / ESPECIFICACIONES',
      'CANTIDAD',
      'ESTADO',
      'OBSERVACIONES'
    ];

    const csvRows = [headers.join(',')];

    filteredItems.forEach(item => {
      const row = [
        `"${item.code || ''}"`,
        `"${item.location || ''}"`,
        `"${item.category || ''}"`,
        `"${item.name || ''}"`,
        `"${item.brand || ''}"`,
        `"${item.model || ''}"`,
        `"${item.serialNumber || ''}"`,
        `"${(item.details || '').replace(/"/g, '""')}"`,
        item.quantity || 1,
        `"${item.status || ''}"`,
        `"${(item.notes || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventario_Quiñones_${selectedLocation.replace(/\s+/g, '_')}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📊 Reporte de inventario exportado en formato Excel / CSV.');
  };

  return (
    <div className="inventory-app">
      {/* Toast alert */}
      {toastMessage && (
        <div className="toast-notification">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar matching executive reference styling */}
      <header className="header-card">
        <div className="header-brand">
          <div className="header-logo-badge">
            🏫
          </div>
          <div className="header-title-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0 }}>Inventario Escolar — I.E. José Abelardo Quiñones</h1>
              <span style={{
                backgroundColor: isDbConnected ? (dbSourceName.includes('MongoDB') ? '#022c22' : '#064e3b') : '#451a03',
                color: isDbConnected ? (dbSourceName.includes('MongoDB') ? '#34d399' : '#34d399') : '#fbbf24',
                border: `1px solid ${isDbConnected ? (dbSourceName.includes('MongoDB') ? '#059669' : '#059669') : '#d97706'}`,
                padding: '0.2rem 0.65rem',
                borderRadius: '12px',
                fontSize: '0.78rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <span>{isDbConnected ? (dbSourceName.includes('MongoDB') ? `🍃 ${dbSourceName}` : `🐍 ${dbSourceName}`) : '🟡 Modo Local'}</span>
              </span>
            </div>
            <p>Módulo Institucional de Almacenamiento, Mobiliario y Equipamiento Tecnológico — Registro 2026</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <span>+</span> Registrar Nuevo Bien
          </button>
          <button className="btn btn-secondary" onClick={() => setIsLocationModalOpen(true)}>
            <span>🏫</span> + Nueva Ubicación
          </button>
          <button className="btn btn-emerald" onClick={handleExportExcel}>
            <span>📊</span> Exportar Excel (.xlsx)
          </button>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <nav className="main-nav-bar">
        <button
          className={`nav-tab-btn ${activeMainTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('inventory')}
        >
          <span>📦</span> Libro de Control de Inventario
        </button>
        <button
          className={`nav-tab-btn ${activeMainTab === 'qr' ? 'active' : ''}`}
          onClick={() => setActiveMainTab('qr')}
        >
          <span>🏷️</span> Generador & Escáner QR de Etiquetas
          <span className="nav-tab-badge">NUEVO</span>
        </button>
      </nav>

      {activeMainTab === 'qr' ? (
        <QRManagerModule
          items={items}
          locations={locations}
          categoriesList={categoriesList}
          onAddItem={(newItem) => setItems(prev => [newItem, ...prev])}
          onUpdateItem={(updatedItem) => setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item))}
          showToast={showToast}
          initialSelectedItem={selectedQrItem}
        />
      ) : (
        <>
          {/* Dynamic Metrics Cards Bar (4 columns) */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">
                <span className="kpi-title">TOTAL DE BIENES EN VISTA</span>
                <div className="kpi-icon">📦</div>
              </div>
              <div className="kpi-value">{metrics.totalRecords} <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>({metrics.totalQuantityUnits} unids)</span></div>
              <div className="kpi-subtext">Registros catalogados en {selectedLocation}</div>
            </div>

            <div className="kpi-card kpi-teal">
              <div className="kpi-header">
                <span className="kpi-title">EQUIPOS TECNOLÓGICOS</span>
                <div className="kpi-icon">💻</div>
              </div>
              <div className="kpi-value">{metrics.techCount} <span style={{ fontSize: '0.9rem', color: '#0d9488' }}>unidades</span></div>
              <div className="kpi-subtext">Laptops, Proyectores, PCs y Periféricos</div>
            </div>

            <div className="kpi-card kpi-amber">
              <div className="kpi-header">
                <span className="kpi-title">MOBILIARIO ESCOLAR</span>
                <div className="kpi-icon">🪑</div>
              </div>
              <div className="kpi-value">{metrics.furnitureCount} <span style={{ fontSize: '0.9rem', color: '#b45309' }}>unidades</span></div>
              <div className="kpi-subtext">Mesas, Sillas, Pizarras y Estantes</div>
            </div>

            <div className="kpi-card kpi-indigo">
              <div className="kpi-header">
                <span className="kpi-title">ESTADO Y CONSERVACIÓN</span>
                <div className="kpi-icon">✅</div>
              </div>
              <div className="kpi-value">{metrics.operationalPercent}% <span style={{ fontSize: '0.9rem', color: '#4f46e5' }}>Operativos</span></div>
              <div className="kpi-subtext">
                {metrics.goodCount} Óptimos | {metrics.regularCount} Regular | <span style={{ color: '#dc2626', fontWeight: 600 }}>{metrics.badCount} Malos/Baja</span>
              </div>
            </div>
          </div>

          {/* Main Table Content Card */}
          <main className="content-card">
            <div className="table-header-bar">
              <div className="table-title-row">
                <h2>
                  <span>Libro de Control de Inventario Escolar</span>
                  <span className="table-badge-subtitle">Ubicación Actual: {selectedLocation}</span>
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-amber btn-sm"
                    onClick={() => {
                      if (filteredItems.length > 0) setSelectedQrItem(filteredItems[0]);
                      setActiveMainTab('qr');
                    }}
                  >
                    🏷️ Generar Etiquetas QR
                  </button>
                </div>
              </div>

              {/* Filters and Search Row */}
              <div className="filters-row">
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar por código, nombre de bien, marca, serie, aula..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="filter-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  {locations.map((loc, idx) => (
                    <option key={idx} value={loc}>
                      📍 {loc}
                    </option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categoriesList.map((cat, idx) => (
                    <option key={idx} value={cat}>
                      📁 {cat}
                    </option>
                  ))}
                </select>

                <select
                  className="filter-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="Todos">⚡ Todos los Estados</option>
                  <option value="Bueno">✓ Bueno / Operativo</option>
                  <option value="Regular">⚠️ Regular</option>
                  <option value="Malo">✕ Malo / De Baja</option>
                </select>
              </div>
            </div>

            {/* Data Table */}
            <div className="table-responsive">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>CÓDIGO</th>
                    <th>UBICACIÓN / AULA</th>
                    <th>CLASE / CATEGORÍA</th>
                    <th>NOMBRE DEL BIEN</th>
                    <th>MARCA / MODELO</th>
                    <th>ESPECIFICACIONES Y DETALLES</th>
                    <th style={{ textAlign: 'center' }}>CANT.</th>
                    <th>ESTADO</th>
                    <th style={{ textAlign: 'center' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="code-tag">{item.code}</span>
                        </td>
                        <td>
                          <span className="location-badge">
                            📍 {item.location}
                          </span>
                        </td>
                        <td>
                          <span className="category-tag">{item.category}</span>
                        </td>
                        <td>
                          <div className="item-name">{item.name}</div>
                          {item.notes && <div className="item-details-sub">📝 {item.notes}</div>}
                        </td>
                        <td>
                          <div className="brand-text">{item.brand || 'MINEDU'}</div>
                          <div className="item-details-sub">{item.model !== 'N/A' ? item.model : ''}</div>
                        </td>
                        <td>
                          <div className="specs-text">{item.details}</div>
                          {item.serialNumber && item.serialNumber !== 'N/A' && (
                            <div className="item-details-sub" style={{ fontFamily: 'monospace' }}>
                              S/N: {item.serialNumber}
                            </div>
                          )}
                          {item.customFields && Object.keys(item.customFields).length > 0 && (
                            <div style={{
                              marginTop: '6px',
                              fontSize: '0.78rem',
                              color: '#c084fc',
                              backgroundColor: '#3b0764',
                              border: '1px solid #7e22ce',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              lineHeight: '1.4'
                            }}>
                              <strong style={{ color: '#e9d5ff' }}>📋 Cuestionario:</strong>{' '}
                              {Object.entries(item.customFields)
                                .filter(([_, val]) => val)
                                .map(([key, val]) => `${key}: ${val}`)
                                .slice(0, 3)
                                .join(' | ')}
                              {Object.entries(item.customFields).filter(([_, val]) => val).length > 3 && ' ...'}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="qty-badge">{item.quantity}</span>
                        </td>
                        <td>
                          {item.status === 'Bueno' && (
                            <span className="status-badge status-bueno">✓ Bueno / Operativo</span>
                          )}
                          {item.status === 'Regular' && (
                            <span className="status-badge status-regular">⚠️ Regular</span>
                          )}
                          {item.status === 'Malo' && (
                            <span className="status-badge status-malo">✕ Malo / De baja</span>
                          )}
                        </td>
                        <td>
                          <div className="actions-cell" style={{ justifyContent: 'center' }}>
                            <button
                              className="btn-icon"
                              title="Editar bien"
                              onClick={() => handleOpenEditModal(item)}
                            >
                              ✏️
                            </button>
                            <button
                              className="btn-icon"
                              title="Generar e Imprimir Etiqueta QR"
                              onClick={() => {
                                setSelectedQrItem(item);
                                setActiveMainTab('qr');
                              }}
                            >
                              🏷️
                            </button>
                            <button
                              className="btn-icon"
                              title="Duplicar registro"
                              onClick={() => handleDuplicateItem(item)}
                            >
                              📋
                            </button>
                            <button
                              className="btn-icon danger"
                              title="Eliminar bien"
                              onClick={() => handleDeleteItem(item.id, item.name)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9">
                        <div className="empty-state">
                          <div className="empty-state-icon">🔍</div>
                          <h3>No se encontraron bienes registrados</h3>
                          <p style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                            No hay ítems que coincidan con la búsqueda o filtro seleccionado en <strong>{selectedLocation}</strong>.
                          </p>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ marginTop: '16px' }}
                            onClick={handleOpenAddModal}
                          >
                            + Registrar Primer Bien en {selectedLocation}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer info bar */}
            <div className="table-footer">
              <div>
                Mostrando <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> bienes registrados en total.
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <span>🏫 Institución Educativa José Abelardo Quiñones</span>
                <span>|</span>
                <span>Sistema Stockpile v2.5</span>
              </div>
            </div>
          </main>
        </>
      )}

      {/* Modal con Cuestionario Dinámico por Categoría en SQLite */}
      <DynamicQuestionnaireModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSave={handleSaveDynamicQuestionnaire}
        itemToEdit={editingItem}
      />

      {/* Modal: PRINTABLE QR / TAG PREVIEW */}
      {isTagModalOpen && tagItem && (
        <div className="modal-overlay" onClick={() => setIsTagModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏷️ Ficha de Control Patrimonial — I.E. Quiñones</h3>
              <button className="close-btn" onClick={() => setIsTagModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="asset-tag-card">
                <div className="asset-tag-header">
                  <h4>I.E. JOSÉ ABELARDO QUIÑONES</h4>
                  <p>SISTEMA PATRIMONIAL INSTITUCIONAL</p>
                </div>

                <div className="asset-tag-code">{tagItem.code}</div>
                <div className="asset-tag-barcode"></div>

                <div className="asset-tag-info">
                  <p><strong>BIEN:</strong> {tagItem.name}</p>
                  <p><strong>UBICACIÓN:</strong> {tagItem.location}</p>
                  <p><strong>CATEGORÍA:</strong> {tagItem.category}</p>
                  <p><strong>MARCA/MODELO:</strong> {tagItem.brand} {tagItem.model !== 'N/A' ? tagItem.model : ''}</p>
                  {tagItem.serialNumber !== 'N/A' && <p><strong>N° SERIE:</strong> {tagItem.serialNumber}</p>}
                  <p><strong>ESTADO:</strong> {tagItem.status}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsTagModalOpen(false)}>
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                🖨️ Imprimir Etiqueta / QR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: GESTIONAR UBICACIONES / AULAS */}
      {isLocationModalOpen && (
        <div className="modal-overlay" onClick={() => setIsLocationModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🏫 Gestión de Aulas y Ubicaciones</h3>
              <button className="close-btn" onClick={() => setIsLocationModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddLocation} style={{ marginBottom: '20px' }}>
                <div className="form-group">
                  <label>Nombre de la Nueva Ubicación / Aula</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Aula-06, Taller de Robótica, Auditórium..."
                      value={newLocationInput}
                      onChange={(e) => setNewLocationInput(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary">
                      + Agregar
                    </button>
                  </div>
                </div>
              </form>

              <h4 style={{ fontSize: '0.85rem', marginBottom: '10px', color: '#475569' }}>
                Ubicaciones Registradas ({locations.length - 1}):
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {locations
                  .filter(l => l !== 'Todas las Ubicaciones')
                  .map((loc, idx) => (
                    <div
                      key={idx}
                      className="location-badge"
                      style={{
                        padding: '6px 10px',
                        fontSize: '0.82rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1'
                      }}
                    >
                      <span>📍 {loc}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteLocation(loc)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#ef4444',
                          fontSize: '0.85rem',
                          padding: '0 2px'
                        }}
                        title={`Eliminar ubicación ${loc}`}
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsLocationModalOpen(false)}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
