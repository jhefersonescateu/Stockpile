import React, { useState, useEffect } from 'react';

// Initial Mock Inventory Data
const initialProducts = [
  { id: 1, name: 'Servidor Dell PowerEdge R750', sku: 'DELL-R750-01', category: 'Servidores', stock: 12, price: 4500.00, status: 'En Stock' },
  { id: 2, name: 'Switch Cisco Catalyst 9300', sku: 'CISCO-9300-24', category: 'Redes', stock: 4, price: 2100.00, status: 'Stock Bajo' },
  { id: 3, name: 'Router Fortinet FortiGate 100F', sku: 'FORTI-100F-X', category: 'Seguridad', stock: 8, price: 1850.00, status: 'En Stock' },
  { id: 4, name: 'Disco Duro Seagate Exos 18TB', sku: 'SEA-EXOS-18', category: 'Almacenamiento', stock: 45, price: 380.00, status: 'En Stock' },
  { id: 5, name: 'Access Point Aruba AP-515', sku: 'ARUBA-AP515-0', category: 'Redes', stock: 0, price: 650.00, status: 'Sin Stock' },
  { id: 6, name: 'UPS APC Smart-UPS 3000VA', sku: 'APC-SU3000-Y', category: 'Energía', stock: 2, price: 1250.00, status: 'Stock Bajo' },
  { id: 7, name: 'Memoria RAM Kingston 32GB DDR4', sku: 'KING-DDR4-32', category: 'Componentes', stock: 120, price: 120.00, status: 'En Stock' },
];

// Rotating info cards shown below the login panel
const infoCards = [
  {
    emoji: '📦',
    label: 'Control Total de Inventario',
    desc: 'Registra entradas, salidas y transferencias de productos en tiempo real desde cualquier dispositivo.',
    stat: '99.9%',
    statLabel: 'Precisión garantizada',
  },
  {
    emoji: '📊',
    label: 'Reportes y Análisis Predictivo',
    desc: 'Genera reportes automáticos con gráficas de tendencia de consumo y alertas de reabastecimiento.',
    stat: '+3x',
    statLabel: 'Más velocidad operativa',
  },
  {
    emoji: '🏷️',
    label: 'Gestión por SKU y Categorías',
    desc: 'Organiza cada producto con códigos únicos, categorías personalizadas y etiquetas de búsqueda rápida.',
    stat: '0 errores',
    statLabel: 'En catalogación',
  },
  {
    emoji: '🚚',
    label: 'Logística y Despacho Integrado',
    desc: 'Coordina órdenes de salida, guías de despacho y confirmaciones de entrega desde un solo panel.',
    stat: '-40%',
    statLabel: 'En tiempos de despacho',
  },
  {
    emoji: '🔔',
    label: 'Alertas Automáticas de Stock',
    desc: 'Recibe notificaciones instantáneas cuando un producto alcanza su nivel mínimo de inventario.',
    stat: '24/7',
    statLabel: 'Monitoreo continuo',
  },
  {
    emoji: '🔒',
    label: 'Seguridad y Acceso por Roles',
    desc: 'Define permisos diferenciados para administradores, operadores y auditores con cifrado AES-256.',
    stat: 'AES-256',
    statLabel: 'Cifrado militar',
  },
];

