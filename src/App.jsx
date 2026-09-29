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
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [isAccessGranted, setIsAccessGranted] = useState(false);

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

  const [isActaModalOpen, setIsActaModalOpen] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbSourceName, setDbSourceName] = useState('Turso DB');

  const verifyAccessCode = async (codeValue) => {
    const normalized = (codeValue || '').trim();
    if (!normalized) {
      setAccessError('Ingresa el código de acceso.');
      return false;
    }

    setIsAccessLoading(true);
    setAccessError('');

    try {
      const res = await fetch('/api/access/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: normalized })
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setAccessError(json.message || 'Código incorrecto.');
        return false;
      }

      localStorage.setItem('stockpile_access_code', normalized.toUpperCase());
      setIsAccessGranted(true);
      return true;
    } catch (error) {
      setAccessError('No se pudo verificar el código de acceso.');
      return false;
    } finally {
      setIsAccessLoading(false);
    }
  };

  const handleAccessSubmit = async (event) => {
    event.preventDefault();
    await verifyAccessCode(accessCode);
  };

  const handleLogout = () => {
    localStorage.removeItem('stockpile_access_code');
    setAccessCode('');
    setAccessError('');
    setIsAccessGranted(false);
  };

  // Load inventory from the Python API backed by Turso.
  const loadFromBackend = async () => {
    try {
      const res = await fetch('/api/inventory');
      const json = await res.json();
      if (!res.ok || !json.success || !Array.isArray(json.data)) {
        throw new Error(json.message || 'No se pudo cargar el inventario de Turso.');
      }
      setItems(json.data);
      setIsDbConnected(true);
      setDbSourceName(json.source || 'Turso DB');
    } catch (error) {
      console.error('No se pudo cargar el inventario de Turso:', error);
      setIsDbConnected(false);
    }
  };

  // Cargar ubicaciones guardadas en la base de datos
  const loadLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'No se pudieron cargar las ubicaciones.');
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setLocations(['Todas las Ubicaciones', ...json.data.filter(l => l !== 'Todas las Ubicaciones')]);
      }
    } catch (error) {
      console.error('No se pudieron cargar las ubicaciones de Turso:', error);
    }
  };

  useEffect(() => {
    const savedCode = localStorage.getItem('stockpile_access_code');
    if (savedCode) {
      verifyAccessCode(savedCode);
      return;
    }
    setIsAccessGranted(false);
  }, []);

  useEffect(() => {
    if (!isAccessGranted) return;
    loadFromBackend();
    loadLocations();
  }, [isAccessGranted]);

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

  // Save inventory changes through the Turso-backed API.
  const handleSaveDynamicQuestionnaire = async (itemData) => {
    let saveSucceeded = false;
    try {
      const isUpdating = Boolean(itemData.id);
      const res = await fetch(isUpdating ? `/api/inventory/${itemData.id}` : '/api/inventory', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || 'No se pudo guardar en Turso.');
      }

      if (isUpdating) {
        setItems(prev => prev.map(item => item.id === itemData.id ? json.data : item));
      } else {
        setItems(prev => [json.data, ...prev]);
      }
      setIsDbConnected(true);
      saveSucceeded = true;
      showToast(`Bien patrimonial "${itemData.name}" guardado en Turso.`);
    } catch (error) {
      setIsDbConnected(false);
      console.error('Error al guardar en Turso:', error);
      showToast(error.message || 'No se pudo guardar en Turso.');
    }
    if (saveSucceeded) setIsItemModalOpen(false);
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

  // Delete inventory through the Turso-backed API.
  const handleDeleteItem = async (id, name) => {
    if (window.confirm(`¿Está seguro de dar de baja / eliminar el bien patrimonial "${name}" de la base de datos?`)) {
      try {
        const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.message || json.error || 'No se pudo eliminar en Turso.');
        setItems(prev => prev.filter(item => item.id !== id));
        showToast(`Bien patrimonial "${name}" eliminado de Turso.`);
      } catch (error) {
        showToast(error.message || 'No se pudo eliminar en Turso.');
      }
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
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formatted })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || result.error || 'No se pudo guardar en Turso.');
    } catch (error) {
      showToast(error.message || 'No se pudo guardar la ubicación en Turso.');
      return;
    }

    setLocations(prev => [...prev, formatted]);
    setSelectedLocation(formatted);
    setNewLocationInput('');
    showToast(`🏫 Nueva ubicación "${formatted}" guardada en la base de datos con éxito.`);
  };

  // Delete location from DB and state
  const handleDeleteLocation = async (locName) => {
    if (window.confirm(`¿Está seguro de eliminar la ubicación "${locName}" de la base de datos?`)) {
      try {
        const response = await fetch(`/api/locations/${encodeURIComponent(locName)}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || result.error || 'No se pudo eliminar en Turso.');
      } catch (error) {
        showToast(error.message || 'No se pudo eliminar la ubicación en Turso.');
        return;
      }

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

  if (!isAccessGranted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f766e 100%)',
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(15, 23, 42, 0.82)',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          borderRadius: '18px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.45)',
          padding: '28px 24px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🔐</div>
            <h2 style={{ color: '#f8fafc', margin: 0, fontSize: '1.7rem' }}>Acceso al inventario</h2>
            <p style={{ color: '#cbd5e1', margin: '12px 0 0', fontSize: '0.9rem' }}>
              Ingresa el código autorizado para acceder al sistema patrimonial.
            </p>
          </div>

          <form onSubmit={handleAccessSubmit}>
            <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '8px', fontWeight: 600 }}>
              Código de acceso
            </label>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="Ej. STOCKPILE2026"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid #475569',
                background: '#0f172a',
                color: '#f8fafc',
                fontSize: '1rem',
                marginBottom: '12px'
              }}
            />

            {accessError && (
              <div style={{
                color: '#fca5a5',
                background: 'rgba(127, 29, 29, 0.35)',
                border: '1px solid rgba(248, 113, 113, 0.5)',
                borderRadius: '10px',
                padding: '10px 12px',
                marginBottom: '12px',
                fontSize: '0.85rem'
              }}>
                {accessError}
              </div>
            )}

            <button
              type="submit"
              disabled={isAccessLoading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
                color: '#fff',
                border: 'none',
                padding: '12px 14px',
                borderRadius: '10px',
                cursor: isAccessLoading ? 'not-allowed' : 'pointer',
                fontWeight: 700,
                fontSize: '0.95rem'
              }}
            >
              {isAccessLoading ? 'Verificando...' : 'Entrar al sistema'}
            </button>
          </form>

          <div style={{ marginTop: '18px', color: '#cbd5e1', fontSize: '0.78rem', textAlign: 'center' }}>
            Base de datos: {dbSourceName}
          </div>
        </div>
      </div>
    );
  }

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
          <div className="header-logo-badge" style={{ background: 'linear-gradient(135deg, #1e3a8a, #0f172a)' }}>
            🏛️
          </div>
          <div className="header-title-box">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontFamily: "'Outfit', sans-serif", fontSize: '1.45rem', color: '#1e3a8a' }}>
                Sistema de Control Patrimonial Escolar
              </h1>
              <span style={{
                backgroundColor: isDbConnected ? '#064e3b' : '#451a03',
                color: isDbConnected ? '#a7f3d0' : '#fbbf24',
                border: `1px solid ${isDbConnected ? '#059669' : '#d97706'}`,
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <span className="status-pulse-dot" style={{ backgroundColor: isDbConnected ? '#10b981' : '#f59e0b' }}></span>
                <span>{isDbConnected ? `🐍 ${dbSourceName}` : 'Turso desconectado'}</span>
              </span>
            </div>
            <p style={{ color: '#475569', fontSize: '0.88rem', fontWeight: 500, marginTop: '2px' }}>
              Institución Educativa José Abelardo Quiñones — Registro Patrimonial Institucional 2026
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleLogout}>
            <span>🔒</span> Cerrar sesión
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <span>+</span> Registrar Bien Patrimonial
          </button>
          <button className="btn btn-secondary" onClick={() => setIsLocationModalOpen(true)}>
            <span>🏫</span> + Nueva Ubicación
          </button>
          <button className="btn btn-secondary" style={{ color: '#1e3a8a', borderColor: '#93c5fd', backgroundColor: '#eff6ff' }} onClick={() => setIsActaModalOpen(true)}>
            <span>📜</span> Acta de Inventario
          </button>
          <button className="btn btn-emerald" onClick={handleExportExcel}>
            <span>📊</span> Exportar Excel (.csv)
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
                <span className="kpi-title">TOTAL DE BIENES PATRIMONIALES</span>
                <div className="kpi-icon">📦</div>
              </div>
              <div className="kpi-value">{metrics.totalRecords} <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500 }}>({metrics.totalQuantityUnits} unids)</span></div>
              <div className="kpi-subtext">Bienes catalogados en {selectedLocation}</div>
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
                  <span>Registro Oficial de Bienes Escolares</span>
                  <span className="table-badge-subtitle">Dependencia: {selectedLocation}</span>
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#1e3a8a', borderColor: '#93c5fd' }}
                    onClick={() => setIsActaModalOpen(true)}
                  >
                    📜 Generar Acta Oficial
                  </button>
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
                    placeholder="Buscar por código patrimonial, bien, marca, serie, aula..."
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
                  <option value="Bueno">✓ Óptimo / Operativo</option>
                  <option value="Regular">⚠️ Regular / Mantenimiento</option>
                  <option value="Malo">✕ Malo / Propuesto de Baja</option>
                </select>
              </div>
            </div>

            {/* Data Table */}
            <div className="table-responsive">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>CÓDIGO PATRIMONIAL</th>
                    <th>UBICACIÓN / AULA</th>
                    <th>CLASE / CATEGORÍA</th>
                    <th>DENOMINACIÓN DEL BIEN</th>
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
                          <div className="item-details-sub">{item.model && item.model !== 'N/A' ? item.model : ''}</div>
                        </td>
                        <td>
                          <div className="specs-text">{item.details}</div>
                          {item.serialNumber && item.serialNumber !== 'N/A' && (
                            <div className="item-details-sub" style={{ fontFamily: 'monospace' }}>
                              S/N: {item.serialNumber}
                            </div>
                          )}
                          {item.customFields && Object.keys(item.customFields).length > 0 && (
                            <div className="custom-fields-wrapper">
                              {Object.entries(item.customFields)
                                .filter(([, val]) => val)
                                .slice(0, 3)
                                .map(([key, val], idx) => (
                                  <span key={idx} className="custom-field-pill">
                                    <strong>{key}:</strong> {val}
                                  </span>
                                ))}
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

      {/* Modal with category-specific inventory fields. */}
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

      {/* Modal: ACTA OFICIAL DE INVENTARIO Y CONTROL PATRIMONIAL */}
      {isActaModalOpen && (
        <div className="modal-overlay" onClick={() => setIsActaModalOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '900px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📜 Acta Oficial de Control Patrimonial Escolar</h3>
              <button className="close-btn" onClick={() => setIsActaModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body printable-area-wrapper">
              <div className="official-acta-container">
                <div className="official-acta-header">
                  <h2>REPÚBLICA DEL PERÚ — MINISTERIO DE EDUCACIÓN</h2>
                  <h1>ACTA OFICIAL DE CONTROL Y VERIFICACIÓN PATRIMONIAL</h1>
                  <p>Institución Educativa Emblemática "José Abelardo Quiñones" — Año Lectivo 2026</p>
                </div>

                <div className="acta-meta-grid">
                  <div className="acta-meta-item">
                    <span>INSTITUCIÓN EDUCATIVA</span>
                    <strong>I.E. José Abelardo Quiñones</strong>
                  </div>
                  <div className="acta-meta-item">
                    <span>DEPENDENCIA / UBICACIÓN</span>
                    <strong>{selectedLocation}</strong>
                  </div>
                  <div className="acta-meta-item">
                    <span>CANTIDAD DE BIENES</span>
                    <strong>{filteredItems.length} registros ({metrics.totalQuantityUnits} unidades)</strong>
                  </div>
                  <div className="acta-meta-item">
                    <span>BASE DE DATOS PATRIMONIAL</span>
                    <strong>{dbSourceName}</strong>
                  </div>
                  <div className="acta-meta-item">
                    <span>FECHA DE EMISIÓN</span>
                    <strong>{new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                  </div>
                </div>

                <table className="acta-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>CÓDIGO SBN / QUI</th>
                      <th style={{ width: '25%' }}>DENOMINACIÓN DEL BIEN</th>
                      <th style={{ width: '15%' }}>UBICACIÓN</th>
                      <th style={{ width: '15%' }}>MARCA / SERIE</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>CANT.</th>
                      <th style={{ width: '20%' }}>ESTADO / OBSERVACIONES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{item.code}</td>
                        <td>
                          <strong>{item.name}</strong>
                          <br />
                          <small style={{ color: '#475569' }}>{item.category}</small>
                        </td>
                        <td>{item.location}</td>
                        <td>
                          {item.brand || 'MINEDU'}
                          {item.serialNumber && item.serialNumber !== 'N/A' && <><br /><small>SN: {item.serialNumber}</small></>}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: item.status === 'Bueno' ? '#15803d' : item.status === 'Regular' ? '#b45309' : '#b91c1c' }}>
                            {item.status}
                          </span>
                          {item.details && <><br /><small>{item.details}</small></>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="acta-signatures-grid">
                  <div className="signature-box">
                    <div className="signature-line"></div>
                    <p>Firma y Sello del Director(a)</p>
                    <span>Comisión de Gestión Recursos Institucionales</span>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line"></div>
                    <p>Responsable de Control Patrimonial</p>
                    <span>Unidad Administrativa Escolar</span>
                  </div>
                  <div className="signature-box">
                    <div className="signature-line"></div>
                    <p>Verificador / Auditor de Bienes</p>
                    <span>Comité de Control Patrimonial 2026</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsActaModalOpen(false)}>
                Cerrar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.print();
                }}
              >
                🖨️ Imprimir / Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
