const { useEffect, useMemo, useRef, useState } = React;

const FLAG_IMG = window.FDA_ASSETS?.FLAG || "/flag.png";
const EMBLEM_IMG = window.FDA_ASSETS?.EMBLEM || "/emblem.png";
const FDA_LOGO_IMG = window.FDA_ASSETS?.FDA_LOGO || "/fda_logo.png";
const HERO_BG_IMG = "/hero_bg.png";

const API_BASE = "";
const CARTO_BASEMAPS_API_KEY = window.SAFEWATCH_CARTO_BASEMAPS_API_KEY || "";
// Maharashtra's outer extent. It is deliberately shared by both Leaflet maps
// so neither map can pan or zoom out into the rest of India.
const MAHARASHTRA_MAP_BOUNDS = [[15.60, 72.60], [22.00, 80.90]];

function addBaseMap(map) {
  if (!CARTO_BASEMAPS_API_KEY) {
    console.error("CARTO basemaps API key is missing. Set CARTO_BASEMAPS_API_KEY in server/.env.");
    return;
  }

  L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key={apiKey}", {
    apiKey: CARTO_BASEMAPS_API_KEY,
    subdomains: "abcd",
    noWrap: true,
    maxZoom: 16,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  }).addTo(map);
}

const categories = [
  ["adulteration", "Adulteration", "AD"],
  ["expired_product", "Expired product", "EX"],
  ["unhygienic_premises", "Unhygienic premises", "HY"],
  ["mislabeling", "Mislabeling", "ML"],
  ["pest_contamination", "Pest contamination", "PC"],
  ["other", "Other", "OT"]
];

const statuses = [
  ["submitted", "Submitted"],
  ["under_review", "Under Review"],
  ["action_taken", "Action Taken"],
  ["resolved", "Resolved"],
  ["closed", "Closed"]
];

const submitSteps = [
  ["issue", "Issue Details"],
  ["location", "Location & Evidence"],
  ["contact", "Contact Info"],
  ["review", "Review"]
];

const actionTypes = [
  ["warning_issued", "Warning issued"],
  ["fine_imposed", "Fine imposed"],
  ["license_suspended", "License suspended"],
  ["sample_sent_to_lab", "Sample sent to lab"],
  ["no_violation_found", "No violation found"],
  ["other", "Other"]
];

const maharashtraDistricts = [
  "Ahmednagar",
  "Akola",
  "Amravati",
  "Aurangabad",
  "Beed",
  "Bhandara",
  "Buldhana",
  "Chandrapur",
  "Dhule",
  "Gadchiroli",
  "Gondia",
  "Hingoli",
  "Jalgaon",
  "Jalna",
  "Kolhapur",
  "Latur",
  "Mumbai City",
  "Mumbai Suburban",
  "Nagpur",
  "Nanded",
  "Nandurbar",
  "Nashik",
  "Osmanabad",
  "Palghar",
  "Parbhani",
  "Pune",
  "Raigad",
  "Ratnagiri",
  "Sangli",
  "Satara",
  "Sindhudurg",
  "Solapur",
  "Thane",
  "Wardha",
  "Washim",
  "Yavatmal"
];

const districtCoords = {
  "Ahmednagar": { lat: 19.0948, lng: 74.7480, zoom: 9 },
  "Akola": { lat: 20.7002, lng: 77.0082, zoom: 10 },
  "Amravati": { lat: 20.9320, lng: 77.7523, zoom: 10 },
  "Aurangabad": { lat: 19.8762, lng: 75.3433, zoom: 10 },
  "Beed": { lat: 18.9891, lng: 75.7601, zoom: 10 },
  "Bhandara": { lat: 21.1669, lng: 79.6504, zoom: 10 },
  "Buldhana": { lat: 20.5293, lng: 76.1842, zoom: 10 },
  "Chandrapur": { lat: 19.9500, lng: 79.2961, zoom: 10 },
  "Dhule": { lat: 20.9042, lng: 74.7749, zoom: 10 },
  "Gadchiroli": { lat: 20.1826, lng: 80.0000, zoom: 9 },
  "Gondia": { lat: 21.4550, lng: 80.1920, zoom: 10 },
  "Hingoli": { lat: 19.7173, lng: 77.1470, zoom: 10 },
  "Jalgaon": { lat: 21.0077, lng: 75.5626, zoom: 10 },
  "Jalna": { lat: 19.8347, lng: 75.8816, zoom: 10 },
  "Kolhapur": { lat: 16.7050, lng: 74.2433, zoom: 10 },
  "Latur": { lat: 18.3968, lng: 76.5604, zoom: 10 },
  "Mumbai City": { lat: 18.9388, lng: 72.8354, zoom: 12 },
  "Mumbai Suburban": { lat: 19.1136, lng: 72.8697, zoom: 12 },
  "Nagpur": { lat: 21.1458, lng: 79.0882, zoom: 10 },
  "Nanded": { lat: 19.1383, lng: 77.3210, zoom: 10 },
  "Nandurbar": { lat: 21.3670, lng: 74.2390, zoom: 10 },
  "Nashik": { lat: 20.0000, lng: 73.7800, zoom: 10 },
  "Osmanabad": { lat: 18.1860, lng: 76.0400, zoom: 10 },
  "Palghar": { lat: 19.6967, lng: 72.7651, zoom: 10 },
  "Parbhani": { lat: 19.2609, lng: 76.7748, zoom: 10 },
  "Pune": { lat: 18.5204, lng: 73.8567, zoom: 10 },
  "Raigad": { lat: 18.4928, lng: 73.1381, zoom: 10 },
  "Ratnagiri": { lat: 16.9944, lng: 73.3000, zoom: 10 },
  "Sangli": { lat: 16.8524, lng: 74.5815, zoom: 10 },
  "Satara": { lat: 17.6805, lng: 74.0183, zoom: 10 },
  "Sindhudurg": { lat: 16.3500, lng: 73.7500, zoom: 10 },
  "Solapur": { lat: 17.6599, lng: 75.9064, zoom: 10 },
  "Thane": { lat: 19.2183, lng: 72.9781, zoom: 11 },
  "Wardha": { lat: 20.7453, lng: 78.6022, zoom: 10 },
  "Washim": { lat: 20.1121, lng: 77.1337, zoom: 10 },
  "Yavatmal": { lat: 20.3899, lng: 78.1307, zoom: 10 }
};

const maharashtraTalukas = {
  "Ahmednagar": ["Ahmednagar", "Shrirampur", "Nevasa", "Rahuri", "Shrigonda", "Karjat", "Jamkhed", "Pathardi", "Parner", "Sangamner", "Kopargaon", "Akole", "Rahata", "Newasa"],
  "Akola": ["Akola", "Akot", "Telhara", "Balapur", "Patur", "Murtizapur", "Barshitakli"],
  "Amravati": ["Amravati", "Achalpur", "Morshi", "Warud", "Daryapur", "Anjangaon Surji", "Chandur Railway", "Chandur Bazar", "Nandgaon-Khandeshwar", "Dhamangaon Railway", "Chikhaldara", "Bhatkuli", "Dharni", "Tiosa"],
  "Aurangabad": ["Aurangabad", "Khuldabad", "Kannad", "Sillod", "Phulambri", "Soegaon", "Paithan", "Gangapur", "Vaijapur"],
  "Beed": ["Beed", "Kaij", "Georai", "Majalgaon", "Parli", "Ambajogai", "Dharur", "Patoda", "Shirur Kasar", "Ashti", "Wadwani"],
  "Bhandara": ["Bhandara", "Tumsar", "Pauni", "Mohadi", "Sakoli", "Lakhani", "Lakhandur"],
  "Buldhana": ["Buldhana", "Chikhli", "Deulgaon Raja", "Jalgaon Jamod", "Khamgaon", "Lonar", "Malkapur", "Mehkar", "Motala", "Nandura", "Sangrampur", "Shegaon", "Sindkhed Raja"],
  "Chandrapur": ["Chandrapur", "Ballarpur", "Bhadravati", "Warora", "Chimur", "Nagbhid", "Brahmapuri", "Sindewahi", "Mul", "Gondpipri", "Pombhurna", "Saoli", "Rajura", "Korpana", "Jiwati"],
  "Dhule": ["Dhule", "Sakri", "Shirpur", "Sindkheda"],
  "Gadchiroli": ["Gadchiroli", "Chamorshi", "Aheri", "Etapalli", "Dhanora", "Armori", "Kurkheda", "Korchi", "Desaiganj", "Sironcha", "Mulchera", "Bhamragad"],
  "Gondia": ["Gondia", "Tirora", "Goregaon", "Arjuni Morgaon", "Amgaon", "Deori", "Salekasa", "Sadak Arjuni"],
  "Hingoli": ["Hingoli", "Sengaon", "Kalamnuri", "Basmath", "Aundha Nagnath"],
  "Jalgaon": ["Jalgaon", "Bhusawal", "Chalisgaon", "Amalner", "Erandol", "Dharangaon", "Pachora", "Bhadgaon", "Parola", "Chopda", "Raver", "Yawal", "Muktainagar", "Bodwad", "Jamner"],
  "Jalna": ["Jalna", "Bhokardan", "Jafrabad", "Ambad", "Badnapur", "Ghansawangi", "Partur", "Mantha"],
  "Kolhapur": ["Kolhapur", "Karveer", "Panhala", "Shahuwadi", "Kagal", "Hatkanangle", "Shirol", "Radhanagari", "Gadhinglaj", "Chandgad", "Ajra", "Bhudargad", "Bavda"],
  "Latur": ["Latur", "Ausa", "Nilanga", "Udgir", "Chakur", "Deoni", "Jalkot", "Ahmedpur", "Shirur Anantpal", "Renapur"],
  "Mumbai City": ["Mumbai City"],
  "Mumbai Suburban": ["Andheri", "Bandra", "Borivali", "Kurla"],
  "Nagpur": ["Nagpur City", "Nagpur Rural", "Kamptee", "Hingna", "Katol", "Narkhed", "Savner", "Kalmeshwar", "Parseoni", "Umred", "Kuhi", "Bhiwapur", "Ramtek", "Mouda"],
  "Nanded": ["Nanded", "Ardhapur", "Mudkhed", "Bhokar", "Umri", "Loha", "Kandhar", "Kinwat", "Hadgaon", "Himayatnagar", "Deglur", "Mukhed", "Dharmabad", "Biloli", "Naigaon", "Mahoor"],
  "Nandurbar": ["Nandurbar", "Shahada", "Taloda", "Akkalkuwa", "Akrani", "Nawapur"],
  "Nashik": ["Nashik", "Malegaon", "Niphad", "Sinnar", "Igatpuri", "Dindori", "Peint", "Trimbakeshwar", "Kalwan", "Deola", "Surgana", "Baglan", "Chandwad", "Nandgaon", "Yeola"],
  "Osmanabad": ["Osmanabad", "Tuljapur", "Umarga", "Paranda", "Bhoom", "Kalamb", "Washi", "Lohara"],
  "Palghar": ["Palghar", "Vasai", "Dahanu", "Talasari", "Jawhar", "Mokhada", "Vikramgad", "Wada"],
  "Parbhani": ["Parbhani", "Jintur", "Gangakhed", "Pathri", "Purna", "Manwath", "Palam", "Sonpeth", "Selu"],
  "Pune": ["Haveli", "Pune City", "Maval", "Mulshi", "Shirur", "Baramati", "Khed", "Junnar", "Ambegaon", "Bhor", "Velhe", "Purandar", "Indapur", "Daund"],
  "Raigad": ["Panvel", "Alibag", "Pen", "Karjat", "Khopoli", "Uran", "Mahad", "Mangaon", "Roha", "Sudhagad", "Murud", "Shrivardhan", "Mhasla", "Tala", "Poladpur"],
  "Ratnagiri": ["Ratnagiri", "Chiplun", "Guhagar", "Dapoli", "Khed", "Mandangad", "Sangameshwar", "Lanja", "Rajapur"],
  "Sangli": ["Sangli", "Miraj", "Tasgaon", "Walwa", "Shirala", "Palus", "Kadegaon", "Khanapur", "Atpadi", "Jat"],
  "Satara": ["Satara", "Karad", "Wai", "Mahabaleshwar", "Patan", "Jawali", "Khandala", "Koregaon", "Phaltan", "Man", "Khatav"],
  "Sindhudurg": ["Sindhudurg", "Kudal", "Malwan", "Devgad", "Kankavli", "Sawantwadi", "Vengurla", "Dodamarg"],
  "Solapur": ["Solapur North", "Solapur South", "Akkalkot", "Barshi", "Mohol", "Mangalwedha", "Madha", "Karmala", "Pandharpur", "Malshiras", "Sangola"],
  "Thane": ["Thane", "Kalyan", "Bhiwandi", "Ulhasnagar", "Ambernath", "Shahapur", "Murbad"],
  "Wardha": ["Wardha", "Deoli", "Hinganghat", "Arvi", "Seloo", "Ashti", "Karanja", "Samudrapur"],
  "Washim": ["Washim", "Malegaon", "Risod", "Mangrulpir", "Karanja", "Manora"],
  "Yavatmal": ["Yavatmal", "Arni", "Babhulgaon", "Darwha", "Digras", "Ghatanji", "Kalamb", "Kelapur", "Mahagaon", "Maregaon", "Ner", "Pusad", "Ralegaon", "Umarkhed", "Wani", "Zari-Jamani"]
};