function App() {
  // --- Authentication States ---
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });
  const [createAccountText, setCreateAccountText] = useState('Crear cuenta corporativa');
  const [createAccountStyle, setCreateAccountStyle] = useState({});

  // --- Session State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- Dashboard States ---
  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // --- Ticker State (For cycling storage emojis) ---
  const [tickerIndex, setTickerIndex] = useState(0);

  // Reference for email focus
  const emailInputRef = React.useRef(null);

  // Auto-focus email when login form is shown
  useEffect(() => {
    if (showLogin && !isLoggedIn) {
      const timer = setTimeout(() => {
        if (emailInputRef.current) {
          emailInputRef.current.focus();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showLogin, isLoggedIn]);

  // Cycle ticker items every 5 seconds when not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      const interval = setInterval(() => {
        setTickerIndex((prevIndex) => (prevIndex + 1) % infoCards.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  // --- Auth Handlers ---
  const handleGoToLogin = () => {
    setShowLogin(true);
  };

  const handleBackToCTA = () => {
    setShowLogin(false);
    clearFeedback();
    setEmail('');
    setPassword('');
    setIsPasswordVisible(false);
  };

  const handleCreateAccount = () => {
    setCreateAccountText('Servicio no disponible temporalmente');
    setCreateAccountStyle({
      borderColor: 'var(--state-warning)',
      color: 'var(--state-warning)'
    });

    setTimeout(() => {
      setCreateAccountText('Crear cuenta corporativa');
      setCreateAccountStyle({});
    }, 3000);
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const clearFeedback = () => {
    setFeedback({ text: '', type: '' });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    clearFeedback();

    const emailVal = email.trim();
    const passVal = password;

    if (!emailVal || !passVal) {
      setFeedback({ text: 'Por favor, rellene todos los campos obligatorios.', type: 'error' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      setFeedback({ text: 'Por favor, introduzca una dirección de correo electrónico válida.', type: 'error' });
      if (emailInputRef.current) {
        emailInputRef.current.focus();
      }
      return;
    }

    if (passVal.length < 6) {
      setFeedback({ text: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);

      // Validate user requested credentials:
      // Email: jhefersonescateu@gmail.com
      // Password: 990246774
      if (emailVal === 'jhefersonescateu@gmail.com' && passVal === '990246774') {
        setFeedback({ text: '¡Acceso autorizado! Cargando inventario...', type: 'success' });
        
        // Wait 1 second and login
        setTimeout(() => {
          setIsLoggedIn(true);
          clearFeedback();
        }, 1000);
      } else {
        setFeedback({ 
          text: 'Credenciales incorrectas. Usa jhefersonescateu@gmail.com y contraseña 990246774.', 
          type: 'error' 
        });
      }
    }, 1800);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setShowLogin(false);
    setEmail('');
    setPassword('');
  };

  // --- Inventory Dashboard Handlers ---
  const handleIncreaseStock = (productId) => {
    setProducts(prevProducts =>
      prevProducts.map(product => {
        if (product.id === productId) {
          const newStock = product.stock + 1;
          let newStatus = 'En Stock';
          if (newStock === 0) newStatus = 'Sin Stock';
          else if (newStock <= 4) newStatus = 'Stock Bajo';

          return { ...product, stock: newStock, status: newStatus };
        }
        return product;
      })
    );
  };

  const handleDecreaseStock = (productId) => {
    setProducts(prevProducts =>
      prevProducts.map(product => {
        if (product.id === productId && product.stock > 0) {
          const newStock = product.stock - 1;
          let newStatus = 'En Stock';
          if (newStock === 0) newStatus = 'Sin Stock';
          else if (newStock <= 4) newStatus = 'Stock Bajo';

          return { ...product, stock: newStock, status: newStatus };
        }
        return product;
      })
    );
  };

  // --- Filtering Logic ---
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Unique categories for the dropdown filter
  const categories = ['Todos', ...new Set(products.map(p => p.category))];

  // --- Metric Calculations ---
  const totalValuation = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStockAlerts = products.filter(p => p.stock <= 4).length;

  // --- Render ---
  return (
    <div className="app-container">
      {isLoggedIn ? (
        /* ==========================================================================
           INVENTORY DASHBOARD VIEW (AFTER SUCCESSFUL LOGIN)
           ========================================================================== */
        <div className="dashboard-layout">
          {/* Dashboard Header */}
          <header className="dash-header">
            <div className="dash-logo">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3L4 9L16 15L28 9L16 3Z" fill="url(#dash-logo-grad)"/>
                <path d="M4 14L16 20L28 14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 19L16 25L28 19" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="dash-logo-grad" x1="4" y1="9" x2="28" y2="9" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8"/>
                    <stop offset="1" stopColor="#6366f1"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="dash-logo-text">Stockpile</span>
              <span className="dash-divider">|</span>
              <span className="dash-subtitle">Gestión de Inventario</span>
            </div>
            
            <div className="dash-user-controls">
              <div className="user-profile">
                <div className="user-avatar">J</div>
                <span className="user-email">jhefersonescateu@gmail.com</span>
              </div>
              <button className="btn-logout" onClick={handleLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </header>

          <main className="dash-main">
            {/* Top Metrics Row */}
            <section className="dash-metrics-grid">
              <div className="dash-metric-card">
                <div className="dash-metric-icon val">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div className="dash-metric-info">
                  <span className="dash-metric-label">Valor del Inventario</span>
                  <span className="dash-metric-value">
                    ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="dash-metric-card">
                <div className="dash-metric-icon items">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                </div>
                <div className="dash-metric-info">
                  <span className="dash-metric-label">Unidades en Stock</span>
                  <span className="dash-metric-value">{totalItems.toLocaleString('en-US')}</span>
                </div>
              </div>

              <div className="dash-metric-card alert">
                <div className="dash-metric-icon warn">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div className="dash-metric-info">
                  <span className="dash-metric-label">Alertas de Stock</span>
                  <span className="dash-metric-value text-warn">{lowStockAlerts}</span>
                </div>
              </div>
            </section>

            {/* Inventory Controls & Table Section */}
            <section className="dash-content-card">
              <div className="dash-table-header">
                <h3>Lista de Artículos</h3>
                
                <div className="dash-table-filters">
                  {/* Category Filter */}
                  <div className="filter-select-wrapper">
                    <select 
                      value={categoryFilter} 
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="filter-select"
                    >
                      {categories.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Search Bar */}
                  <div className="dash-search-wrapper">
                    <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input 
                      type="text" 
                      placeholder="Buscar producto, SKU o categoría..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="dash-search-input"
                    />
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div className="table-responsive">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Artículo</th>
                      <th>SKU</th>
                      <th>Categoría</th>
                      <th className="text-center">Stock</th>
                      <th>Precio Unitario</th>
                      <th>Valor Total</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="dash-table-row">
                          <td>
                            <div className="product-name">{product.name}</div>
                          </td>
                          <td>
                            <span className="product-sku">{product.sku}</span>
                          </td>
                          <td>
                            <span className="product-category-badge">{product.category}</span>
                          </td>
                          <td>
                            <div className="stock-counter">
                              <button 
                                className="stock-btn" 
                                onClick={() => handleDecreaseStock(product.id)}
                                disabled={product.stock === 0}
                              >
                                -
                              </button>
                              <span className="stock-number">{product.stock}</span>
                              <button 
                                className="stock-btn" 
                                onClick={() => handleIncreaseStock(product.id)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className="product-price">${product.price.toFixed(2)}</span>
                          </td>
                          <td>
                            <span className="product-total-val">${(product.price * product.stock).toFixed(2)}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${
                              product.status === 'En Stock' ? 'success' : 
                              product.status === 'Stock Bajo' ? 'warning' : 'error'
                            }`}>
                              {product.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="no-results">
                          No se encontraron artículos que coincidan con la búsqueda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      ) : (
        /* ==========================================================================
           LANDING & AUTH VIEW (BEFORE LOGGING IN) - SIDEBAR SWAPPED TO LEFT
           ========================================================================== */
        <>
          {/* ── Global top nav ── */}
          <nav className="landing-nav" aria-label="Navegación principal">
            <div className="landing-nav-logo">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 3L4 9L16 15L28 9L16 3Z" fill="url(#nav-logo-grad)"/>
                <path d="M4 14L16 20L28 14" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4 19L16 25L28 19" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="nav-logo-grad" x1="4" y1="9" x2="28" y2="9" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8"/>
                    <stop offset="1" stopColor="#6366f1"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="landing-nav-brand">Stockpile</span>
            </div>
            <div className="landing-nav-links">
              <a href="#" className="nav-link">Producto</a>
              <a href="#" className="nav-link">Precios</a>
              <a href="#" className="nav-link">Soporte</a>
              <a href="#" className="nav-link nav-link-cta" onClick={(e) => { e.preventDefault(); setShowLogin(true); }}>Iniciar sesión</a>
            </div>
          </nav>
          {/* Left Column: Interactive sliding panel for authentication (NOW ON THE LEFT) */}
          <aside className="auth-panel">
            {/* Background drifting glow animation inside the auth container (ENHANCED VISIBILITY) */}
            <div className="auth-bg-animation">
              <div className="auth-drift-circle auth-drift-1"></div>
              <div className="auth-drift-circle auth-drift-2"></div>
              <div className="auth-drift-circle auth-drift-3"></div>
            </div>

            <div className="auth-panel-inner">

            <div className={`glass-card ${showLogin ? 'show-login' : ''}`} id="authCard">
              
              {/* STEP 1: CTA Buttons (Welcome state) */}
              <div className="auth-step cta-step" id="ctaStep">
                <div className="auth-header">
                  <h2>Acceso a la plataforma</h2>
                  <p>Optimiza tus operaciones y gestiona tus recursos hoy mismo.</p>
                </div>

                <div className="action-buttons-group">
                  <button className="btn btn-primary" id="btnGoToLogin" onClick={handleGoToLogin}>
                    <span>Ingresar a mi cuenta</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    id="btnCreateAccount" 
                    onClick={handleCreateAccount}
                    style={createAccountStyle}
                  >
                    <span>{createAccountText}</span>
                  </button>
                </div>

                <div className="cta-features">
                  <div className="cta-feature-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span>Encriptación de grado militar AES-256</span>
                  </div>
                </div>
              </div>

              {/* STEP 2: Login Form (Form state) */}
              <div className="auth-step login-step" id="loginStep">
                <button className="btn-back" id="btnBackToCTA" onClick={handleBackToCTA} aria-label="Volver">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                  <span>Volver</span>
                </button>

                <div className="auth-header">
                  <h2>Iniciar sesión</h2>
                  <p>Ingresa tus credenciales autorizadas de Stockpile.</p>
                </div>

                <form className="login-form" id="loginForm" onSubmit={handleLoginSubmit} noValidate>
                  {/* Form feedback notification area */}
                  {feedback.text && (
                    <div className={`form-feedback ${feedback.type}`} style={{ display: 'block' }}>
                      {feedback.text}
                    </div>
                  )}

                  <div className="input-group">
                    <label htmlFor="loginEmail">Correo Electrónico</label>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <input 
                        type="email" 
                        id="loginEmail" 
                        placeholder="jhefersonescateu@gmail.com" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        ref={emailInputRef}
                        disabled={isLoading}
                      />
                      <span className="input-border"></span>
                    </div>
                  </div>

                  <div className="input-group">
                    <div className="label-row">
                      <label htmlFor="loginPassword">Contraseña</label>
                      <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>¿Olvidaste tu contraseña?</a>
                    </div>
                    <div className="input-wrapper">
                      <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      <input 
                        type={isPasswordVisible ? 'text' : 'password'} 
                        id="loginPassword" 
                        placeholder="••••••••" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button 
                        type="button" 
                        className={`btn-toggle-password ${isPasswordVisible ? 'active' : ''}`}
                        onClick={togglePasswordVisibility} 
                        aria-label="Mostrar contraseña"
                      >
                        {isPasswordVisible ? (
                          <svg className="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        ) : (
                          <svg className="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        )}
                      </button>
                      <span className="input-border"></span>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-submit" id="btnSubmitLogin" disabled={isLoading}>
                    {!isLoading ? (
                      <span className="btn-text">Ingresar al sistema</span>
                    ) : (
                      <svg className="spinner-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                      </svg>
                    )}
                  </button>

                  <a href="#" className="forgot-password-link" onClick={(e) => e.preventDefault()}>¿Olvidaste tu contraseña?</a>

                  <div className="sso-divider"><span>o continúa con</span></div>

                  <div className="sso-buttons">
                    <button type="button" className="btn-sso" id="btnGoogleSSO">
                      <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span>Google</span>
                    </button>
                    <button type="button" className="btn-sso" id="btnMicrosoftSSO">
                      <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022"/>
                        <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00"/>
                        <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF"/>
                        <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900"/>
                      </svg>
                      <span>Microsoft</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>

            </div>{/* end auth-panel-inner */}

          </aside>

          {/* Right Column: Branding, features & metrics (WITH SLOW SCALING BACKGROUND AND DEPTH) */}
          <main className="hero-section">
            {/* Background floating lights inside the hero section for depth */}
            <div className="hero-ambient-lights">
              <div className="hero-light hero-light-purple"></div>
              <div className="hero-light hero-light-celeste"></div>
            </div>

            <div className="hero-content">
              <span className="badge">Tecnología de Inventario Inteligente</span>
              <h1 className="hero-title">El control absoluto de tu stock, <span className="text-gradient">simplificado.</span></h1>
              <p className="hero-description">
                Stockpile revoluciona la forma en que las empresas gestionan, rastrean y optimizan sus inventarios. Diseñado con precisión para ofrecer control en tiempo real, análisis predictivo y una interfaz elegante que simplifica las tareas diarias.
              </p>

              {/* Glassmorphic Metrics wrapper for contrast */}
              <div className="hero-metrics-container">
                <div className="metrics-grid">
                  <div className="metric-card">
                    <div className="metric-icon purple">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div className="metric-info">
                      <span className="metric-value">99.9%</span>
                      <span className="metric-label">Precisión de Stock</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-icon blue">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                    </div>
                    <div className="metric-info">
                      <span className="metric-value">8.2k</span>
                      <span className="metric-label">SKUs Activos</span>
                    </div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-icon celeste">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    </div>
                    <div className="metric-info">
                      <span className="metric-value">-35%</span>
                      <span className="metric-label">Costos de Almacenaje</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Social proof strip ── */}
            <div className="social-proof">
              <span className="social-proof-label">Confiado por empresas líderes</span>
              <div className="social-proof-logos">
                <span className="proof-logo-chip">TechCorp</span>
                <span className="proof-logo-chip">LogiMax</span>
                <span className="proof-logo-chip">Distribuidora Central</span>
                <span className="proof-logo-chip">Almacenes del Norte</span>
                <span className="proof-logo-chip">GrupoBex</span>
              </div>
              <div className="social-proof-testimonial">
                <p className="testimonial-text">"Stockpile redujo nuestros errores de inventario en un 90% en el primer mes. La interfaz es increíblemente clara."</p>
                <span className="testimonial-author">— Carlos M., Gerente de Operaciones · LogiMax</span>
              </div>
            </div>

            {/* Professional Feature Spotlight Strip */}
            <div className="feature-strip">
              <div className="feature-strip-tabs">
                {infoCards.map((item, i) => (
                  <button
                    key={i}
                    className={`feature-tab ${i === tickerIndex ? 'active' : ''}`}
                    onClick={() => setTickerIndex(i)}
                  >
                    <span className="feature-tab-emoji">{item.emoji}</span>
                    <span className="feature-tab-label">{item.label.split(' ').slice(0,2).join(' ')}</span>
                  </button>
                ))}
              </div>
              <div className="feature-strip-body" key={tickerIndex}>
                <div className="feature-strip-stat">
                  <span className="feature-strip-stat-value">{infoCards[tickerIndex].stat}</span>
                  <span className="feature-strip-stat-sep">—</span>
                  <span className="feature-strip-stat-label">{infoCards[tickerIndex].statLabel}</span>
                </div>
                <p className="feature-strip-desc">{infoCards[tickerIndex].desc}</p>
                <div className="feature-strip-progress">
                  <div
                    className="feature-strip-progress-bar"
                    style={{ animationDuration: '5000ms' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Full footer */}
            <footer className="hero-footer full-footer">
              <div className="footer-links">
                <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>Privacidad</a>
                <span className="footer-sep">·</span>
                <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>Términos</a>
                <span className="footer-sep">·</span>
                <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>Soporte</a>
                <span className="footer-sep">·</span>
                <a href="#" className="footer-link" onClick={(e) => e.preventDefault()}>Documentación</a>
              </div>
              <div className="footer-social">
                <a href="#" className="footer-social-icon" aria-label="LinkedIn" onClick={(e) => e.preventDefault()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
                <a href="#" className="footer-social-icon" aria-label="Twitter/X" onClick={(e) => e.preventDefault()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
                <a href="#" className="footer-social-icon" aria-label="GitHub" onClick={(e) => e.preventDefault()}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
                </a>
              </div>
              <p className="copyright-text">&copy; 2026 Stockpile Inc. Todos los derechos reservados.</p>
            </footer>
          </main>
        </>
      )}
    </div>
  );
}

export default App;
