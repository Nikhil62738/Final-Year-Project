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

let googleMapsPromise;

function loadGoogleMaps() {
  const key = window.SAFEWATCH_GOOGLE_MAPS_API_KEY || "";
  if (!key) return Promise.reject(new Error("Google Maps API key is not configured."));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = () => reject(new Error("Google Maps could not be loaded."));
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
}

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
  if (["submit", "track", "login", "register"].includes(raw)) return raw;
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
        <button className="brand" onClick={() => navigate("home")} aria-label="FDA SafeWatch home">
          <span className="seal">FDA</span>
          <span>
            <strong>FDA SafeWatch</strong>
            <small>Food Safety Reporting</small>
          </span>
        </button>
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
          <button className={page === "home" ? "active" : ""} onClick={() => navigate("home")}>Home</button>
          <button
            className={page === "submit" ? "active nav-cta" : "nav-cta"}
            onClick={() => navigate("submit")}
          >
            Report an Issue
          </button>
          <button className={page === "track" ? "active" : ""} onClick={() => navigate("track")}>Track Issue</button>
          {!citizen ? (
            <button className={page === "login" || page === "register" ? "active nav-cta" : "nav-cta"} onClick={() => navigate("login")}>
              Login / Register
            </button>
          ) : (
            <button onClick={logout}>Sign Out ({citizen.name})</button>
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
              navigate={navigate}
            />
          )
        )}
        {page === "track" && <TrackComplaint />}
        {(page === "login" || page === "register") && (
          <Login
            mode={page === "register" ? "register" : "login"}
            loginRedirect={loginRedirect}
            setCitizen={setCitizen}
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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    category: "adulteration",
    description: "",
    vendorName: "",
    fssaiNumber: "",
    address: "",
    district: "",
    lat: "",
    lng: "",
    complainantName: citizen?.name || "",
    complainantPhone: citizen?.phone || "",
    anonymous: false
  });
  const [files, setFiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  function setField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setChecked(false);
    setMatches([]);
  }

  function geolocate() {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setField("lat", pos.coords.latitude.toFixed(6));
        setField("lng", pos.coords.longitude.toFixed(6));
        setLocationStatus(`Location captured. Accuracy approximately ${Math.round(pos.coords.accuracy)} metres.`);
      },
      () => {
        setLocationStatus("We could not access your location. You can enter the address manually or pick a point on the map.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  function canAdvance() {
    if (step === 0) return form.category && form.description && form.vendorName;
    if (step === 1) return form.address && form.district;
    if (step === 2) return form.anonymous || (form.complainantName && form.complainantPhone);
    return true;
  }

  async function checkDuplicates(event) {
    event.preventDefault();
    if (step < submitSteps.length - 1) {
      if (canAdvance()) setStep(step + 1);
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const data = await api("/api/complaints/check-duplicates", {
        method: "POST",
        body: JSON.stringify({ ...form, lat: form.lat ? Number(form.lat) : undefined, lng: form.lng ? Number(form.lng) : undefined })
      });
      setMatches(data.matches || []);
      setChecked(true);
      if (!data.matches?.length) {
        await submitComplaint();
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitComplaint(addEvidenceToComplaintId = "") {
    setBusy(true);
    setMessage("");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, value));
    if (addEvidenceToComplaintId) body.append("addEvidenceToComplaintId", addEvidenceToComplaintId);
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
    <section className="page form-page soft-grid">
      <p className="eyebrow">Citizen complaint</p>
      <h1>Submit Complaint</h1>
      <div className="stepper" aria-label="Complaint form progress">
        {submitSteps.map(([key, label], index) => (
          <button key={key} type="button" className={index === step ? "current" : index < step ? "done" : ""} onClick={() => setStep(index)}>
            <span>{String(index + 1).padStart(2, "0")}</span>{label}
          </button>
        ))}
      </div>
      <form className="report-form stepped-form" onSubmit={checkDuplicates}>
        {step === 0 && (
          <section className="form-section section-ruled">
            <h2>Issue Details</h2>
            <div className="field-row">
              <label className="select-field">Category<select value={form.category} onChange={(e) => setField("category", e.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Vendor name<input required value={form.vendorName} onChange={(e) => setField("vendorName", e.target.value)} /></label>
            </div>
            <label>FSSAI license number<input value={form.fssaiNumber} onChange={(e) => setField("fssaiNumber", e.target.value)} placeholder="Optional" /></label>
            <label>Description<textarea required value={form.description} onChange={(e) => setField("description", e.target.value)} /></label>
          </section>
        )}
        {step === 1 && (
          <section className="form-section section-tabbed">
            <h2>Location & Evidence</h2>
            <div className="field-row">
              <label>District<input required value={form.district} onChange={(e) => setField("district", e.target.value)} placeholder="Pune" /></label>
              <label className="address-field">Address<textarea required value={form.address} onChange={(e) => setField("address", e.target.value)} /></label>
            </div>
            <div className="field-row location-row">
              <label>Latitude<input value={form.lat} onChange={(e) => setField("lat", e.target.value)} /></label>
              <label>Longitude<input value={form.lng} onChange={(e) => setField("lng", e.target.value)} /></label>
              <button type="button" onClick={geolocate}><IconMark>LOC</IconMark> Use location</button>
            </div>
            {locationStatus && <p className="map-note">{locationStatus}</p>}
            <GoogleMapPicker
              lat={form.lat}
              lng={form.lng}
              address={form.address}
              onPick={({ lat, lng }) => {
                setField("lat", lat.toFixed(6));
                setField("lng", lng.toFixed(6));
                setLocationStatus("Map location selected. You can still adjust the address manually.");
              }}
            />
            <label className="file-drop">Evidence<input type="file" multiple accept="image/*,video/mp4,video/quicktime" onChange={(e) => setFiles([...e.target.files].slice(0, 5))} /><span>{files.length ? `${files.length} file${files.length > 1 ? "s" : ""} ready for upload` : "Drop or choose up to 5 photos/videos"}</span></label>
          </section>
        )}
        {step === 2 && (
          <section className="form-section section-soft">
            <h2>Contact Info</h2>
            <label className="checkbox"><input type="checkbox" checked={form.anonymous} onChange={(e) => setField("anonymous", e.target.checked)} /> Report anonymously</label>
            {!form.anonymous && (
              <div className="field-row">
                <label>Name<input value={form.complainantName} onChange={(e) => setField("complainantName", e.target.value)} required={!form.anonymous} /></label>
                <label>Phone<input value={form.complainantPhone} onChange={(e) => setField("complainantPhone", e.target.value)} required={!form.anonymous} /></label>
              </div>
            )}
          </section>
        )}
        {step === 3 && (
          <section className="form-section review-sheet">
            <h2>Review Before Duplicate Check</h2>
            <div className="review-grid">
              <p><span>Category</span>{pretty(form.category)}</p>
              <p><span>Vendor</span>{form.vendorName || "Not provided"}</p>
              <p><span>District</span>{form.district || "Not provided"}</p>
              <p><span>FSSAI</span>{form.fssaiNumber || "Not provided"}</p>
              <p><span>Evidence</span>{files.length} file{files.length === 1 ? "" : "s"}</p>
              <p><span>Complainant</span>{form.anonymous ? "Anonymous" : form.complainantName || "Not provided"}</p>
            </div>
            <p className="review-note">The next step checks open complaints before creating a new case.</p>
          </section>
        )}
        <div className="form-nav">
          <button type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}>Back</button>
          <button className="primary" disabled={busy || !canAdvance()}>{step === submitSteps.length - 1 ? (busy ? "Checking..." : "Check duplicates and submit") : "Continue"}</button>
        </div>
      </form>

      {checked && matches.length > 0 && (
        <section className="duplicate-box" role="dialog" aria-label="Possible duplicate complaints">
          <div className="duplicate-head">
            <div>
              <p className="eyebrow">Decision required</p>
              <h2>Possible existing complaint</h2>
            </div>
            <span className="confidence-count">{matches.length} match{matches.length > 1 ? "es" : ""}</span>
          </div>
          <p>These are not blocks. Choose whether this is a different issue or whether your evidence belongs with an existing open case.</p>
          <div className="match-grid">
            {matches.map((match) => (
              <article key={match.id} className={`match ${match.strength}`}>
                <div className="match-top">
                  <strong>{match.trackingCode}</strong>
                  <span>{match.strength} confidence</span>
                </div>
                <p>{match.reason}</p>
                <dl>
                  <div><dt>Vendor</dt><dd>{match.vendorName}</dd></div>
                  <div><dt>Distance</dt><dd>{match.distanceMeters ?? "Unknown"} m</dd></div>
                  <div><dt>Status</dt><dd><StatusBadge status={match.status} /></dd></div>
                </dl>
                <div className="actions">
                  <button type="button" onClick={() => submitComplaint()}>Different issue</button>
                  <button className="primary" type="button" onClick={() => submitComplaint(match.id)}>Add evidence here</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function GoogleMapPicker({ lat, lng, address, onPick }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  const [state, setState] = useState("loading");

  const currentLat = Number(lat) || 18.5204;
  const currentLng = Number(lng) || 73.8567;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapRef.current) return;
        const center = { lat: currentLat, lng: currentLng };
        mapInstance.current = new maps.Map(mapRef.current, {
          center,
          zoom: lat && lng ? 16 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        markerInstance.current = new maps.Marker({
          position: center,
          map: mapInstance.current,
          draggable: true,
          title: "Complaint location"
        });
        mapInstance.current.addListener("click", (event) => {
          markerInstance.current.setPosition(event.latLng);
          onPick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });
        markerInstance.current.addListener("dragend", (event) => {
          onPick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });
        setState("ready");
      })
      .catch(() => setState("fallback"));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !markerInstance.current || !lat || !lng) return;
    const position = { lat: Number(lat), lng: Number(lng) };
    mapInstance.current.setCenter(position);
    markerInstance.current.setPosition(position);
  }, [lat, lng]);

  const query = lat && lng ? `${lat},${lng}` : address || "Pune";

  return (
    <div className="map-card">
      <div className="map-head">
        <div>
          <strong>Confirm location</strong>
          <span>Use the map or enter coordinates manually.</span>
        </div>
        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">Open in Google Maps</a>
      </div>
      {state === "fallback" ? (
        <div className="map-fallback">
          <p>Google Maps API key is not configured yet.</p>
          <span>Add GOOGLE_MAPS_API_KEY in server/.env to enable the interactive map.</span>
        </div>
      ) : (
        <div className="map-canvas" ref={mapRef}>
          {state === "loading" && <span>Loading Google Map...</span>}
        </div>
      )}
    </div>
  );
}

function TrackComplaint() {
  const [code, setCode] = useState("");
  const [complaint, setComplaint] = useState(null);
  const [message, setMessage] = useState("");

  async function track(event) {
    event.preventDefault();
    setMessage("");
    setComplaint(null);
    try {
      setComplaint(await api(`/api/complaints/track/${code.trim().toUpperCase()}`));
    } catch (error) {
      setMessage(error.message);
    }
  }

  const latest = complaint?.statusHistory?.slice(-3).reverse() || [];

  return (
    <section className="page track-page soft-grid">
      <p className="eyebrow">Public tracker</p>
      <h1>Track Complaint</h1>
      <form className="track-form" onSubmit={track}>
        <label>Tracking code<input className="mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="FDA-2026-000001" pattern="FDA-[0-9]{4}-[0-9]{6}" /></label>
        <button className="primary"><IconMark>TR</IconMark> Track</button>
      </form>
      {message && <p className="notice">{message}</p>}

      {complaint ? (
        <section className="tracker result-highlight">
          <div className="tracker-summary">
            <p className="eyebrow">Current status</p>
            <h2>{pretty(complaint.status)}</h2>
            <StatusBadge status={complaint.status} />
            <p className="mono tracking-code">{complaint.trackingCode}</p>
            <p>{complaint.vendorName}</p>
          </div>
          <ol className="timeline">
            {complaint.statusHistory.map((entry, index) => (
              <li key={`${entry.status}-${entry.at}-${index}`}>
                <strong>{pretty(entry.status)}</strong>
                <time>{new Date(entry.at).toLocaleString()}</time>
                {entry.publicNote && <p>{entry.publicNote}</p>}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <section className="tracker-empty">
          <article>
            <p className="eyebrow">Status guide</p>
            {statuses.map(([status, label]) => (
              <div className="status-guide-row" key={status}>
                <StatusBadge status={status} />
                <p><strong>{label}</strong><span>{statusExplainers[status]}</span></p>
              </div>
            ))}
          </article>
          <aside>
            <p className="eyebrow">Recent activity format</p>
            <div className="activity-sample">
              {(latest.length ? latest : statuses.slice(0, 3).map(([status]) => ({ status, at: new Date(), publicNote: statusExplainers[status] }))).map((entry, index) => (
                <div key={`${entry.status}-${index}`}>
                  <StatusBadge status={entry.status} />
                  <span>{entry.publicNote || statusExplainers[entry.status]}</span>
                </div>
              ))}
            </div>
          </aside>
        </section>
      )}
    </section>
  );
}

function Login({ mode, loginRedirect, setCitizen, navigate }) {
  const [currentMode, setCurrentMode] = useState(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  async function submit(event) {
    event.preventDefault();
    setMessage("");

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
        navigate(loginRedirect || "submit");
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
      navigate(loginRedirect || "submit");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="page narrow login-page soft-grid">
      <p className="eyebrow">Citizen access</p>
      <h1>{currentMode === "register" ? "Create account" : "Login to report"}</h1>
      <p className="login-help">Registration is required before you can submit a food-safety complaint. Tracking remains public with your code.</p>
      <form className="report-form" onSubmit={submit}>
        <section className="form-section login-box">
          {currentMode === "login" && (
            <>
              <label>Email or mobile number<input value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="Email or mobile number" required /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" required /></label>
              <button type="button" className="inline-register" onClick={() => { setCurrentMode("register"); navigate("register"); }}>New user? Register here</button>
            </>
          )}
          {currentMode === "register" && (
            <>
              <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required /></label>
              <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
              <label>Mobile number<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" required /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required /></label>
              <button type="button" className="inline-register" onClick={() => { setCurrentMode("login"); navigate("login"); }}>Already registered? Login here</button>
            </>
          )}
          <button className="primary"><IconMark>IN</IconMark> {currentMode === "register" ? "Create account" : "Login and continue"}</button>
        </section>
      </form>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function AdminLogin({ setOfficer, setPage }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ phone, password }) });
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
          <label>Admin phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9999999999" required /></label>
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

  async function submitUpdate(event) {
    event.preventDefault();
    const data = await api(`/api/complaints/${selected._id}/status`, { method: "PATCH", body: JSON.stringify(update) });
    setSelected(data);
    await load();
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
              <CaseFile selected={selected} update={update} setUpdate={setUpdate} submitUpdate={submitUpdate} />
            </div>
          ) : (
            <TabManageDB complaints={complaints} openComplaint={openComplaint} />
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

  useEffect(() => {
    let map;
    loadGoogleMaps().then(maps => {
      if (!mapRef.current) return;
      map = new maps.Map(mapRef.current, {
        center: { lat: 19.7515, lng: 75.7139 }, // Maharashtra center
        zoom: 7,
        restriction: {
          latLngBounds: {
            north: 25.0,
            south: 15.0,
            east: 82.0,
            west: 72.0,
          },
          strictBounds: false,
        },
        mapTypeControl: false,
        streetViewControl: false,
        styles: [
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#2dd4bf" }] }
        ]
      });

      complaints.forEach(c => {
        if (c.lat && c.lng) {
          const color = c.status === "resolved" ? "#4ade80" : (c.status === "submitted" ? "#fecaca" : "#fef08a");
          new maps.Marker({
            position: { lat: Number(c.lat), lng: Number(c.lng) },
            map,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              fillColor: color,
              fillOpacity: 1,
              strokeWeight: 1,
              strokeColor: "#ffffff",
              scale: 8
            }
          });
        }
      });
    }).catch(e => console.error(e));
  }, [complaints]);

  return (
    <div style={{ position: "relative" }}>
      <div className="map-container-large" ref={mapRef}></div>
      <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "white", padding: "1rem", borderRadius: "8px", boxShadow: "var(--shadow-md)", width: "220px" }}>
        <h3 style={{ margin: "0 0 1rem 0", fontSize: "1rem", fontWeight: "800" }}>Predictive Risk Mapper</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.75rem", fontWeight: "700", color: "var(--gov-text-muted)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }}></div> HIGH PRIORITY</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#fbbf24" }}></div> NORMAL</div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#4ade80" }}></div> RESOLVED</div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
          <button style={{ flex: 1, padding: "0.5rem", background: "white", border: "1px solid var(--gov-border)", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>📍 PINS</button>
          <button style={{ flex: 1, padding: "0.5rem", background: "var(--gov-orange)", color: "white", border: "none", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700", cursor: "pointer" }}>🏢 CITIES</button>
        </div>
      </div>
    </div>
  );
}

function TabManageDB({ complaints, openComplaint }) {
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
                  <div style={{ fontSize: "0.875rem", color: "var(--gov-text-muted)" }}>user@example.com</div>
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
                  <button className="gov-btn" onClick={() => openComplaint(c._id)}>Administrate &rarr;</button>
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
  const [msg, setMsg] = useState("");

  async function createSubAdmin(e) {
    e.preventDefault();
    try {
      const data = await api("/api/auth/subadmins", { method: "POST", body: JSON.stringify(subAdmin) });
      setMsg(`Created subadmin ${data.officer.name} for ${data.officer.district}`);
      setSubAdmin({ name: "", phone: "", password: "", district: "Pune" });
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="gov-grid gov-grid-2" style={{ alignItems: "start" }}>
      <div className="gov-card">
        <h2 style={{ marginTop: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gov-nav)" }}>➕ REGISTER ADMIN</h2>
        <form onSubmit={createSubAdmin}>
          <div className="gov-form-group">
            <label>FULL NAME</label>
            <input value={subAdmin.name} onChange={e => setSubAdmin({ ...subAdmin, name: e.target.value })} placeholder="District Official Name" required />
          </div>
          <div className="gov-form-group">
            <label>OFFICIAL EMAIL / PHONE</label>
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
            <h3 style={{ margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--gov-nav)" }}><div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#3b82f6" }}></div> AUTHORIZED ADMIN NETWORK</h3>
            <div style={{ fontSize: "0.75rem", color: "var(--gov-text-muted)", textTransform: "uppercase", fontWeight: "700" }}>ACTIVE ADMINISTRATIVE SESSIONS AND DISTRICT IDENTIFIERS</div>
          </div>
          <div style={{ border: "1px solid var(--gov-orange)", color: "var(--gov-orange)", fontWeight: "700", padding: "0.25rem 0.75rem", borderRadius: "4px", fontSize: "0.75rem", display: "flex", alignItems: "center" }}>1 TOTAL SESSIONS</div>
        </div>
        <div style={{ border: "1px solid var(--gov-border)", borderRadius: "8px", padding: "1.5rem", display: "flex", gap: "1rem", alignItems: "center", background: "#f8fafc" }}>
          <div style={{ background: "white", border: "1px solid var(--gov-border)", width: "48px", height: "48px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem" }}>🏛️</div>
          <div>
            <div style={{ fontWeight: "800", color: "var(--gov-nav)", marginBottom: "0.25rem" }}>OFFICIAL GOV ADMIN</div>
            <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--gov-green)" }}>gov@city.org <span style={{ color: "var(--gov-text-muted)", marginLeft: "0.5rem" }}>• General</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseFile({ selected, update, setUpdate, submitUpdate }) {
  const files = [...(selected.evidence || []), ...(selected.supportingEvidence || [])];
  return (
    <article className="case-detail">
      <div className="case-detail-head">
        <p className="mono">{selected.trackingCode}</p>
        <StatusBadge status={selected.status} />
      </div>
      <h2>{selected.vendorName}</h2>
      <p className="case-address">{selected.address}</p>
      <p>{selected.description}</p>
      <section className="evidence-gallery">
        <div className="gallery-head">
          <p className="eyebrow">Evidence</p>
          <span>{files.length} file{files.length === 1 ? "" : "s"}</span>
        </div>
        <div className="evidence-grid">
          {files.length ? files.map((file) => (
            <a key={file.url} href={file.url} target="_blank" rel="noreferrer"><IconMark>EV</IconMark> {file.originalName || file.filename}</a>
          )) : <p className="empty-state">No evidence files attached.</p>}
        </div>
      </section>
      <section className="case-log">
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
      <form className="update-form" onSubmit={submitUpdate}>
        <div className="field-row">
          <select value={update.status} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>{statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          <select value={update.actionType} onChange={(e) => setUpdate({ ...update, actionType: e.target.value })}>{actionTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
        <textarea required placeholder="Internal action note" value={update.note} onChange={(e) => setUpdate({ ...update, note: e.target.value })} />
        <textarea placeholder="Public-safe note" value={update.publicNote} onChange={(e) => setUpdate({ ...update, publicNote: e.target.value })} />
        <label className="checkbox assign-toggle"><input type="checkbox" checked={update.assignToSelf} onChange={(e) => setUpdate({ ...update, assignToSelf: e.target.checked })} /> Assign to me</label>
        <button className="primary" style={{marginTop: "1rem"}}><IconMark>OK</IconMark> Log action</button>
      </form>
    </article >
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
