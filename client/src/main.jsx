const { useEffect, useMemo, useRef, useState } = React;

const API_BASE = "";

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
  const [loginRedirect, setLoginRedirect] = useState("submit");
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const syncPage = () => setPage(readPageFromHash());
    window.addEventListener("hashchange", syncPage);
    return () => window.removeEventListener("hashchange", syncPage);
  }, []);

  function navigate(target, options = {}) {
    setNavOpen(false);

    if (target === "submit" && !citizen) {
      setLoginRedirect(options.redirect || "submit");
      window.location.hash = "login";
      setPage("login");
      return;
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

  const isAdminRoute = page === "admin";

  if (isAdminRoute) {
    return (
      <main className="admin-shell">
        {officer ? (
          <Dashboard officer={officer} setPage={navigate} onLogout={logout} />
        ) : (
          <AdminLogin setOfficer={setOfficer} setPage={navigate} />
        )}
      </main>
    );
  }

  return (
    <>
      <header className="site-header">
        <div className="header-left">
          <button className="brand" onClick={() => navigate("home")} aria-label="Aarogya home">
            <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Aarogya</h2>
          </button>
          <select className="language-select">
            <option>English</option>
          </select>
        </div>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={navOpen}
          aria-controls="primary-nav"
          onClick={() => setNavOpen((open) => !open)}
        >
          Menu
        </button>
        <nav id="primary-nav" className={navOpen ? "open" : ""} aria-label="Primary navigation">
          <button className={`nav-link ${page === "submit" ? "active" : ""}`} onClick={() => navigate("submit")}>
            📝 Report Issue
          </button>
          <button className={`nav-link ${page === "track" ? "active" : ""}`} onClick={() => navigate("track")}>
            🛡️ Track Issues
          </button>
          <button className={`nav-link ${page === "history" ? "active" : ""}`} onClick={() => navigate("history")}>
            📚 My History
          </button>
          
          <button className="nav-icon-btn" style={{ position: 'relative' }}>
            🔔<span style={{ position: 'absolute', top: '8px', right: '12px', width: '8px', height: '8px', background: 'red', borderRadius: '50%' }}></span>
          </button>

          {!citizen ? (
            <>
              <button className="btn-nav-login" onClick={() => navigate("login")}>LOGIN</button>
              <button className="btn-nav-register" onClick={() => navigate("register")}>REGISTER</button>
            </>
          ) : (
            <div className="user-menu">
              <span className="welcome-text">Welcome, {citizen.name}</span>
              <button className="btn-logout" onClick={logout}>Logout</button>
            </div>
          )}
        </nav>
      </header>
      <main>
        {page === "home" && <Home navigate={navigate} citizen={citizen} />}
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
          />
        )}
      </main>
    </>
  );
}

function Home({ navigate, citizen }) {
  return (
    <section className="page home-page">
      <div className="home-grid">
        <div className="lede">
          <p className="eyebrow">Public food-safety desk</p>
          <h1>Report unsafe food, then track what action followed.</h1>
          <p>
            FDA SafeWatch helps citizens report suspected adulteration, expired stock, unhygienic premises,
            mislabeling, or contamination. Every accepted complaint receives a public tracking code.
          </p>
          {!citizen && (
            <p className="login-prompt">You must register or login before filing a complaint.</p>
          )}
          <div className="actions">
            <button className="primary" onClick={() => navigate("submit")}><IconMark>UP</IconMark> {citizen ? "Submit complaint" : "Login to report"}</button>
            <button onClick={() => navigate("track")}><IconMark>TR</IconMark> Track code</button>
          </div>
          <dl className="public-metrics">
            <div><dt>Duplicate check</dt><dd>Before filing</dd></div>
            <div><dt>Tracking code</dt><dd>Public-safe status</dd></div>
            <div><dt>Officer notes</dt><dd>Privacy redacted</dd></div>
          </dl>
        </div>
        <aside className="hero-status-card" aria-label="Process overview">
          <div className="hero-status-pill">Live status updates</div>
          <ol className="process-list">
            <li><strong>Submitted</strong><span>Complaint and evidence are received.</span></li>
            <li><strong>Under Review</strong><span>Officer verifies location, vendor, and risk.</span></li>
            <li><strong>Action Taken</strong><span>Inspection, warning, fine, lab sample, or closure is logged.</span></li>
            <li><strong>Resolved or Closed</strong><span>Public-safe status remains trackable.</span></li>
          </ol>
        </aside>
      </div>

      <section className="below-fold-grid">
        <article className="duplicate-visual">
          <p className="eyebrow">Duplicate intelligence</p>
          <h2>Every new report is compared before it becomes a new case.</h2>
          <div className="match-diagram" aria-label="Duplicate detection rules">
            <div><IconMark>01</IconMark><strong>License + category</strong><span>Strong match</span></div>
            <div><IconMark>02</IconMark><strong>Nearby + similar vendor</strong><span>Strong match within 150m</span></div>
            <div><IconMark>03</IconMark><strong>Nearby + different name</strong><span>Weak match for review</span></div>
          </div>
        </article>
        <article className="service-note">
          <p className="eyebrow">Public record</p>
          <h2>Designed for action tracking, not social posting.</h2>
          <p>Citizens see public-safe progress. Officers see evidence, assignment, and action history behind authentication.</p>
        </article>
      </section>
    </section>
  );
}