const statusExplainers = {
  submitted: "Complaint received and registered with a tracking code.",
  under_review: "District office is checking vendor, location, and evidence.",
  action_taken: "Inspection or regulatory action has been logged.",
  resolved: "The issue has reached a final public-safe outcome.",
  closed: "The case has been closed after review."
};

function pretty(value) {
  return categories.find(([key]) => key === value)?.[1] || statuses.find(([key]) => key === value)?.[1] || value;
}

function categoryMeta(value) {
  return categories.find(([key]) => key === value) || ["other", "Other", "OT"];
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{pretty(status)}</span>;
}

function IconMark({ children, className = "" }) {
  return <span className={`icon-mark ${className}`} aria-hidden="true">{children}</span>;
}

async function api(path, options = {}) {
  const officerToken = localStorage.getItem("safewatch_token");
  const userToken = localStorage.getItem("safewatch_user_token");
  const token = officerToken || userToken;
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function readPageFromHash() {
  const raw = window.location.hash.replace(/^#\/?/, "").toLowerCase();
  if (!raw || raw === "home") return "home";
  if (raw === "admin") return "admin";
  if (["submit", "track", "history", "login", "register"].includes(raw)) return raw;
  return "home";
}

function App() {
  const [page, setPage] = useState(readPageFromHash);
  const [officer, setOfficer] = useState(() => JSON.parse(localStorage.getItem("safewatch_officer") || "null"));
  const [citizen, setCitizen] = useState(() => JSON.parse(localStorage.getItem("safewatch_user") || "null"));
  const [loginRedirect, setLoginRedirect] = useState("home");
  const [navOpen, setNavOpen] = useState(false);
  // Track the page user was on before going to login — updated synchronously
  const prevPageRef = useRef("home");

  useEffect(() => {
    const syncPage = () => setPage(readPageFromHash());
    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);

  // A hash navigation preserves the scroll position of the previous view. Reset
  // it before showing a new screen so fixed-height views (such as Admin) cannot
  // render with their header clipped above the viewport.
  useEffect(() => {
    // Use the two-argument form: unlike the options form it is supported by
    // every browser used by this project and always resets both axes.
    window.scrollTo(0, 0);
  }, [page]);

  function navigate(target, options = {}) {
    setNavOpen(false);

    // Redirect unauthenticated users trying to access protected pages to login
    if (target === "submit" && !citizen) {
      prevPageRef.current = page; // remember where they came from
      setLoginRedirect(options.redirect || "submit");
      window.location.hash = "login";
      setPage("login");
      return;
    }

    // When explicitly going to login or register, remember the current page
    if ((target === "login" || target === "register") && page !== "login" && page !== "register") {
      prevPageRef.current = page;
      setLoginRedirect(page);
    }

    if (target === "home") {
      window.location.hash = "";
      setPage("home");
      return;
    }

    window.location.hash = target;
    setPage(target);
  }

  function logout() {
    localStorage.removeItem("safewatch_token");
    localStorage.removeItem("safewatch_officer");
    localStorage.removeItem("safewatch_user");
    localStorage.removeItem("safewatch_user_token");
    setOfficer(null);
    setCitizen(null);
    navigate("home");
  }

  // Bypasses the citizen guard in navigate() — used by Login after successful auth
  // so that stale citizen closure doesn’t redirect back to login page.
  function forceNavigate(target) {
    const dest = target || "home";
    if (dest === "home") {
      window.location.hash = "";
      setPage("home");
    } else {
      window.location.hash = dest;
      setPage(dest);
    }
  }

  if (page === "admin" && officer) {
    return (
      <main className="admin-shell">
        <Dashboard officer={officer} setPage={navigate} onLogout={logout} />
      </main>
    );
  }

  if (page === "admin" && !officer) {
    return (
      <div className="admin-portal-shell">
        <header className="admin-white-header">
          <div className="admin-white-header-inner">
            <div className="admin-white-header-left" onClick={() => navigate("home")}>
              <img
                src={EMBLEM_IMG}
                alt="National Emblem of India"
                className="national-emblem"
                onError={(e) => { e.target.onerror = null; e.target.src = "/emblem.png"; }}
              />
              <img
                src={FDA_LOGO_IMG}
                alt="FDA Maharashtra Logo"
                className="fssai-logo"
                onError={(e) => { e.target.onerror = null; e.target.src = "/fda_logo.png"; }}
              />
              <div className="brand-titles">
                <h1 className="brand-main-title">FDA SafeWatch</h1>
                <p className="brand-sub-title">Food Safety Complaint & Action Tracking Platform - Maharashtra</p>
              </div>
            </div>

            <div className="admin-white-header-right">
              <div className="admin-header-motto">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Towards Safe Food, Healthier Maharashtra</span>
              </div>
              <button 
                type="button" 
                className="btn-admin-header-back"
                onClick={() => navigate("home")}
              >
                &larr; Public Portal
              </button>
            </div>
          </div>
        </header>

        <AdminLogin setOfficer={setOfficer} setPage={navigate} />
      </div>
    );
  }

  return (
    <>
      <header className="site-header-wrap">
        {/* Main Brand & Logo Section */}
        <div className="brand-header-bar">
          <div className="brand-header-container">
            <div className="brand-header-left">
              <img
                src={EMBLEM_IMG}
                alt="Emblem of India"
                className="national-emblem"
                onError={(e) => { e.target.onerror = null; e.target.src = "/emblem.png"; }}
              />
              <div className="brand-titles" onClick={() => navigate("home")} style={{ cursor: "pointer" }}>
                <h1 className="brand-main-title">FDA SafeWatch</h1>
                <p className="brand-sub-title">Food Safety Complaint & Action Tracking Platform - Maharashtra</p>
                <p className="brand-tagline">A step towards Safe Food, Healthier Maharashtra</p>
              </div>
            </div>

            <div className="brand-header-right">
              <img
                src={FDA_LOGO_IMG}
                alt="FDA Maharashtra Logo"
                className="fssai-logo"
                onError={(e) => { e.target.onerror = null; e.target.src = "/fda_logo.png"; }}
              />
              <button 
                type="button" 
                className="btn-admin-login-brand"
                onClick={() => navigate("admin")} 
              >
                🏛️ Admin Login
              </button>
            </div>
          </div>
        </div>

        {/* Primary Navigation Bar */}
        <div className="nav-bar-container">
          <div className="nav-bar-inner">
            <button
              type="button"
              className="nav-toggle"
              aria-expanded={navOpen}
              aria-controls="primary-nav"
              onClick={() => setNavOpen((open) => !open)}
            >
              Menu ☰
            </button>
            <nav id="primary-nav" className={navOpen ? "open" : ""} aria-label="Primary navigation">
              <button className={`nav-link-item ${page === "home" ? "active" : ""}`} onClick={() => navigate("home")}>
                <span className="nav-icon">🏠</span> Home
              </button>
              <button className={`nav-link-item ${page === "submit" ? "active" : ""}`} onClick={() => navigate("submit")}>
                <span className="nav-icon">📝</span> Submit Complaint
              </button>
              <button className={`nav-link-item ${page === "track" ? "active" : ""}`} onClick={() => navigate("track")}>
                <span className="nav-icon">🔍</span> Track Complaint
              </button>
              <button className={`nav-link-item ${page === "history" ? "active" : ""}`} onClick={() => navigate("history")}>
                <span className="nav-icon">📊</span> Transparency Register
              </button>
              <button className="nav-link-item" onClick={() => { navigate("home"); setTimeout(() => document.querySelector('.portal-info-section')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>
                <span className="nav-icon">📜</span> Food Safety Information
              </button>

              {!citizen ? (
                <div className="nav-auth-buttons">
                  <button className="btn-portal-login" onClick={() => navigate("login")}>Login</button>
                  <button className="btn-portal-register" onClick={() => navigate("register")}>Register</button>
                </div>
              ) : (
                <div className="user-menu">
                  <span className="welcome-text">Welcome, {citizen.name}</span>
                  <button className="btn-logout" onClick={logout}>Logout</button>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="main-content-area">
        {page === "home" && <Home navigate={navigate} citizen={citizen} />}
        {page === "admin" && !officer && <AdminLogin setOfficer={setOfficer} setPage={navigate} />}
        {page === "submit" && (
          citizen ? (
            <SubmitComplaint navigate={navigate} citizen={citizen} />
          ) : (
            <Login
              mode="login"
              loginRedirect={loginRedirect}
              setCitizen={setCitizen}
              setOfficer={setOfficer}
              navigate={navigate}
              forceNavigate={forceNavigate}
            />
          )
        )}
        {page === "track" && <TrackComplaint citizen={citizen} navigate={navigate} />}
        {page === "history" && (
          citizen ? (
            <MyHistory citizen={citizen} navigate={navigate} />
          ) : (
            <Login
              mode="login"
              loginRedirect="history"
              setCitizen={setCitizen}
              setOfficer={setOfficer}
              navigate={navigate}
              forceNavigate={forceNavigate}
            />
          )
        )}
        {(page === "login" || page === "register") && (
          <Login
            mode={page === "register" ? "register" : "login"}
            loginRedirect={loginRedirect}
            setCitizen={setCitizen}
            setOfficer={setOfficer}
            navigate={navigate}
            forceNavigate={forceNavigate}
          />
        )}
      </main>

      {page !== "login" && page !== "register" && page !== "admin" && (
        <footer className="site-portal-footer">
          <div className="footer-container">
            <div className="footer-col">
              <h4>FDA SafeWatch - Maharashtra State</h4>
              <p>
                Food and Drug Administration, Maharashtra State (अन्न व औषध प्रशासन, महाराष्ट्र राज्य).
                Official platform for citizen complaint submission, automated duplicate checking, and public action tracking.
              </p>
            </div>
            <div className="footer-col">
              <h4>Quick Links</h4>
              <ul>
                <li><a href="#home" onClick={() => navigate("home")}>Home Desk</a></li>
                <li><a href="#submit" onClick={() => navigate("submit")}>Submit Complaint</a></li>
                <li><a href="#track" onClick={() => navigate("track")}>Track Complaint</a></li>
                <li><a href="#history" onClick={() => navigate("history")}>Transparency Register</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Helpline & Info</h4>
              <p><strong>Toll Free:</strong> 1800-222-365</p>
              <p><strong>Emergency:</strong> 112</p>
              <p><strong>Email:</strong> support.fda@maharashtra.gov.in</p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Food and Drug Administration, Government of Maharashtra. All rights reserved.</span>
            <span>Designed & Maintained for Public Health Transparency</span>
          </div>
        </footer>
      )}
    </>
  );
}

function Home({ navigate, citizen }) {
  return (
    <div className="home-portal-wrap">
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content-container">
          <div className="hero-left-box">
            <h1 className="hero-headline">
              Unsafe Food<br />
              Should Not Be on<br />
              Anyone's Plate
            </h1>
            <p className="hero-subheadline">
              Report food safety <span className="highlight-text">issues</span>. Track the action.<br />
              Help build a healthier Maharashtra.
            </p>
            <div className="accent-bar-trio">
              <span className="bar orange"></span>
              <span className="bar green"></span>
            </div>

            <div className="hero-features-trio">
              <div className="feature-item">
                <div className="feature-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                </div>
                <div>
                  <strong>Report</strong>
                  <span>Unsafe food practices</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <div>
                  <strong>Track</strong>
                  <span>Real-time status</span>
                </div>
              </div>

              <div className="feature-item">
                <div className="feature-icon-circle">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <strong>Ensure</strong>
                  <span>Safer food for all</span>
                </div>
              </div>
            </div>

            {!citizen && (
              <p className="hero-auth-alert">
                * Citizens must log in or register before submitting official food safety complaints in Maharashtra.
              </p>
            )}

            <div className="hero-actions-row">
              <button className="btn-hero-primary" onClick={() => navigate("submit")}>
                Submit a Complaint <span className="arrow-icon">→</span>
              </button>
              <button className="btn-hero-secondary" onClick={() => navigate("track")}>
                <span className="search-icon">🔍</span> Track Your Complaint
              </button>
            </div>
            
            <p className="hero-subtext-note">
              <span className="lock-icon">🔒</span> No app required. Report online or via SMS/WhatsApp.
            </p>
          </div>

          <div className="hero-right-card">
            <div className="card-glass-panel">
              <svg className="card-map-bg" viewBox="0 0 100 100" fill="none" stroke="#004b38" strokeWidth="1.2">
                <path d="M45 10 L58 15 L62 28 L78 32 L88 48 L82 64 L68 78 L52 88 L35 72 L22 62 L18 46 L28 32 Z" />
                <path d="M30 40 L50 45 L70 38 M40 60 L60 58" strokeDasharray="2 2" />
              </svg>
              <h3>Safe Food<br />Healthy Citizens<br />Stronger Maharashtra</h3>
              <div className="flag-stripe-mini">
                <span className="stripe-orange"></span>
                <span className="stripe-green"></span>
              </div>
              <p className="quote-text">
                "Food safety is everyone's responsibility."
              </p>
              <p className="quote-author">— FDA Maharashtra</p>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Summary Bar */}
      <section className="metrics-summary-bar">
        <div className="metrics-container">
          <div className="metric-box">
            <span className="metric-icon">📊</span>
            <div className="metric-data">
              <span className="metric-num">12,845</span>
              <span className="metric-label">Complaints Received</span>
            </div>
          </div>
          <div className="metric-box">
            <span className="metric-icon">🛡️</span>
            <div className="metric-data">
              <span className="metric-num">10,932</span>
              <span className="metric-label">Resolved</span>
            </div>
          </div>
          <div className="metric-box">
            <span className="metric-icon">🏛️</span>
            <div className="metric-data">
              <span className="metric-num">1,240</span>
              <span className="metric-label">Vendors Penalized</span>
            </div>
          </div>
          <div className="metric-box">
            <span className="metric-icon">🎯</span>
            <div className="metric-data">
              <span className="metric-num">98%</span>
              <span className="metric-label">Average Resolution Rate</span>
            </div>
          </div>
          <div className="metric-right-meta">
            <span>Last updated: 08 Sep 2026</span>
            <button className="btn-view-dash" onClick={() => navigate("history")}>View Dashboard →</button>
          </div>
        </div>
      </section>

      {/* Feature Information Cards Section */}
      <section className="portal-info-section">
        <div className="info-grid-container">
          <div className="info-card">
            <div className="info-card-header">
              <span className="info-badge">Duplicate Intelligence</span>
              <h2>Automated Complaint Verification</h2>
            </div>
            <p className="info-desc">
              Every newly submitted report is scanned against our duplicate-check registry before opening a case to ensure rapid officer action and prevent duplicate spam.
            </p>
            <ul className="info-list">
              <li><strong>License + Category Match:</strong> High-priority flag</li>
              <li><strong>Geo-location Proximity:</strong> 150m vendor area scan</li>
              <li><strong>Public Tracking Code:</strong> Assigned to every valid report</li>
            </ul>
          </div>

          <div className="info-card">
            <div className="info-card-header">
              <span className="info-badge">Action Tracking</span>
              <h2>Public Register & Redacted Logs</h2>
            </div>
            <p className="info-desc">
              FDA SafeWatch provides end-to-end transparency. Citizens track public-safe complaint progress while personal identity remains protected.
            </p>
            <div className="status-steps-mini">
              <div className="step-tag tag-submitted">Submitted</div>
              <span className="step-arrow">→</span>
              <div className="step-tag tag-review">Under Review</div>
              <span className="step-arrow">→</span>
              <div className="step-tag tag-action">Action Taken</div>
              <span className="step-arrow">→</span>
              <div className="step-tag tag-resolved">Resolved</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SubmitComplaint({ navigate, citizen }) {
  const [form, setForm] = useState({
    title: "",
    category: "adulteration",
    description: "",
    vendorName: "",
    fssaiNumber: "",
    address: "",
    district: "",
    taluka: "",
    lat: "",
    lng: "",
    complainantName: citizen?.name || "",
    complainantPhone: citizen?.phone || "",
    anonymous: false,
    emergency: false
  });
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  const qrRef = useRef(null);
  const qrScannerRef = useRef(null);

  function startQrScan() {
    setQrScanning(true);
    setTimeout(() => {
      if (!qrRef.current || typeof Html5Qrcode === "undefined") return;
      const scanner = new Html5Qrcode("qr-reader");
      qrScannerRef.current = scanner;
      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setField("vendorName", decodedText);
          scanner.stop().then(() => {
            setQrScanning(false);
            qrScannerRef.current = null;
          }).catch(console.error);
        },
        () => {}
      ).catch((err) => {
        console.error("QR Scanner error:", err);
        setQrScanning(false);
      });
    }, 100);
  }

  function stopQrScan() {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().then(() => {
        setQrScanning(false);
        qrScannerRef.current = null;
      }).catch(console.error);
    } else {
      setQrScanning(false);
    }
  }

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function geolocate() {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not available.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField("lat", pos.coords.latitude.toFixed(6));
        setField("lng", pos.coords.longitude.toFixed(6));
        setLocationStatus(`Location captured (${Math.round(pos.coords.accuracy)}m accuracy).`);
      },
      () => {
        setLocationStatus("Could not access location.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function submitComplaint(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setDuplicateInfo(null);
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    files.slice(0, 5).forEach((file) => body.append("evidence", file));

    try {
      const data = await api("/api/complaints", { method: "POST", body });
      setMessage(`Recorded. Tracking code: ${data.trackingCode}`);
      navigate("track");
    } catch (error) {
      if (error.duplicate || (error.message && error.message.toLowerCase().includes("duplicate complaint"))) {
        setDuplicateInfo({
          message: error.message || "Duplicate complaint cannot be allowed. A complaint for this issue/vendor has already been registered.",
          existingTrackingCode: error.existingTrackingCode || error.trackingCode || ""
        });
      } else {
        setMessage(error.message);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page form-page">

      <div className="report-container">
        <div className="report-header">
          <span className="icon">📋</span>
          <h2>Report a New Issue</h2>
        </div>

        {duplicateInfo && (
          <div style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: "10px", padding: "18px", margin: "0 0 20px 0", color: "#991b1b" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px", color: "#991b1b" }}>
              🚫 Duplicate Complaint Cannot Be Allowed
            </h3>
            <p style={{ margin: "0 0 14px 0", fontSize: "0.92rem", lineHeight: 1.5 }}>
              {duplicateInfo.message}
            </p>
            {duplicateInfo.existingTrackingCode && (
              <button 
                type="button" 
                style={{ background: "#dc2626", color: "white", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", fontSize: "0.85rem" }}
                onClick={() => navigate("track")}
              >
                🔍 Track Existing Complaint ({duplicateInfo.existingTrackingCode})
              </button>
            )}
          </div>
        )}
        
        <form className="report-form-single" onSubmit={submitComplaint}>
          <div className="field-group">
            <label>ISSUE TITLE</label>
            <input required value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="e.g. Adulterated milk sold at local store" />
          </div>

          <div className="field-row-2">
            <div className="field-group">
              <label>CATEGORY</label>
              <select value={form.category} onChange={(e) => setField("category", e.target.value)}>
                {categories.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>

              <div style={{ marginTop: "12px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--gov-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>VENDOR / BUSINESS NAME</label>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input required value={form.vendorName} onChange={(e) => setField("vendorName", e.target.value)} placeholder="Enter vendor name or scan QR" style={{ flex: 1 }} />
                  <button type="button" onClick={qrScanning ? stopQrScan : startQrScan} style={{ background: qrScanning ? "#ef4444" : "#0ea5e9", color: "white", border: "none", padding: "8px 14px", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "0.8rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                    {qrScanning ? "✕ Stop" : "📷 Scan QR"}
                  </button>
                </div>
                {qrScanning && (
                  <div style={{ marginTop: "10px", borderRadius: "8px", overflow: "hidden", border: "2px solid #0ea5e9" }}>
                    <div id="qr-reader" ref={qrRef} style={{ width: "100%" }}></div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: "12px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--gov-text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>FSSAI LICENSE NO. (Optional)</label>
                <input value={form.fssaiNumber} onChange={(e) => setField("fssaiNumber", e.target.value)} placeholder="e.g. 10020012345678" />
              </div>
            </div>

            <div className="field-group">
              <label>UPLOAD MEDIA</label>
              <div className="file-input-wrapper">
                <input type="file" id="media-upload" multiple accept="image/*,video/mp4" onChange={(e) => setFiles([...e.target.files].slice(0, 5))} />
                <label htmlFor="media-upload" className="file-button">Choose File</label>
                <span className="file-text">{files.length ? `${files.length} file(s) selected` : "No file chosen"}</span>
              </div>
              <div style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
                <label htmlFor="anon-check" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#334155", cursor: "pointer", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                  🕵️ Report Anonymously
                </label>
                <label className="toggle-switch" style={{ margin: 0 }}>
                  <input type="checkbox" id="anon-check" checked={form.anonymous} onChange={(e) => setField("anonymous", e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="field-group">
            <div className="desc-header">
              <label>DESCRIPTION</label>
              <button type="button" className="speak-btn">🎙️ SPEAK</button>
            </div>
            <textarea required value={form.description} onChange={(e) => setField("description", e.target.value)} placeholder="Describe the issue in detail..." rows="4" />
          </div>

          <div className="field-group">
            <label>ADDRESS / LOCATION</label>
            <input required value={form.address} onChange={(e) => setField("address", e.target.value)} placeholder="e.g. Shop No 12, MG Road, Panvel" />
          </div>

          <div className="field-row-2">
            <div className="field-group">
              <label>DISTRICT</label>
              <select value={form.district} onChange={(e) => { setField("district", e.target.value); setField("taluka", ""); }} required>
                <option value="">District</option>
                {maharashtraDistricts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>TALUKA</label>
              <select value={form.taluka} onChange={(e) => setField("taluka", e.target.value)} required disabled={!form.district}>
                <option value="">Select Taluka</option>
                {(maharashtraTalukas[form.district] || ["Headquarters", "Rural Area", "Other"]).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="field-group">
            <div className="desc-header">
              <label>MAP PINPOINT</label>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button type="button" className="speak-btn" onClick={geolocate}>📍 USE LIVE LOCATION</button>
                <span className="tap-hint">OR TAP MAP</span>
              </div>
            </div>
            <div className="map-container">
              <GoogleMapPicker
                lat={form.lat}
                lng={form.lng}
                district={form.district}
                taluka={form.taluka}
                onPick={({ lat, lng }) => {
                  setField("lat", lat.toFixed(6));
                  setField("lng", lng.toFixed(6));
                  setLocationStatus("Map location selected.");
                }}
              />
            </div>
            {locationStatus && <p className="map-note">{locationStatus}</p>}
          </div>

          <button type="submit" className="submit-report-btn" disabled={busy}>
            {busy ? "SUBMITTING..." : "SUBMIT REPORT"}
          </button>
          
          {message && <p className="notice">{message}</p>}
        </form>
      </div>
    </section>
  );
}

function GoogleMapPicker({ lat, lng, address, district, taluka, onPick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const boundsRef = useRef(null);       // L.latLngBounds for the selected district
  const boundsRectRef = useRef(null);   // visual rectangle overlay
  const [boundsWarning, setBoundsWarning] = useState("");

  // Validate if a latlng is inside allowed bounds
  function isInsideBounds(latlng) {
    if (!boundsRef.current) return true; // no district selected = allow anywhere
    return boundsRef.current.contains(latlng);
  }

  useEffect(() => {
    if (typeof L === "undefined" || !mapRef.current) return;
    if (mapInstance.current) return;

    const initialLat = Number(lat) || 18.5204;
    const initialLng = Number(lng) || 73.8567;

    const maharashtraBounds = L.latLngBounds(MAHARASHTRA_MAP_BOUNDS);

    const map = L.map(mapRef.current, {
      maxBounds: maharashtraBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 8,
      maxZoom: 16
    }).setView([initialLat, initialLng], 12);

    addBaseMap(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);

    map.on('click', (e) => {
      if (!isInsideBounds(e.latlng)) {
        setBoundsWarning("\u26a0\ufe0f You can only place the pin inside the selected district/taluka area.");
        setTimeout(() => setBoundsWarning(""), 3000);
        return;
      }
      setBoundsWarning("");
      marker.setLatLng(e.latlng);
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      if (!isInsideBounds(position)) {
        setBoundsWarning("\u26a0\ufe0f Pin dragged outside the selected area. Moving back.");
        // Move marker back to center of bounds
        if (boundsRef.current) {
          const center = boundsRef.current.getCenter();
          marker.setLatLng(center);
          onPick({ lat: center.lat, lng: center.lng });
        }
        setTimeout(() => setBoundsWarning(""), 3000);
        return;
      }
      setBoundsWarning("");
      onPick({ lat: position.lat, lng: position.lng });
    });

    mapInstance.current = map;
    markerInstance.current = marker;
  }, []);

  // Handle explicit lat/lng updates from props
  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current || !lat || !lng) return;
    const currentPos = markerInstance.current.getLatLng();
    if (Math.abs(currentPos.lat - Number(lat)) < 0.0001 && Math.abs(currentPos.lng - Number(lng)) < 0.0001) return;
    const position = [Number(lat), Number(lng)];
    mapInstance.current.setView(position);
    markerInstance.current.setLatLng(position);
  }, [lat, lng]);

  // Auto-zoom + set bounds restriction when district/taluka changes
  useEffect(() => {
    if (!mapInstance.current) return;

    // Clear previous bounds rectangle
    if (boundsRectRef.current) {
      mapInstance.current.removeLayer(boundsRectRef.current);
      boundsRectRef.current = null;
    }

    if (!district) {
      boundsRef.current = null;
      return;
    }

    const coords = districtCoords[district];
    if (!coords) return;

    // Immediately zoom to district center
    const zoomLevel = taluka ? 13 : coords.zoom;
    mapInstance.current.flyTo([coords.lat, coords.lng], zoomLevel, { duration: 1.0 });

    // Fetch precise bounding box from geocode proxy
    const locationQuery = taluka
      ? `${taluka}, ${district}, Maharashtra, India`
      : `${district}, Maharashtra, India`;

    const fetchBounds = async () => {
      try {
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(locationQuery)}`);
        const data = await response.json();
        if (data && data.length > 0 && data[0].boundingbox) {
          const bb = data[0].boundingbox;
          const sw = L.latLng(parseFloat(bb[0]), parseFloat(bb[2]));
          const ne = L.latLng(parseFloat(bb[1]), parseFloat(bb[3]));
          const bounds = L.latLngBounds(sw, ne);
          boundsRef.current = bounds;

          // Draw a subtle rectangle to show allowed area
          if (boundsRectRef.current) {
            mapInstance.current.removeLayer(boundsRectRef.current);
          }
          boundsRectRef.current = L.rectangle(bounds, {
            color: "#0ea5e9", weight: 2, fillColor: "#0ea5e9", fillOpacity: 0.05,
            dashArray: "6 4", interactive: false
          }).addTo(mapInstance.current);

          // Fit map to the bounds
          mapInstance.current.flyToBounds(bounds, { duration: 1.0, padding: [20, 20] });

          // Move marker to center of bounds
          const center = bounds.getCenter();
          markerInstance.current.setLatLng(center);
          onPick({ lat: center.lat, lng: center.lng });
        }
      } catch (err) {
        // fallback: use approximate bounds around district center (0.5 degree box)
        const approxBounds = L.latLngBounds(
          L.latLng(coords.lat - 0.5, coords.lng - 0.5),
          L.latLng(coords.lat + 0.5, coords.lng + 0.5)
        );
        boundsRef.current = approxBounds;
      }
    };
    setTimeout(fetchBounds, 150);
  }, [district, taluka]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div className="map-canvas" ref={mapRef} style={{ width: "100%", height: "100%" }}></div>
      {boundsWarning && (
        <div style={{ position: "absolute", bottom: "10px", left: "10px", right: "10px", background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "700", zIndex: 1000, textAlign: "center" }}>
          {boundsWarning}
        </div>
      )}
      {district && (
        <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(14, 165, 233, 0.9)", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700", zIndex: 1000 }}>
          📍 Restricted to: {taluka ? `${taluka}, ${district}` : district}
        </div>
      )}
    </div>
  );
}

function MyHistory({ citizen, navigate }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await api("/api/complaints/history");
        setComplaints(data);
      } catch (err) {
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <section className="page history-page">
      <div className="portal-page-header">
        <div>
          <h1>Transparency Register & History</h1>
          <p>View all complaints logged under your profile and monitor official resolution stages.</p>
        </div>
        <span className="portal-page-badge">Registered Citizen Records</span>
      </div>

      <div className="report-container" style={{ maxWidth: "900px" }}>
        <div className="report-header" style={{ marginBottom: "24px" }}>
          <span className="icon">📚</span>
          <h2>My Reported Issues History</h2>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading your complaint history...</p>
        ) : error ? (
          <p className="notice">{error}</p>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1" }}>
            <p style={{ fontSize: "1.1rem", color: "#475569", margin: "0 0 16px 0" }}>You haven't reported any food safety issues yet.</p>
            <button className="submit-report-btn" style={{ display: "inline-block", width: "auto", padding: "12px 24px" }} onClick={() => navigate("submit")}>
              REPORT AN ISSUE
            </button>
          </div>
        ) : (
          <div className="history-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {complaints.map((c) => (
              <div key={c._id || c.trackingCode} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: "0.9rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "4px 8px", borderRadius: "4px" }}>
                      {c.trackingCode}
                    </span>
                    <h3 style={{ margin: "8px 0 4px 0", fontSize: "1.15rem", color: "#0f172a" }}>{c.description || "Food Safety Complaint"}</h3>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>Vendor: <strong>{c.vendorName}</strong> | Location: {c.address}, {c.district}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid #f1f5f9", fontSize: "0.85rem", color: "#94a3b8" }}>
                  <span>Reported on: {new Date(c.createdAt).toLocaleDateString()}</span>
                  <span>Upvotes: ❤️ {c.upvotes || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TrackComplaint({ citizen, navigate }) {
  const [code, setCode] = useState("");
  const [searchedComplaint, setSearchedComplaint] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [publicFeed, setPublicFeed] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [activeTab, setActiveTab] = useState("feed"); // 'feed' | 'search'

  useEffect(() => {
    loadPublicFeed();
  }, []);

  async function loadPublicFeed() {
    try {
      setLoadingFeed(true);
      const data = await api("/api/complaints/public");
      setPublicFeed(data);
    } catch (err) {
      console.error("Failed to load feed", err);
    } finally {
      setLoadingFeed(false);
    }
  }

  async function handleVote(complaintId) {
    if (!citizen) {
      if (confirm("You must be logged in to vote on issues. Would you like to log in now?")) {
        navigate("login");
      }
      return;
    }

    try {
      const updated = await api(`/api/complaints/${complaintId}/vote`, { method: "POST" });
      
      setPublicFeed((prev) => prev.map((item) => item._id === complaintId ? updated : item));
      if (searchedComplaint && searchedComplaint._id === complaintId) {
        setSearchedComplaint(updated);
      }
    } catch (err) {
      alert(err.message || "Failed to submit vote");
    }
  }

  async function track(event) {
    event.preventDefault();
    setSearchMessage("");
    setSearchedComplaint(null);
    if (!code.trim()) return;

    try {
      const res = await api(`/api/complaints/track/${code.trim().toUpperCase()}`);
      setSearchedComplaint(res);
    } catch (error) {
      setSearchMessage(error.message || "No complaint found with this code");
    }
  }

  return (
    <section className="page track-page">

      <div className="report-container" style={{ maxWidth: "950px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "1.8rem", color: "#0f172a", margin: "0 0 8px 0" }}>Public Food Safety Tracker & Feed</h2>
          <p style={{ color: "#64748b", margin: 0 }}>Browse issues reported by citizens across districts, support reports by voting, or look up a specific tracking code.</p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginBottom: "28px" }}>
          <button 
            style={{ padding: "10px 24px", borderRadius: "8px", border: "none", fontWeight: 700, cursor: "pointer", background: activeTab === "feed" ? "#0f172a" : "#e2e8f0", color: activeTab === "feed" ? "#ffffff" : "#475569" }}
            onClick={() => setActiveTab("feed")}
          >
            🔥 Public Feed & Top Voted
          </button>
          <button 
            style={{ padding: "10px 24px", borderRadius: "8px", border: "none", fontWeight: 700, cursor: "pointer", background: activeTab === "search" ? "#0f172a" : "#e2e8f0", color: activeTab === "search" ? "#ffffff" : "#475569" }}
            onClick={() => setActiveTab("search")}
          >
            🔍 Search by Tracking Code
          </button>
        </div>

        {activeTab === "search" ? (
          <div>
            <form className="track-form" onSubmit={track} style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
              <input 
                className="mono" 
                style={{ flex: 1, padding: "12px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "1rem" }}
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="Enter Tracking Code (e.g. FDA-2026-000001)" 
              />
              <button className="primary" style={{ padding: "12px 24px" }}><IconMark>TR</IconMark> Track</button>
            </form>
            {searchMessage && <p className="notice" style={{ color: "#ef4444", textStyle: "center" }}>{searchMessage}</p>}

            {searchedComplaint && (
              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "4px 10px", borderRadius: "6px" }}>
                      {searchedComplaint.trackingCode}
                    </span>
                    <h3 style={{ margin: "12px 0 4px 0", fontSize: "1.3rem" }}>{searchedComplaint.description}</h3>
                    <p style={{ color: "#64748b", margin: 0 }}>Vendor: <strong>{searchedComplaint.vendorName}</strong> ({searchedComplaint.address}, {searchedComplaint.district})</p>
                  </div>
                  <StatusBadge status={searchedComplaint.status} />
                </div>

                <div style={{ margin: "20px 0", padding: "16px", background: "#f8fafc", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#334155" }}>Timeline History</h4>
                  <ol className="timeline" style={{ margin: 0, paddingLeft: "20px" }}>
                    {searchedComplaint.statusHistory.map((entry, index) => (
                      <li key={`${entry.status}-${index}`} style={{ marginBottom: "8px" }}>
                        <strong>{pretty(entry.status)}</strong> - <time style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{new Date(entry.at).toLocaleString()}</time>
                        {entry.publicNote && <p style={{ margin: "4px 0 0 0", color: "#475569" }}>{entry.publicNote}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            {loadingFeed ? (
              <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading live public grievances...</p>
            ) : publicFeed.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No public reports found yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {publicFeed.map((item) => {
                  const hasVoted = citizen && item.voters && item.voters.includes(citizen.id || citizen._id);
                  return (
                    <div key={item._id || item.trackingCode} style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "20px", display: "flex", gap: "20px", alignItems: "flex-start", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                      {/* Voting Column */}
                      <button
                        type="button"
                        onClick={() => handleVote(item._id)}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "60px",
                          padding: "10px",
                          borderRadius: "10px",
                          border: hasVoted ? "2px solid #ef4444" : "1px solid #cbd5e1",
                          background: hasVoted ? "#fef2f2" : "#f8fafc",
                          color: hasVoted ? "#ef4444" : "#475569",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <span style={{ fontSize: "1.4rem" }}>▲</span>
                        <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{item.upvotes || 0}</span>
                        <span style={{ fontSize: "0.65rem", textTransform: "uppercase", fontWeight: 700, marginTop: "2px" }}>
                          {hasVoted ? "Voted" : "Vote"}
                        </span>
                      </button>

                      {/* Content Column */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.85rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}>
                            {item.trackingCode}
                          </span>
                          <StatusBadge status={item.status} />
                        </div>
                        <h3 style={{ margin: "4px 0 8px 0", fontSize: "1.15rem", color: "#0f172a" }}>{item.description || "Food Safety Complaint"}</h3>
                        <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "#475569" }}>
                          Vendor: <strong>{item.vendorName}</strong> ({item.address}, {item.district})
                        </p>
                        <div style={{ fontSize: "0.8rem", color: "#94a3b8", display: "flex", gap: "16px" }}>
                          <span>Category: {pretty(item.category)}</span>
                          <span>Posted: {new Date(item.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function GoogleIcon() {
  return (
    <svg className="google-icon" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  );
}

function IconMail() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconEye({ show }) {
  if (show) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function AuthIllustration({ mode }) {
  if (mode === "register") {
    return (
      <div className="auth-illustration-wrap">
        <svg viewBox="0 0 340 75" className="auth-illustration-svg" fill="none">
          <path d="M0 65 Q170 48 340 65 L340 75 L0 75 Z" fill="#dcfce7" opacity="0.6" />
          <rect x="25" y="38" width="55" height="26" rx="3" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
          <line x1="25" y1="48" x2="80" y2="48" stroke="#f97316" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="40" cy="35" r="9" fill="#22c55e" opacity="0.9" />
          <circle cx="54" cy="31" r="11" fill="#16a34a" opacity="0.95" />
          <path d="M58 36 L68 20 L73 36 Z" fill="#ea580c" />
          <rect x="92" y="28" width="16" height="36" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.4" />
          <rect x="95" y="23" width="10" height="5" rx="1" fill="#38bdf8" />
          <circle cx="120" cy="54" r="8" fill="#ef4444" />
          <circle cx="134" cy="56" r="7" fill="#f59e0b" />
        </svg>
        <span className="auth-cursive-tag">Healthy Food, Stronger Maharashtra</span>
      </div>
    );
  }

  return (
    <div className="auth-illustration-wrap">
      <svg viewBox="0 0 340 75" className="auth-illustration-svg" fill="none">
        <path d="M0 65 Q170 48 340 65 L340 75 L0 75 Z" fill="#dcfce7" opacity="0.6" />
        <path d="M55 65 V36 H65 V28 H105 V36 H115 V65 M75 65 V44 Q85 38 95 44 V65" stroke="#94a3b8" strokeWidth="1.4" fill="none" opacity="0.55" />
        <rect x="70" y="24" width="30" height="4" fill="#94a3b8" opacity="0.4" />
        <circle cx="140" cy="55" r="10" fill="#f59e0b" />
        <circle cx="155" cy="52" r="12" fill="#ef4444" />
        <rect x="174" y="36" width="14" height="28" rx="2.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.4" />
        <rect x="176" y="31" width="10" height="5" rx="1" fill="#38bdf8" />
        <circle cx="196" cy="55" r="10" fill="#22c55e" />
      </svg>
      <span className="auth-cursive-tag">Food Safety for a Better Tomorrow</span>
    </div>
  );
}

function Login({ mode, loginRedirect, setCitizen, setOfficer, navigate, forceNavigate }) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [resetRole, setResetRole] = useState("user");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(true);

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  useEffect(() => {
    document.body.classList.add("auth-no-scroll");
    return () => {
      document.body.classList.remove("auth-no-scroll");
    };
  }, []);

  // Safely redirect after auth success — bypasses the stale citizen closure
  // in navigate() which still sees citizen=null right after setCitizen() is called.
  function postAuthRedirect(redirectTarget) {
    const dest = redirectTarget || "home";
    if (forceNavigate) {
      forceNavigate(dest);
    } else {
      // Fallback: use hash change (triggers syncPage in App)
      window.location.hash = dest === "home" ? "" : dest;
    }
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (currentMode === "otp_request") {
      try {
        const res = await api("/api/auth/users/otp/request", { method: "POST", body: JSON.stringify({ emailOrPhone }) });
        setMessage(res.message || "OTP sent to your registered mobile number and email!");
        setCurrentMode("otp_verify");
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (currentMode === "otp_verify") {
      try {
        const data = await api("/api/auth/users/otp/verify", {
          method: "POST",
          body: JSON.stringify({ emailOrPhone, otp })
        });
        localStorage.setItem("safewatch_user", JSON.stringify(data.user));
        localStorage.setItem("safewatch_user_token", data.token);
        localStorage.removeItem("safewatch_token");
        localStorage.removeItem("safewatch_officer");
        setCitizen(data.user);
        postAuthRedirect(loginRedirect);
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (currentMode === "forgot_password_request") {
      try {
        const res = await api("/api/auth/users/forgot-password/request", { method: "POST", body: JSON.stringify({ emailOrPhone, role: resetRole }) });
        setMessage(res.message || "Password reset OTP sent to your registered mobile and email!");
        setCurrentMode("forgot_password_verify");
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (currentMode === "forgot_password_verify") {
      try {
        await api("/api/auth/users/forgot-password/verify", {
          method: "POST",
          body: JSON.stringify({ emailOrPhone, role: resetRole, otp, newPassword: password })
        });
        setMessage("Password reset successfully! You can now log in.");
        setCurrentMode(resetRole === "admin" ? "admin" : "login");
        setPassword("");
        setOtp("");
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (currentMode === "admin") {
      try {
        const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ phone: emailOrPhone, password }) });
        localStorage.setItem("safewatch_token", data.token);
        localStorage.setItem("safewatch_officer", JSON.stringify(data.officer));
        localStorage.removeItem("safewatch_user");
        localStorage.removeItem("safewatch_user_token");
        if (setOfficer) setOfficer(data.officer);
        navigate("admin");
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (currentMode === "register") {
      if (!agreedTerms) {
        setMessage("Please agree to the Terms & Conditions and Privacy Policy.");
        return;
      }
      try {
        const data = await api("/api/auth/users/register", {
          method: "POST",
          body: JSON.stringify({ name, email, phone, password })
        });
        localStorage.setItem("safewatch_user", JSON.stringify(data.user));
        localStorage.setItem("safewatch_user_token", data.token);
        localStorage.removeItem("safewatch_token");
        localStorage.removeItem("safewatch_officer");
        setCitizen(data.user);
        postAuthRedirect(loginRedirect);
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    try {
      const data = await api("/api/auth/users/login", {
        method: "POST",
        body: JSON.stringify({ emailOrPhone, password })
      });
      localStorage.setItem("safewatch_user", JSON.stringify(data.user));
      localStorage.setItem("safewatch_user_token", data.token);
      localStorage.removeItem("safewatch_token");
      localStorage.removeItem("safewatch_officer");
      setCitizen(data.user);
      postAuthRedirect(loginRedirect);
    } catch (error) {
      setMessage(error.message);
    }
  }

  const isRegister = currentMode === "register";

  return (
    <section className="page login-page">
      <div className="auth-split-wrapper">
        <div className="auth-split-container">
          
          {/* Left Column: Branding & Features matching reference mockup */}
          <div className="auth-left-brand">
            <div className="auth-badge-pill">
              {isRegister ? "Be a Part of Safer Maharashtra" : "Safe Food • Healthy People • Stronger Maharashtra"}
            </div>

            <h1 className="auth-brand-heading">
              {isRegister ? (
                <>Create<br /><span className="accent-green">Your Account</span></>
              ) : (
                <>Report.<br />Track.<br /><span className="accent-green">Ensure Safe Food.</span></>
              )}
            </h1>

            <p className="auth-brand-sub">
              {isRegister
                ? "Register to submit complaints, track progress and contribute towards safer food for everyone."
                : "Join FDA SafeWatch to report food safety issues and help us build a healthier Maharashtra."}
            </p>

            <div className="auth-features-list">
              {isRegister ? (
                <>
                  <div className="auth-feature-item">
                    <div className="auth-feature-icon-wrap" style={{ background: "#fff7ed", color: "#ea580c" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h4 className="auth-feature-title">Quick Registration</h4>
                      <p className="auth-feature-desc">Get started in minutes</p>
                    </div>
                  </div>

                  <div className="auth-feature-item">
                    <div className="auth-feature-icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h4 className="auth-feature-title">Secure & Trusted</h4>
                      <p className="auth-feature-desc">Your data is safe with us</p>
                    </div>
                  </div>

                  <div className="auth-feature-item">
                    <div className="auth-feature-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h4 className="auth-feature-title">Track Your Complaints</h4>
                      <p className="auth-feature-desc">Stay informed at every stage</p>
                    </div>
                  </div>

                  <div className="auth-feature-item">
                    <div className="auth-feature-icon-wrap" style={{ background: "#faf5ff", color: "#7c3aed" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h4 className="auth-feature-title">Make a Difference</h4>
                      <p className="auth-feature-desc">Help build a healthier Maharashtra</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-feature-item">
                    <div className="auth-feature-icon-wrap" style={{ background: "#ecfdf5", color: "#059669" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h4 className="auth-feature-title">Report Complaints</h4>
                      <p className="auth-feature-desc">Easily submit food safety issues</p>
                    </div>
                  </div>

                  <div className="auth-feature-item">
                    <div className="auth-feature-icon-wrap" style={{ background: "#eff6ff", color: "#2563eb" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h4 className="auth-feature-title">Track Progress</h4>
                      <p className="auth-feature-desc">Stay updated in real-time</p>
                    </div>
                  </div>

                  <div className="auth-feature-item">
                    <div className="auth-feature-icon-wrap" style={{ background: "#e0f2fe", color: "#003b6d" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h4 className="auth-feature-title">Transparent System</h4>
                      <p className="auth-feature-desc">Accountability at every step</p>
                    </div>
                  </div>

                  <div className="auth-feature-item">
                    <div className="auth-feature-icon-wrap" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                        <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                      </svg>
                    </div>
                    <div className="auth-feature-text">
                      <h4 className="auth-feature-title">Safer Maharashtra</h4>
                      <p className="auth-feature-desc">Better food for a healthier tomorrow</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <AuthIllustration mode={isRegister ? "register" : "login"} />
          </div>

          {/* Right Column: Form Card matching reference mockup */}
          <div className="swift-login-card">
            {isRegister ? (
              <>
                <div className="swift-title">
                  <span className="title-navy">Create </span>
                  <span className="title-green">Account</span>
                </div>
                <p className="swift-subtitle">Fill in your details to get started</p>
              </>
            ) : currentMode.startsWith("otp") ? (
              <>
                <div className="swift-title">
                  <span className="title-navy">OTP </span>
                  <span className="title-green">Login</span>
                </div>
                <p className="swift-subtitle">Secure login without a password</p>
              </>
            ) : currentMode.startsWith("forgot") ? (
              <>
                <div className="swift-title">
                  <span className="title-navy">Reset </span>
                  <span className="title-green">Password</span>
                </div>
                <p className="swift-subtitle">Recover access to your account</p>
              </>
            ) : (
              <>
                <div className="swift-title">
                  <span className="title-navy">Welcome </span>
                  <span className="title-green">Back</span>
                </div>
                <p className="swift-subtitle">Sign in to continue to FDA SafeWatch</p>
              </>
            )}

            <form className="swift-form" onSubmit={submit}>
              {(currentMode === "login" || currentMode === "admin") && (
                <>
                  <label className="swift-label">{currentMode === "admin" ? "Official Email address" : "Email address or Mobile number"}</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconMail /></span>
                    <input
                      className="swift-input swift-input-with-icon"
                      type={currentMode === "admin" ? "email" : "text"}
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="Enter your email or mobile number"
                      required
                    />
                  </div>
                  
                  <label className="swift-label">Password</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconLock /></span>
                    <input
                      className="swift-input swift-input-with-icon swift-input-with-eye"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      className="swift-input-eye"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <IconEye show={showPassword} />
                    </button>
                  </div>
                  
                  <div className="auth-row-between">
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="auth-link-green"
                      onClick={() => { setResetRole(currentMode === "admin" ? "admin" : "user"); setCurrentMode("forgot_password_request"); }}
                    >
                      Forgot Password?
                    </button>
                  </div>

                  <button className="swift-button auth-submit-btn">
                    <span>Login</span>
                    <span className="btn-arrow">→</span>
                  </button>

                  {currentMode === "login" && (
                    <>
                      <button type="button" className="swift-otp" onClick={() => setCurrentMode("otp_request")}>
                        📱 Login with Mobile / Email OTP
                      </button>
                      <div className="auth-footer-clean">
                        New to FDA SafeWatch? <button type="button" onClick={() => { setCurrentMode("register"); navigate("register"); }}>Register</button>
                      </div>
                    </>
                  )}
                </>
              )}

              {currentMode === "otp_request" && (
                <>
                  <label className="swift-label">Registered Mobile number or Email address</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconPhone /></span>
                    <input
                      className="swift-input swift-input-with-icon"
                      type="text"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      placeholder="Enter 10-digit mobile or email"
                      required
                    />
                  </div>
                  
                  <button className="swift-button auth-submit-btn">
                    <span>Send OTP</span>
                    <span className="btn-arrow">→</span>
                  </button>
                  <button type="button" className="swift-otp" onClick={() => setCurrentMode("login")}>Back to password login</button>
                </>
              )}

              {currentMode === "otp_verify" && (
                <>
                  <p style={{ fontSize: "0.82rem", color: "#475569", margin: "0 0 0.8rem 0" }}>
                    Enter the 6-digit OTP code sent to <strong>{emailOrPhone}</strong>:
                  </p>
                  <label className="swift-label">Enter 6-digit OTP</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconLock /></span>
                    <input className="swift-input swift-input-with-icon" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" required />
                  </div>
                  
                  <button className="swift-button auth-submit-btn">
                    <span>Verify & Login</span>
                    <span className="btn-arrow">→</span>
                  </button>
                  <button type="button" className="swift-otp" onClick={() => setCurrentMode("otp_request")}>Resend OTP</button>
                </>
              )}

              {currentMode === "forgot_password_request" && (
                <>
                  <label className="swift-label">Registered {resetRole === "admin" ? "Phone or Email" : "Email or Mobile"}</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconMail /></span>
                    <input className="swift-input swift-input-with-icon" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="Enter email or mobile" required />
                  </div>
                  
                  <button className="swift-button auth-submit-btn">
                    <span>Send Reset OTP</span>
                    <span className="btn-arrow">→</span>
                  </button>
                  <button type="button" className="swift-otp" onClick={() => setCurrentMode(resetRole === "admin" ? "admin" : "login")}>Back to login</button>
                </>
              )}

              {currentMode === "forgot_password_verify" && (
                <>
                  <label className="swift-label">Enter 6-digit Reset OTP</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconLock /></span>
                    <input className="swift-input swift-input-with-icon" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit reset OTP" required />
                  </div>

                  <label className="swift-label">New Password</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconLock /></span>
                    <input className="swift-input swift-input-with-icon" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" required />
                  </div>
                  
                  <button className="swift-button auth-submit-btn">
                    <span>Reset Password</span>
                    <span className="btn-arrow">→</span>
                  </button>
                  <button type="button" className="swift-otp" onClick={() => setCurrentMode("forgot_password_request")}>Resend OTP</button>
                </>
              )}

              {isRegister && (
                <>
                  <label className="swift-label">Full name</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconUser /></span>
                    <input
                      className="swift-input swift-input-with-icon"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <label className="swift-label">Email address</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconMail /></span>
                    <input
                      className="swift-input swift-input-with-icon"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <label className="swift-label">Mobile number</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconPhone /></span>
                    <input
                      className="swift-input swift-input-with-icon"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      required
                    />
                  </div>

                  <label className="swift-label">Password</label>
                  <div className="swift-input-wrap">
                    <span className="swift-input-icon"><IconLock /></span>
                    <input
                      className="swift-input swift-input-with-icon swift-input-with-eye"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password (min. 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      className="swift-input-eye"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <IconEye show={showPassword} />
                    </button>
                  </div>
                  
                  <div className="auth-terms-row">
                    <label className="auth-checkbox-label">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        required
                      />
                      <span>I agree to the <span className="terms-highlight">Terms & Conditions</span> and <span className="terms-highlight">Privacy Policy</span></span>
                    </label>
                  </div>

                  <button className="swift-button auth-submit-btn">
                    <span>Create Account</span>
                    <span className="btn-arrow">→</span>
                  </button>

                  <div className="auth-footer-clean">
                    Already registered? <button type="button" onClick={() => { setCurrentMode("login"); navigate("login"); }}>Login</button>
                  </div>
                </>
              )}
            </form>
            {message && <p className="notice" style={{marginTop: "0.65rem"}}>{message}</p>}
          </div>

        </div>
      </div>

    </section>
  );
}

function AdminLogin({ setOfficer, setPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("safewatch_token", data.token);
      localStorage.setItem("safewatch_officer", JSON.stringify(data.officer));
      localStorage.removeItem("safewatch_user");
      localStorage.removeItem("safewatch_user_token");
      setOfficer(data.officer);
    } catch (error) {
      setMessage(error.message || "Authentication failed. Verify your official credentials.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAdmin() {
    setEmail("fda@gmail.com");
    setPassword("Admin@12345");
    setMessage("");
  }

  return (
    <section className="admin-split-page">
      {/* Left Column: Official FDA Hero Branding */}
      <div className="admin-split-hero">
        <div className="admin-split-hero-content">
          <span className="admin-split-gov-badge">Government of Maharashtra</span>
          <h1 className="admin-split-title-hero">
            Food &amp; Drug<br />
            <span className="green-accent">Administration</span>
          </h1>
          <p className="admin-split-tagline-hero">
            State Food Safety Enforcement &amp; Redressal System
          </p>

          <div className="admin-split-features">
            <div className="admin-split-feature-item">
              <div className="admin-split-icon-circle green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="admin-split-feature-text">
                <h4>Ensure Food Safety</h4>
                <p>Safe food for a healthier Maharashtra</p>
              </div>
            </div>

            <div className="admin-split-feature-item">
              <div className="admin-split-icon-circle blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="admin-split-feature-text">
                <h4>Track &amp; Resolve</h4>
                <p>Transparent complaint tracking</p>
              </div>
            </div>

            <div className="admin-split-feature-item">
              <div className="admin-split-icon-circle purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="admin-split-feature-text">
                <h4>Accountability</h4>
                <p>Stronger enforcement, safer communities</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Glass Quote */}
        <div className="admin-split-quote-glass">
          <div className="admin-quote-leaf-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
            </svg>
          </div>
          <div>
            <p>“Safe Food Today, A Healthier Tomorrow”</p>
            <div className="quote-green-bar"></div>
          </div>
        </div>
      </div>

      {/* Right Column: Floating White Login Card */}
      <div className="admin-split-form-panel">
        <div className="admin-white-login-card">
          
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <img 
              src={FDA_LOGO_IMG} 
              alt="Food and Drug Administration Maharashtra Logo" 
              className="admin-split-fda-logo"
              onError={(e) => { e.target.onerror = null; e.target.src = "/fda_logo.png"; }}
            />
          </div>

          <h2 className="admin-split-card-title">Administrative Console</h2>
          <p className="admin-split-card-sub">State Food Safety Enforcement &amp; Redressal System</p>

          <div style={{ textAlign: "center" }}>
            <div className="admin-split-clearance-pill">
              <span>🔒</span> RESTRICTED CLEARANCE • LEVEL-3 AUTH
            </div>
          </div>

          {message && (
            <div className="admin-split-alert-error" role="alert">
              <span>⚠️</span>
              <span>{message}</span>
            </div>
          )}

          {/* 1-Click Demo Credentials Chip */}
          <button 
            type="button" 
            className="admin-split-demo-chip"
            onClick={fillDemoAdmin}
            title="Click to auto-fill default admin credentials"
          >
            <span>⚡ Fill Default Admin Credentials</span>
            <span className="chip-badge">fda@gmail.com</span>
          </button>

          <form onSubmit={submit}>
            <div className="admin-split-form-group">
              <label className="admin-split-label">Official Email Address</label>
              <div className="admin-split-input-wrap">
                <span className="admin-split-input-icon"><IconMail /></span>
                <input 
                  className="admin-split-input" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="fda@gmail.com" 
                  autoComplete="username"
                  required 
                />
              </div>
            </div>

            <div className="admin-split-form-group">
              <label className="admin-split-label">Master Password</label>
              <div className="admin-split-input-wrap">
                <span className="admin-split-input-icon"><IconLock /></span>
                <input 
                  className="admin-split-input admin-split-input-with-eye" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  autoComplete="current-password"
                  required 
                />
                <button 
                  type="button" 
                  className="admin-split-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <IconEye show={showPassword} />
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="admin-split-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>⏳ Authenticating Officer...</>
              ) : (
                <>🔒 Authenticate &amp; Enter Console &rarr;</>
              )}
            </button>

            {/* Official Warning Box */}
            <div className="admin-split-warning-box">
              <span className="warning-icon">⚠️</span>
              <p>
                <strong>Official Warning:</strong> This portal is exclusively designated for FDA Maharashtra authorized personnel. All authentication transactions, IP addresses, and operational actions are logged and audited pursuant to Sec. 43 of the Information Technology Act, 2000.
              </p>
            </div>

            {/* Back to Public Portal Link */}
            <div className="admin-split-footer">
              <button 
                type="button" 
                className="admin-split-back-link"
                onClick={() => { window.location.hash = ""; setPage("home"); }}
              >
                &larr; Return to Citizen Public Portal
              </button>
            </div>
          </form>

        </div>
      </div>
    </section>
  );
}


function Dashboard({ officer, setPage, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [update, setUpdate] = useState({ status: "under_review", actionType: "warning_issued", note: "", publicNote: "", assignToSelf: true });

  // Data load
  async function load() {
    try {
      const data = await api("/api/complaints");
      setComplaints(data);
    } catch (e) {
      console.error(e);
      if (e.message && e.message.includes("Authentication")) window.location.hash = "admin";
    }
  }

  async function openComplaint(id) {
    setSelected(await api(`/api/complaints/${id}`));
  }

  async function submitUpdate(event, proofFiles = []) {
    event.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(update).forEach(([key, val]) => formData.append(key, val));
      proofFiles.forEach((file) => formData.append("proofMedia", file));

      const data = await api(`/api/complaints/${selected._id}/status`, {
        method: "PATCH",
        body: formData
      });
      await load();
      setSelected(null); // Return directly back to database view
    } catch (err) {
      alert(err.message || "Failed to update complaint status");
    }
  }

  async function assignToDistrict(complaintId) {
    try {
      const formData = new FormData();
      formData.append("assignToSelf", "false");
      formData.append("note", "Assigned to District Admin by Super Admin");

      await api(`/api/complaints/${complaintId}/status`, {
        method: "PATCH",
        body: formData
      });
      alert("Successfully assigned complaint to District Admin!");
      await load();
    } catch (err) {
      alert(err.message || "Failed to assign complaint to district admin");
    }
  }

  useEffect(() => { if (officer) load(); }, [officer]);

  return (
    <main className="gov-admin-shell">
      <header className="gov-header">
        <div className="gov-header-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          GOVPORTAL
        </div>
        <div className="gov-header-right">
          <span>OFFICIAL GOV ADMIN | {officer.email || "GOV@CITY.ORG"}</span>
          <button className="gov-signout" onClick={onLogout}>SIGN OUT &rarr;</button>
        </div>
      </header>

      <div className="gov-main">
        <div className="gov-subheader-area">
          <div className="gov-subheader-left">
            <h1>Headquarters</h1>
            <p>FDA Infrastructure & Complaint Analytics</p>
          </div>
          <div className="gov-tabs">
            <button className={`gov-tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>Overview</button>
            <button className={`gov-tab ${activeTab === "analytics" ? "active" : ""}`} onClick={() => setActiveTab("analytics")}>Analytics</button>
            <button className={`gov-tab ${activeTab === "heatmap" ? "active" : ""}`} onClick={() => setActiveTab("heatmap")}>Heatmap</button>
            <button className={`gov-tab ${activeTab === "managedb" ? "active" : ""}`} onClick={() => setActiveTab("managedb")}>Manage DB</button>
            {officer.role === "super_admin" && (
              <button className={`gov-tab ${activeTab === "admins" ? "active" : ""}`} onClick={() => setActiveTab("admins")}>District Admins</button>
            )}
          </div>
        </div>

        {activeTab === "overview" && <TabOverview complaints={complaints} />}
        {activeTab === "analytics" && <TabAnalytics complaints={complaints} />}
        {activeTab === "heatmap" && <TabHeatmap complaints={complaints} />}
        {activeTab === "managedb" && (
          selected ? (
            <div style={{ background: "white", padding: "2rem", borderRadius: "12px", boxShadow: "var(--shadow-md)" }}>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "var(--gov-orange)", fontWeight: "700", cursor: "pointer", marginBottom: "1rem" }}>&larr; Back to Database</button>
              <CaseFile selected={selected} update={update} setUpdate={setUpdate} submitUpdate={submitUpdate} officer={officer} />
            </div>
          ) : (
            <TabManageDB complaints={complaints} openComplaint={openComplaint} assignToDistrict={assignToDistrict} officer={officer} />
          )
        )}
        {activeTab === "admins" && officer.role === "super_admin" && <TabDistrictAdmins />}
      </div>
    </main>
  );
}

function TabOverview({ complaints }) {
  const [filter, setFilter] = useState("today");

  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === "resolved" || c.status === "closed").length;
  const resRate = total ? Math.round((resolved / total) * 100) : 0;

  const byDistrict = useMemo(() => {
    const map = {};
    complaints.forEach((item) => { map[item.district || "Unassigned"] = (map[item.district || "Unassigned"] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [complaints]);

  return (
    <div>
      <div className="gov-filter-bar">
        {["TODAY", "WEEKLY", "MONTHLY", "ALL"].map(f => (
          <button key={f} className={`gov-filter-pill ${filter === f.toLowerCase() ? "active" : ""}`} onClick={() => setFilter(f.toLowerCase())}>{f}</button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "0.875rem", color: "var(--gov-text-muted)", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <IconMark>📅</IconMark> ANALYZING TRENDS
        </span>
      </div>
      <div className="gov-grid gov-grid-3">
        <div className="gov-card gov-metric">
          <span className="gov-metric-label">Total Complaints</span>
          <span className="gov-metric-value">{total}</span>
        </div>
        <div className="gov-card gov-metric">
          <span className="gov-metric-label">Resolution Rate</span>
          <span className="gov-metric-value green">{resRate}%</span>
        </div>
        <div className="gov-card gov-metric">
          <span className="gov-metric-label">Avg Res Time</span>
          <span className="gov-metric-value orange">24.5 <span style={{ fontSize: "1.5rem", color: "var(--gov-text-muted)" }}>hrs</span></span>
        </div>
      </div>
      <div className="gov-grid gov-grid-2" style={{ marginTop: "1.5rem" }}>
        <div className="gov-dark-card">
          <div className="gov-card-title"><IconMark>🔄</IconMark> City Pipeline Flow</div>
          <p style={{ fontSize: "0.875rem", color: "#cbd5e1", marginBottom: "1.5rem" }}>RESOURCE ALLOCATION AND STATUS TRACKING PER DISTRICT</p>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.5rem 1rem", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ color: "var(--gov-green)", fontSize: "0.75rem", fontWeight: "700" }}>DONE</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700" }}>{resolved}</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.5rem 1rem", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ color: "#3b82f6", fontSize: "0.75rem", fontWeight: "700" }}>DOING</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700" }}>{complaints.filter(c => c.status === "action_taken").length}</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.2)", padding: "0.5rem 1rem", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: "700" }}>WAIT</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "700" }}>{complaints.filter(c => c.status === "submitted" || c.status === "under_review").length}</div>
            </div>
          </div>
          <div className="gov-card-title" style={{ color: "#f87171" }}><IconMark>⚠️</IconMark> Risk Profile Assessment</div>
        </div>
        <div className="gov-card">
          <div className="gov-card-title">🏅 City Rankings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            {byDistrict.map(([district, count], i) => (
              <div key={district} style={{ display: "flex", alignItems: "center", gap: "1rem", border: "1px solid var(--gov-border)", padding: "1rem", borderRadius: "8px" }}>
                <div style={{ background: i < 3 ? "var(--gov-orange)" : "#e2e8f0", color: i < 3 ? "white" : "var(--gov-text-muted)", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px", fontWeight: "700" }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "700", textTransform: "uppercase" }}>{district}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--gov-text-muted)" }}>{count} COMPLAINTS</div>
                </div>
                <div style={{ color: "var(--gov-orange)", fontWeight: "700" }}>{Math.round(Math.random() * 40 + 60)}% Score</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabAnalytics({ complaints }) {
  const byCategory = useMemo(() => categories.map(([key, label]) => ({
    key, label, count: complaints.filter(c => c.category === key).length
  })).sort((a, b) => b.count - a.count).slice(0, 3), [complaints]);

  return (
    <div className="gov-grid gov-grid-2">
      <div className="gov-dark-card">
        <div className="gov-card-title" style={{ justifyContent: "space-between" }}>
          <span>🏆 Category Performance Score</span>
          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>RANKED BY RESOLUTION & SPEED</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
          {byCategory.map((cat, i) => (
            <div key={cat.key} style={{ background: "rgba(255,255,255,0.8)", color: "var(--gov-text-main)", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ background: "var(--gov-orange)", color: "white", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", fontWeight: "700", fontSize: "0.75rem" }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "800", textTransform: "uppercase" }}>{cat.label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--gov-text-muted)" }}>AVG SPEED: <span style={{ color: "var(--gov-green)" }}>24.5H</span> | RESOLVED: {cat.count}</div>
              </div>
              <div style={{ color: "var(--gov-orange)", fontWeight: "800", fontSize: "1.25rem" }}>100 <span style={{ fontSize: "0.875rem" }}>pts</span></div>
            </div>
          ))}
        </div>
      </div>
      <div className="gov-dark-card" style={{ background: "#334155" }}>
        <div className="gov-card-title" style={{ justifyContent: "space-between" }}>
          <span>📍 Predictive Hotspots</span>
          <span style={{ fontSize: "0.75rem", color: "var(--gov-green)" }}>AI ENGINE LIVE</span>
        </div>
        <div style={{ marginTop: "1.5rem" }}>
          <div className="risk-item">
            <div className="risk-item-header">
              <span style={{ background: "rgba(74, 222, 128, 0.2)", padding: "0.25rem 0.5rem", borderRadius: "999px" }}>ADULTERATION RISK</span>
              <span>LIKELIHOOD: CRITICAL</span>
            </div>
            <div style={{ height: "4px", background: "rgba(255,255,255,0.2)", borderRadius: "2px", marginBottom: "1rem" }}><div style={{ width: "85%", height: "100%", background: "var(--gov-green)", borderRadius: "2px" }}></div></div>
            <p>Pattern detected in Pune. Proactive monitor active at 18.52, 73.85.</p>
            <div className="risk-item-footer">
              <span><IconMark>◎</IconMark> COORD: 18.52, 73.85</span>
              <span style={{ background: "white", color: "var(--gov-text-main)", padding: "0.25rem 0.5rem", borderRadius: "4px", fontWeight: "700" }}>EXP: MONDAY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabHeatmap({ complaints }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");

  useEffect(() => {
    if (typeof L === "undefined" || !mapRef.current) return;
    if (mapInstance.current) return;

    const maharashtraBounds = L.latLngBounds(MAHARASHTRA_MAP_BOUNDS);

    const map = L.map(mapRef.current, {
      maxBounds: maharashtraBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 7,
      maxZoom: 16
    }).setView([19.7515, 75.7139], 7);

    addBaseMap(map);

    markersLayer.current = L.layerGroup().addTo(map);
    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 300);
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    markersLayer.current.clearLayers();

    const filteredComplaints = complaints.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (districtFilter && c.district !== districtFilter) return false;
      return true;
    });

    filteredComplaints.forEach((c) => {
      if (c.lat && c.lng) {
        const color = c.status === "resolved" ? "#22c55e" : (c.status === "submitted" ? "#ef4444" : "#f59e0b");
        const circle = L.circleMarker([Number(c.lat), Number(c.lng)], {
          radius: 8, fillColor: color, color: "#ffffff",
          weight: 1, opacity: 1, fillOpacity: 0.8
        });
        circle.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #0f172a;">${c.trackingCode}</strong><br/>
            <span>${c.description || "Complaint"}</span><br/>
            <small style="color: #64748b;">District: ${c.district}</small>
          </div>
        `);
        markersLayer.current.addLayer(circle);
      }
    });
  }, [complaints, statusFilter, districtFilter]);

  return (
    <div style={{ position: "relative", width: "100%", height: "550px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--gov-border)" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "550px" }}></div>
      <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "white", padding: "1rem", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", width: "240px", zIndex: 1000 }}>
        <h3 style={{ margin: "0 0 0.9rem 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>Map Filters</h3>
        <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.68rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "100%", marginTop: "0.35rem", padding: "0.55rem", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", background: "#fff" }}>
            <option value="">All statuses</option>
            {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label style={{ display: "block", marginBottom: "0.75rem", fontSize: "0.68rem", fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          District
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} style={{ width: "100%", marginTop: "0.35rem", padding: "0.55rem", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#0f172a", background: "#fff" }}>
            <option value="">All districts</option>
            {maharashtraDistricts.map((district) => <option key={district} value={district}>{district}</option>)}
          </select>
        </label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: "700", color: "#475569" }}>
          <span>{complaints.filter((c) => (!statusFilter || c.status === statusFilter) && (!districtFilter || c.district === districtFilter) && c.lat && c.lng).length} locations</span>
          {(statusFilter || districtFilter) && <button type="button" onClick={() => { setStatusFilter(""); setDistrictFilter(""); }} style={{ border: 0, background: "none", color: "#ea580c", fontWeight: "800", cursor: "pointer", padding: 0 }}>Clear</button>}
        </div>
      </div>
    </div>
  );
}

function TabManageDB({ complaints, openComplaint, assignToDistrict, officer }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [talukaFilter, setTalukaFilter] = useState("");

  const filtered = complaints.filter(c => {
    if (catFilter && c.category !== catFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (districtFilter && c.district !== districtFilter) return false;
    if (talukaFilter && c.taluka !== talukaFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!c.trackingCode?.toLowerCase().includes(q) && !c.vendorName?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="gov-table-container">
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--gov-border)" }}>
        <input style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--gov-border)", fontSize: "0.875rem" }} placeholder="🔍 Search by ID, User, or Title..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>
      <div className="gov-table-header">
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--gov-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Filter Category</div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--gov-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Filter Priority</div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Priorities</option>
            {statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {officer?.role === "super_admin" && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--gov-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Filter District</div>
            <select value={districtFilter} onChange={e => { setDistrictFilter(e.target.value); setTalukaFilter(""); }}>
              <option value="">All Districts</option>
              {maharashtraDistricts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}
        {officer?.role === "super_admin" && districtFilter && (
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--gov-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Filter Taluka</div>
            <select value={talukaFilter} onChange={e => setTalukaFilter(e.target.value)}>
              <option value="">All Talukas</option>
              {(maharashtraTalukas[districtFilter] || []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", padding: "0 1rem", fontWeight: "700", fontSize: "0.875rem" }}>
          <span style={{ color: "var(--gov-orange)", marginRight: "0.25rem" }}>{filtered.length}</span> matching records
        </div>
      </div>
      <table className="gov-table">
        <thead>
          <tr>
            <th>ID / USER</th>
            <th>ISSUE CONTEXT</th>
            <th>PIPELINE</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(c => {
            const [, catLabel] = categoryMeta(c.category);
            return (
              <tr key={c._id}>
                <td>
                  <div style={{ color: "var(--gov-green)", fontWeight: "700", marginBottom: "0.25rem" }}>{c.trackingCode}</div>
                  {c.anonymous ? (
                    <span style={{ fontSize: "0.75rem", background: "#f1f5f9", color: "#64748b", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>
                      🕵️ Anonymous Report
                    </span>
                  ) : (
                    <div style={{ fontSize: "0.85rem", color: "#334155" }}>
                      <strong>{c.complainantName || c.userId?.name || "Citizen User"}</strong>
                      {(c.complainantPhone || c.userId?.phone) && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>📞 {c.complainantPhone || c.userId?.phone}</div>
                      )}
                      {c.userId?.email && (
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>✉️ {c.userId.email}</div>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: "700", marginBottom: "0.25rem", color: "var(--gov-text-main)" }}>{c.vendorName}</div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ border: "1px solid var(--gov-border)", padding: "0.1rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700", color: "var(--gov-text-muted)", textTransform: "uppercase" }}>{catLabel}</span>
                    {c.evidence?.length > 0 && <span style={{ fontSize: "0.75rem", color: "#3b82f6" }}>📷 Photo Attached</span>}
                  </div>
                </td>
                <td>
                  <div style={{ marginBottom: "0.25rem" }}><span className={`gov-badge ${c.status === "resolved" ? "gov-badge-resolved" : (c.status === "submitted" ? "gov-badge-emergency" : "gov-badge-pending")}`}>{pretty(c.status)}</span></div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "600" }}>DP: FDA OPERATIONS</div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="gov-btn" onClick={() => openComplaint(c._id)}>Administrate &rarr;</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TabDistrictAdmins() {
  const [subAdmin, setSubAdmin] = useState({ name: "", email: "", phone: "", password: "", district: "Pune" });
  const [editingAdmin, setEditingAdmin] = useState(null); // id of admin being edited
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", password: "", district: "" });
  const [adminList, setAdminList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  async function loadAdmins() {
    try {
      setLoading(true);
      const data = await api("/api/auth/subadmins");
      setAdminList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdmins();
  }, []);

  async function createSubAdmin(e) {
    e.preventDefault();
    setMsg("");
    try {
      const data = await api("/api/auth/subadmins", { method: "POST", body: JSON.stringify(subAdmin) });
      setMsg(`Successfully created subadmin ${data.officer.name} for ${data.officer.district}`);
      setSubAdmin({ name: "", email: "", phone: "", password: "", district: "Pune" });
      await loadAdmins();
    } catch (err) {
      setMsg(err.message);
    }
  }

  function startEdit(adm) {
    setEditingAdmin(adm._id);
    setEditForm({ name: adm.name, email: adm.email || "", phone: adm.phone || "", password: "", district: adm.district });
  }

  async function saveEdit(e, id) {
    e.preventDefault();
    setMsg("");
    try {
      await api(`/api/auth/subadmins/${id}`, { method: "PUT", body: JSON.stringify(editForm) });
      setEditingAdmin(null);
      setMsg("District admin updated successfully!");
      await loadAdmins();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteAdmin(id, name) {
    if (!confirm(`Are you sure you want to delete district admin ${name}?`)) return;
    setMsg("");
    try {
      await api(`/api/auth/subadmins/${id}`, { method: "DELETE" });
      setMsg(`Deleted admin ${name}`);
      await loadAdmins();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="gov-grid gov-grid-2" style={{ alignItems: "start" }}>
      <div className="gov-card">
        <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gov-nav)" }}>➕ REGISTER DISTRICT ADMIN</h2>
        <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "-6px 0 16px 0" }}>* Note: Each district can have only 1 active admin.</p>
        
        <form onSubmit={createSubAdmin}>
          <div className="gov-form-group">
            <label>FULL NAME</label>
            <input value={subAdmin.name} onChange={e => setSubAdmin({ ...subAdmin, name: e.target.value })} placeholder="District Official Name" required />
          </div>
          <div className="gov-form-group">
            <label>OFFICIAL EMAIL ADDRESS</label>
            <input type="email" value={subAdmin.email} onChange={e => setSubAdmin({ ...subAdmin, email: e.target.value })} placeholder="admin@pune.fda.gov.in" required />
          </div>
          <div className="gov-form-group">
            <label>SECURITY PASSWORD</label>
            <input type="password" value={subAdmin.password} onChange={e => setSubAdmin({ ...subAdmin, password: e.target.value })} placeholder="••••••••" required />
          </div>
          <div className="gov-form-group">
            <label>ASSIGNED DISTRICT</label>
            <select value={subAdmin.district} onChange={e => setSubAdmin({ ...subAdmin, district: e.target.value })}>
              {maharashtraDistricts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button className="gov-btn" style={{ width: "100%", padding: "1rem", marginTop: "1rem" }}>PROVISION ACCOUNT &rarr;</button>
        </form>
        {msg && <p style={{ marginTop: "1rem", color: "var(--gov-orange)", fontWeight: "600", fontSize: "0.875rem" }}>{msg}</p>}
      </div>

      <div className="gov-card">
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--gov-border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
          <div>
            <h3 style={{ margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gov-nav)" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#3b82f6" }}></div> AUTHORIZED ADMIN NETWORK
            </h3>
            <div style={{ fontSize: "0.75rem", color: "var(--gov-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>PROVISIONED DISTRICT ADMINS AND OFFICERS</div>
          </div>
          <div style={{ border: "1px solid var(--gov-orange)", color: "var(--gov-orange)", fontWeight: "700", padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.75rem", display: "flex", alignItems: "center" }}>
            {adminList.length + 1} TOTAL SESSIONS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Main Super Admin Card */}
          <div style={{ border: "1px solid var(--gov-border)", borderRadius: "8px", padding: "1rem", display: "flex", gap: "1rem", alignItems: "center", background: "#f8fafc" }}>
            <div style={{ background: "white", border: "1px solid var(--gov-border)", width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🏛️</div>
            <div>
              <div style={{ fontWeight: "800", color: "var(--gov-nav)", fontSize: "0.9rem" }}>SUPER GOV ADMIN</div>
              <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--gov-green)" }}>Headquarters <span style={{ color: "var(--gov-text-muted)", marginLeft: "0.5rem" }}>• Full Access</span></div>
            </div>
          </div>

          {/* Provisioned Subadmins with Edit/Delete */}
          {loading ? (
            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Loading admin accounts...</p>
          ) : adminList.map((adm) => (
            <div key={adm._id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1rem", background: "#ffffff" }}>
              {editingAdmin === adm._id ? (
                <form onSubmit={(e) => saveEdit(e, adm._id)} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#0f172a" }}>Edit Admin: {adm.name}</h4>
                  <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full Name" required style={{ padding: "6px", fontSize: "0.85rem" }} />
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Official Email" required style={{ padding: "6px", fontSize: "0.85rem" }} />
                  <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="New Password (leave empty to keep current)" style={{ padding: "6px", fontSize: "0.85rem" }} />
                  <select value={editForm.district} onChange={e => setEditForm({ ...editForm, district: e.target.value })} style={{ padding: "6px", fontSize: "0.85rem" }}>
                    {maharashtraDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button type="submit" style={{ flex: 1, background: "#2563eb", color: "white", border: "none", padding: "6px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}>Save</button>
                    <button type="button" onClick={() => setEditingAdmin(null)} style={{ flex: 1, background: "#94a3b8", color: "white", border: "none", padding: "6px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", fontSize: "0.8rem" }}>Cancel</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>👮</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "800", color: "#0f172a", fontSize: "0.9rem" }}>{adm.name}</div>
                    <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "#2563eb" }}>
                      District: {adm.district} <span style={{ color: "#64748b", marginLeft: "0.5rem" }}>• ✉️ {adm.email || "N/A"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button type="button" onClick={() => startEdit(adm)} style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold", color: "#334155" }}>
                      ✏️ Edit
                    </button>
                    <button type="button" onClick={() => deleteAdmin(adm._id, adm.name)} style={{ background: "#fef2f2", border: "1px solid #fecdd3", borderRadius: "4px", padding: "4px 8px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold", color: "#ef4444" }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CaseFile({ selected, update, setUpdate, submitUpdate, officer }) {
  const [proofFiles, setProofFiles] = useState([]);
  const files = [...(selected.evidence || []), ...(selected.supportingEvidence || [])];
  const proofMedia = selected.resolutionProof || [];

  const isSuperAdmin = officer && officer.role === "super_admin";
  const isDistrictAdmin = officer && officer.role !== "super_admin";

  // Rule 1: Super Admin is Read-Only when complaint is pending District Admin review or has not been touched yet.
  const isReadOnlyForSuperAdmin = isSuperAdmin && (selected.pendingDistrictUpdate || selected.status === "submitted");
  
  // Rule 2: District Admin is Read-Only once they submit it to Super Admin (i.e. pendingDistrictUpdate is false)
  // However, if status is 'submitted', it means it's a new complaint (even if it missed assignment due to older bugs), so they can edit it.
  const isReadOnlyForDistrictAdmin = isDistrictAdmin && (!selected.pendingDistrictUpdate && selected.status !== "submitted");

  const isReadOnly = isReadOnlyForSuperAdmin || isReadOnlyForDistrictAdmin || selected.superAdminFinalized;

  return (
    <article className="case-detail">
      <div className="case-detail-head">
        <p className="mono">{selected.trackingCode}</p>
        <StatusBadge status={selected.status} />
      </div>
      <h2>{selected.vendorName}</h2>
      <p className="case-address">{selected.address} ({selected.district})</p>
      <p>{selected.description}</p>

      {/* Complainant Profile Card */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", margin: "16px 0" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "0.95rem" }}>👤 Complainant Profile</h4>
        {selected.anonymous ? (
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem", fontWeight: 600 }}>
            🕵️ Filed Anonymously (Identity protected on official records)
          </p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.85rem", color: "#334155" }}>
            <div><strong>Name:</strong> {selected.complainantName || selected.userId?.name || "Citizen"}</div>
            <div><strong>Phone:</strong> {selected.complainantPhone || selected.userId?.phone || "N/A"}</div>
            <div><strong>Email:</strong> {selected.userId?.email || "N/A"}</div>
            <div><strong>District:</strong> {selected.district}</div>
          </div>
        )}
      </div>

      <section className="evidence-gallery">
        <div className="gallery-head">
          <p className="eyebrow">Complainant Evidence</p>
          <span>{files.length} file{files.length === 1 ? "" : "s"}</span>
        </div>
        <div className="evidence-grid">
          {files.length ? files.map((file) => (
            <a key={file.url} href={file.url} target="_blank" rel="noreferrer"><IconMark>EV</IconMark> {file.originalName || file.filename}</a>
          )) : <p className="empty-state">No initial evidence files attached.</p>}
        </div>
      </section>

      {proofMedia.length > 0 && (
        <section className="evidence-gallery" style={{ marginTop: "1.5rem" }}>
          <div className="gallery-head">
            <p className="eyebrow" style={{ color: "#059669" }}>✅ Resolution & Inspection Proof (Admin Uploaded)</p>
            <span>{proofMedia.length} file(s)</span>
          </div>
          <div className="evidence-grid">
            {proofMedia.map((file) => (
              <a key={file.url} href={file.url} target="_blank" rel="noreferrer" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#047857" }}>
                <IconMark>PROOF</IconMark> {file.originalName || file.filename}
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="case-log" style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <p className="eyebrow">Public Status Log</p>
            <ol className="timeline compact">
              {(selected.statusHistory || []).map((entry, index) => (
                <li key={`${entry.status}-${entry.at}-${index}`}>
                  <strong>{pretty(entry.status)}</strong>
                  <time>{new Date(entry.at).toLocaleString()}</time>
                  {entry.publicNote && <p>{entry.publicNote}</p>}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="eyebrow">Internal Action Notes</p>
            <ul className="internal-notes" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {(selected.actionNotes || []).map((entry, index) => (
                <li key={`action-${index}`} style={{ background: "#fef3c7", padding: "10px", borderRadius: "6px", marginBottom: "8px", fontSize: "0.85rem", borderLeft: "4px solid #f59e0b" }}>
                  <strong>{pretty(entry.actionType)}</strong> - <time style={{ color: "#b45309" }}>{new Date(entry.at || Date.now()).toLocaleString()}</time>
                  <p style={{ margin: "4px 0 0 0", color: "#92400e" }}>{entry.note}</p>
                </li>
              ))}
              {(!selected.actionNotes || selected.actionNotes.length === 0) && (
                <p style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No internal notes yet.</p>
              )}
            </ul>
          </div>
        </div>
      </section>

      {isReadOnly ? (
        <div style={{ marginTop: "1.5rem", padding: "16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", color: "#1e40af" }}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>👁️ Read-Only Mode</h4>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            {isSuperAdmin ? (
              <>This complaint was assigned to the District Admin. <strong>Super Admin is in Read-Only view</strong> until the District Admin reviews and saves an update on this case.</>
            ) : (
              <>This complaint is in <strong>Read-Only view</strong> for District Admins until the Super Admin assigns it to your district for official action.</>
            )}
          </p>
        </div>
      ) : (
        <form className="update-form" onSubmit={(e) => submitUpdate(e, proofFiles)}>
          <h4 style={{ margin: "1rem 0 0.5rem 0", color: "#0f172a" }}>Update Case & Upload Resolution Proof</h4>
          <div className="field-row">
            <select value={update.status} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>{statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <select value={update.actionType} onChange={(e) => setUpdate({ ...update, actionType: e.target.value })}>{actionTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
          <textarea required placeholder="Internal action note" value={update.note} onChange={(e) => setUpdate({ ...update, note: e.target.value })} />
          <textarea placeholder="Public-safe note" value={update.publicNote} onChange={(e) => setUpdate({ ...update, publicNote: e.target.value })} />
          
          <div style={{ margin: "12px 0", background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "6px" }}>
              📷 UPLOAD RESOLUTION PROOF (PHOTOS / VIDEOS)
            </label>
            <input 
              type="file" 
              multiple 
              accept="image/*,video/mp4" 
              onChange={(e) => setProofFiles([...e.target.files].slice(0, 5))}
              style={{ fontSize: "0.85rem" }}
            />
            {proofFiles.length > 0 && (
              <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: "#059669", fontWeight: 600 }}>
                {proofFiles.length} proof file(s) selected
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: "1rem", display: "flex", gap: "10px", flexDirection: "column" }}>
            {isDistrictAdmin && (
              <button 
                type="submit" 
                className="primary" 
                style={{ width: "100%", padding: "12px", background: "#2563eb" }}
                onClick={() => setUpdate((prev) => ({ ...prev, workflowAction: "submit_to_super_admin" }))}
              >
                🚀 Submit to Super Admin
              </button>
            )}
            {isSuperAdmin && (
              <>
                <button 
                  type="submit" 
                  className="primary" 
                  style={{ width: "100%", padding: "12px", background: "#059669" }}
                  onClick={() => setUpdate((prev) => ({ ...prev, workflowAction: "approve_resolve" }))}
                >
                  ✅ Approve & Resolve
                </button>
                <button 
                  type="submit" 
                  className="secondary" 
                  style={{ width: "100%", padding: "12px", background: "#dc2626", color: "white" }}
                  onClick={() => setUpdate((prev) => ({ ...prev, workflowAction: "return_correction" }))}
                >
                  ❌ Return for Correction
                </button>
              </>
            )}
          </div>
        </form>
      )}
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