function SubmitComplaint({ navigate, citizen }) {
  const [form, setForm] = useState({
    title: "",
    category: "adulteration",
    description: "",
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
  const [busy, setBusy] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

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
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    files.slice(0, 5).forEach((file) => body.append("evidence", file));

    try {
      const data = await api("/api/complaints", { method: "POST", body });
      setMessage(`Recorded. Tracking code: ${data.trackingCode}`);
      navigate("track");
    } catch (error) {
      setMessage(error.message);
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

              <div className="hazard-level-box" style={{ marginTop: "12px", padding: "10px 14px" }}>
                <div className="hazard-left">
                  <span className="siren">🚨</span>
                  <div>
                    <strong style={{ fontSize: "0.85rem" }}>HAZARD LEVEL</strong>
                    <p style={{ margin: 0, fontSize: "0.75rem" }}>Emergency Reporting</p>
                  </div>
                </div>
                <label className="toggle-switch" style={{ margin: 0 }}>
                  <input type="checkbox" checked={form.emergency} onChange={(e) => setField("emergency", e.target.checked)} />
                  <span className="slider round"></span>
                </label>
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

          <div className="field-row-2">
            <div className="field-group">
              <label>DISTRICT</label>
              <select value={form.district} onChange={(e) => setField("district", e.target.value)} required>
                <option value="">District</option>
                {maharashtraDistricts.map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label>TALUKA</label>
              <input type="text" value={form.taluka} onChange={(e) => setField("taluka", e.target.value)} placeholder="e.g. Haveli" required />
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



function GoogleMapPicker({ lat, lng, address, onPick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    if (typeof L === "undefined" || !mapRef.current) return;
    if (mapInstance.current) return; // already initialized

    const initialLat = Number(lat) || 18.5204;
    const initialLng = Number(lng) || 73.8567;

    // Define Maharashtra bounding box [southwest, northeast]
    const maharashtraBounds = L.latLngBounds(
      L.latLng(15.60, 72.60), // South-West (Sindhudurg / Goa border)
      L.latLng(22.00, 80.90)  // North-East (Gondia / MP border)
    );

    const map = L.map(mapRef.current, {
      maxBounds: maharashtraBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 6,
      maxZoom: 18
    }).setView([initialLat, initialLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
    
    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      onPick({ lat: position.lat, lng: position.lng });
    });

    mapInstance.current = map;
    markerInstance.current = marker;
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current || !lat || !lng) return;
    const position = [Number(lat), Number(lng)];
    mapInstance.current.setView(position);
    markerInstance.current.setLatLng(position);
  }, [lat, lng]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div className="map-canvas" ref={mapRef} style={{ width: "100%", height: "100%" }}></div>
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

function Login({ mode, loginRedirect, setCitizen, setOfficer, navigate }) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [resetRole, setResetRole] = useState("user");

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  async function submit(event) {
    event.preventDefault();
    setMessage("");

    if (currentMode === "otp_request") {
      try {
        await api("/api/auth/users/otp/request", { method: "POST", body: JSON.stringify({ email: emailOrPhone }) });
        setMessage("OTP sent to your email!");
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
          body: JSON.stringify({ email: emailOrPhone, otp })
        });
        localStorage.setItem("safewatch_user", JSON.stringify(data.user));
        localStorage.setItem("safewatch_user_token", data.token);
        localStorage.removeItem("safewatch_token");
        localStorage.removeItem("safewatch_officer");
        setCitizen(data.user);
        navigate("home");
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (currentMode === "forgot_password_request") {
      try {
        await api("/api/auth/users/forgot-password/request", { method: "POST", body: JSON.stringify({ emailOrPhone, role: resetRole }) });
        setMessage("Password reset OTP sent to your email!");
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
        navigate("home");
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
      navigate("home");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="swift-login-wrapper">
      <div className="swift-login-card">
        {currentMode === "register" ? (
          <>
            <div className="swift-title"><span className="welcome">Create</span> <span className="back">Account</span></div>
            <p className="swift-subtitle">Register to submit and track civic issues</p>
          </>
        ) : currentMode.startsWith("otp") ? (
          <>
            <div className="swift-title"><span className="welcome">OTP</span> <span className="back">Login</span></div>
            <p className="swift-subtitle">Secure login without a password</p>
          </>
        ) : currentMode.startsWith("forgot") ? (
          <>
            <div className="swift-title"><span className="welcome">Reset</span> <span className="back">Password</span></div>
            <p className="swift-subtitle">Recover access to your account</p>
          </>
        ) : (
          <>
            <div className="swift-title"><span className="welcome">Welcome</span> <span className="back">Back</span></div>
            <p className="swift-subtitle">Sign in to report and track civic issues</p>
          </>
        )}
        
        <div className="swift-tabs">
          <button type="button" className={`swift-tab ${currentMode !== "admin" ? "active" : ""}`} onClick={() => setCurrentMode("login")}>👤 Citizen</button>
          <button type="button" className={`swift-tab ${currentMode === "admin" ? "active" : ""}`} onClick={() => setCurrentMode("admin")}>🏛️ Government</button>
        </div>

        <form className="swift-form" onSubmit={submit}>
          {(currentMode === "login" || currentMode === "admin") && (
            <>
              <label className="swift-label">{currentMode === "admin" ? "Official Email address" : "Email address or Mobile"}</label>
              <input className="swift-input" type={currentMode === "admin" ? "email" : "text"} value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder={currentMode === "admin" ? "admin@aarogya.gov.in" : "email@domain.com"} required />
              
              <label className="swift-label">Password</label>
              <input className="swift-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              
              <div style={{ textAlign: "right", marginTop: "-15px", marginBottom: "15px" }}>
                <button type="button" className="swift-link-btn" onClick={() => { setResetRole(currentMode === "admin" ? "admin" : "user"); setCurrentMode("forgot_password_request"); }}>Forgot Password?</button>
              </div>

              <button className="swift-button">Login</button>
              {currentMode === "login" && (
                <>
                  <button type="button" className="swift-otp" onClick={() => setCurrentMode("otp_request")}>📱 Login with Email OTP instead</button>
                  <div className="swift-footer">
                    New to Aarogya? <button type="button" onClick={() => { setCurrentMode("register"); navigate("register"); }}>Register</button>
                  </div>
                </>
              )}
            </>
          )}

          {currentMode === "otp_request" && (
            <>
              <label className="swift-label">Registered Email address</label>
              <input className="swift-input" type="email" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
              
              <button className="swift-button">Send OTP</button>
              <button type="button" className="swift-otp" onClick={() => setCurrentMode("login")}>Back to password login</button>
            </>
          )}

          {currentMode === "otp_verify" && (
            <>
              <label className="swift-label">Enter 6-digit OTP</label>
              <input className="swift-input" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />
              
              <button className="swift-button">Verify & Login</button>
              <button type="button" className="swift-otp" onClick={() => setCurrentMode("otp_request")}>Resend OTP</button>
            </>
          )}

          {currentMode === "forgot_password_request" && (
            <>
              <label className="swift-label">Registered {resetRole === "admin" ? "Phone or Email" : "Email or Mobile"}</label>
              <input className="swift-input" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} required />
              
              <button className="swift-button">Send Reset OTP</button>
              <button type="button" className="swift-otp" onClick={() => setCurrentMode(resetRole === "admin" ? "admin" : "login")}>Back to login</button>
            </>
          )}

          {currentMode === "forgot_password_verify" && (
            <>
              <label className="swift-label">Enter 6-digit Reset OTP</label>
              <input className="swift-input" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required />

              <label className="swift-label">New Password</label>
              <input className="swift-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              
              <button className="swift-button">Reset Password</button>
              <button type="button" className="swift-otp" onClick={() => setCurrentMode("forgot_password_request")}>Resend OTP</button>
            </>
          )}

          {currentMode === "register" && (
            <>
              <label className="swift-label">Full name</label>
              <input className="swift-input" value={name} onChange={(e) => setName(e.target.value)} required />

              <label className="swift-label">Email</label>
              <input className="swift-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

              <label className="swift-label">Mobile number</label>
              <input className="swift-input" value={phone} onChange={(e) => setPhone(e.target.value)} required />

              <label className="swift-label">Password</label>
              <input className="swift-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              
              <button className="swift-button">Create account</button>
              <div className="swift-footer">
                Already registered? <button type="button" onClick={() => { setCurrentMode("login"); navigate("login"); }}>Login</button>
              </div>
            </>
          )}
        </form>
        {message && <p className="notice" style={{marginTop: "1rem"}}>{message}</p>}
      </div>
    </div>
  );
}

function AdminLogin({ setOfficer, setPage }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: emailOrPhone, phone: emailOrPhone, password }) });
      localStorage.setItem("safewatch_token", data.token);
      localStorage.setItem("safewatch_officer", JSON.stringify(data.officer));
      localStorage.removeItem("safewatch_user");
      localStorage.removeItem("safewatch_user_token");
      setOfficer(data.officer);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="page narrow login-page soft-grid admin-entry">
      <p className="eyebrow">Officer access</p>
      <h1>Admin login</h1>
      <p className="login-help">This page is not linked from the public site. Authorized officers only.</p>
      <form className="report-form" onSubmit={submit}>
        <section className="form-section login-box">
          <label>Official Email address<input type="email" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="admin@aarogya.gov.in" required /></label>
          <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" required /></label>
          <button className="primary"><IconMark>IN</IconMark> Sign in</button>
        </section>
      </form>
      <button type="button" className="back-public" onClick={() => { window.location.hash = ""; window.location.reload(); }}>Back to public site</button>
      {message && <p className="notice">{message}</p>}
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

  useEffect(() => {
    if (typeof L === "undefined" || !mapRef.current) return;
    if (mapInstance.current) return; // Prevent double initialization

    // Define Maharashtra bounding box [southwest, northeast]
    const maharashtraBounds = L.latLngBounds(
      L.latLng(15.60, 72.60),
      L.latLng(22.00, 80.90)
    );

    // Center on Maharashtra
    const map = L.map(mapRef.current, {
      maxBounds: maharashtraBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 6,
      maxZoom: 18
    }).setView([19.7515, 75.7139], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    complaints.forEach((c) => {
      if (c.lat && c.lng) {
        const color = c.status === "resolved" ? "#22c55e" : (c.status === "submitted" ? "#ef4444" : "#f59e0b");
        const circle = L.circleMarker([Number(c.lat), Number(c.lng)], {
          radius: 8,
          fillColor: color,
          color: "#ffffff",
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #0f172a;">${c.trackingCode}</strong><br/>
            <span>${c.description || "Complaint"}</span><br/>
            <small style="color: #64748b;">District: ${c.district}</small>
          </div>
        `);
      }
    });

    mapInstance.current = map;
    setTimeout(() => map.invalidateSize(), 300);
  }, [complaints]);

  return (
    <div style={{ position: "relative", width: "100%", height: "550px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--gov-border)" }}>
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "550px" }}></div>
      <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "white", padding: "1rem", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", width: "220px", zIndex: 1000 }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}>Predictive Risk Mapper</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem", fontWeight: "700", color: "#64748b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }}></div> SUBMITTED / HIGH</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b" }}></div> UNDER REVIEW</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e" }}></div> RESOLVED</div>
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

  const filtered = complaints.filter(c => {
    if (catFilter && c.category !== catFilter) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    if (districtFilter && c.district !== districtFilter) return false;
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
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--gov-text-muted)", marginBottom: "0.5rem", textTransform: "uppercase" }}>Filter District</div>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}>
            <option value="">All Districts</option>
            {maharashtraDistricts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
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
                    {officer?.role === "super_admin" && (
                      <button 
                        type="button"
                        style={{ background: "#059669", color: "white", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}
                        onClick={() => assignToDistrict(c._id)}
                      >
                        🏛️ Assign to District
                      </button>
                    )}
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
  const [subAdmin, setSubAdmin] = useState({ name: "", phone: "", password: "", district: "Pune" });
  const [editingAdmin, setEditingAdmin] = useState(null); // id of admin being edited
  const [editForm, setEditForm] = useState({ name: "", phone: "", password: "", district: "" });
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
      setSubAdmin({ name: "", phone: "", password: "", district: "Pune" });
      await loadAdmins();
    } catch (err) {
      setMsg(err.message);
    }
  }

  function startEdit(adm) {
    setEditingAdmin(adm._id);
    setEditForm({ name: adm.name, phone: adm.phone, password: "", district: adm.district });
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
            <label>OFFICIAL PHONE NUMBER</label>
            <input value={subAdmin.phone} onChange={e => setSubAdmin({ ...subAdmin, phone: e.target.value })} placeholder="10-digit mobile" required />
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
                  <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" required style={{ padding: "6px", fontSize: "0.85rem" }} />
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

  // Rule: If Super Admin assigns to District Admin, Super Admin remains in Read-Only view until District Admin updates/saves it
  const isReadOnlyForSuperAdmin = isSuperAdmin && selected.pendingDistrictUpdate;
  
  // Rule: If assigned to District Admin and not self, District Admin sees read-only if another officer is assigned
  const isReadOnlyForDistrictAdmin = isDistrictAdmin && selected.assignedOfficerId && String(selected.assignedOfficerId._id || selected.assignedOfficerId) !== String(officer.id || officer._id);

  const isReadOnly = isReadOnlyForSuperAdmin || isReadOnlyForDistrictAdmin;

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
        <p className="eyebrow">Action log</p>
        <ol className="timeline compact">
          {(selected.statusHistory || []).map((entry, index) => (
            <li key={`${entry.status}-${entry.at}-${index}`}>
              <strong>{pretty(entry.status)}</strong>
              <time>{new Date(entry.at).toLocaleString()}</time>
              {entry.publicNote && <p>{entry.publicNote}</p>}
            </li>
          ))}
        </ol>
      </section>

      {isReadOnly ? (
        <div style={{ marginTop: "1.5rem", padding: "16px", background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "8px", color: "#1e40af" }}>
          <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem" }}>👁️ Read-Only Mode (Awaiting District Admin Update)</h4>
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            {isSuperAdmin ? (
              <>This complaint was assigned to the District Admin. <strong>Super Admin is in Read-Only view</strong> until the District Admin reviews and saves an update on this case.</>
            ) : (
              <>This complaint is assigned to another officer. You are viewing it in Read-Only mode.</>
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

          {/* Single Save Action & Proof Button */}
          <div style={{ marginTop: "1rem" }}>
            <button 
              type="submit" 
              className="primary" 
              style={{ width: "100%", padding: "12px", background: "#2563eb" }}
              onClick={() => setUpdate((prev) => ({ ...prev, assignToSelf: true }))}
            >
              💾 Save Action & Proof Details
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
