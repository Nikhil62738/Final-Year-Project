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
  const token = localStorage.getItem("safewatch_token");
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

function App() {
  const savedOfficer = JSON.parse(localStorage.getItem("safewatch_officer") || "null");
  const savedCitizen = JSON.parse(localStorage.getItem("safewatch_user") || "null");
  const [page, setPage] = useState(savedOfficer ? "dashboard" : savedCitizen ? "submit" : "login");
  const [officer, setOfficer] = useState(() => JSON.parse(localStorage.getItem("safewatch_officer") || "null"));
  const [citizen, setCitizen] = useState(() => JSON.parse(localStorage.getItem("safewatch_user") || "null"));

  function logout() {
    localStorage.removeItem("safewatch_token");
    localStorage.removeItem("safewatch_officer");
    localStorage.removeItem("safewatch_user");
    localStorage.removeItem("safewatch_user_token");
    setOfficer(null);
    setCitizen(null);
    setPage("login");
  }

  return (
    <>
      <header className="site-header">
        <button className="brand" onClick={() => setPage("home")} aria-label="FDA SafeWatch home">
          <span className="seal">FDA</span>
          <span>
            <strong>FDA SafeWatch</strong>
            <small>Food Safety Reporting</small>
          </span>
        </button>
        <nav aria-label="Primary navigation">
          {!officer && citizen && <button className={page === "submit" ? "active nav-cta" : "nav-cta"} onClick={() => setPage("submit")}>Report an Issue</button>}
          {!officer && citizen && <button className={page === "track" ? "active" : ""} onClick={() => setPage("track")}>Track Issue</button>}
          {officer && <button className={page === "dashboard" ? "active" : ""} onClick={() => setPage("dashboard")}>Admin Panel</button>}
          {!officer && !citizen && <button className={page === "login" ? "active nav-cta" : "nav-cta"} onClick={() => setPage("login")}>Login / Register</button>}
          {(officer || citizen) && <button onClick={logout}>Sign Out</button>}
        </nav>
      </header>
      <main>
        {page === "home" && <Home setPage={setPage} />}
        {page === "submit" && (officer ? <Dashboard officer={officer} setPage={setPage} /> : citizen ? <SubmitComplaint setPage={setPage} citizen={citizen} /> : <Login setOfficer={setOfficer} setCitizen={setCitizen} setPage={setPage} />)}
        {page === "track" && (officer ? <Dashboard officer={officer} setPage={setPage} /> : citizen ? <TrackComplaint /> : <Login setOfficer={setOfficer} setCitizen={setCitizen} setPage={setPage} />)}
        {page === "login" && <Login setOfficer={setOfficer} setCitizen={setCitizen} setPage={setPage} />}
        {page === "dashboard" && <Dashboard officer={officer} setPage={setPage} />}
      </main>
    </>
  );
}

function Home({ setPage }) {
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
          <div className="actions">
            <button className="primary" onClick={() => setPage("submit")}><IconMark>UP</IconMark> Submit complaint</button>
            <button onClick={() => setPage("track")}><IconMark>TR</IconMark> Track code</button>
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

function SubmitComplaint({ setPage, citizen }) {
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
      setPage("track");
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

function Login({ setOfficer, setCitizen, setPage }) {
  const [mode, setMode] = useState("userLogin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    if (mode === "userRegister") {
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
        setOfficer(null);
        setPage("submit");
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (mode === "userLogin") {
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
        setOfficer(null);
        setPage("submit");
      } catch (error) {
        setMessage(error.message);
      }
      return;
    }

    if (mode === "admin") {
      try {
        const data = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ phone, password }) });
        localStorage.setItem("safewatch_token", data.token);
        localStorage.setItem("safewatch_officer", JSON.stringify(data.officer));
        localStorage.removeItem("safewatch_user");
        localStorage.removeItem("safewatch_user_token");
        setCitizen(null);
        setOfficer(data.officer);
        setPage("dashboard");
      } catch (error) {
        setMessage(error.message);
      }
    }
  }

  return (
    <section className="page narrow login-page soft-grid">
      <p className="eyebrow">Secure access</p>
      <h1>{mode === "admin" ? "Admin Login" : mode === "userRegister" ? "User Register" : "User Login"}</h1>
      {mode !== "userRegister" && (
        <div className="login-tabs" role="tablist" aria-label="Choose login type">
          <button type="button" className={mode === "userLogin" ? "active" : ""} onClick={() => setMode("userLogin")}>User Login</button>
          <button type="button" className={mode === "admin" ? "active" : ""} onClick={() => setMode("admin")}>Admin</button>
        </div>
      )}
      <form className="report-form" onSubmit={submit}>
        <section className="form-section login-box">
          {mode === "userLogin" && (
            <>
              <label>Email or mobile number<input value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} placeholder="Email or mobile number" /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" /></label>
              <button type="button" className="inline-register" onClick={() => setMode("userRegister")}>New user? Register here</button>
              <p className="login-help">Only registered users can login. After login, you can report and track issues.</p>
            </>
          )}
          {mode === "userRegister" && (
            <>
              <label>Full name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></label>
              <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
              <label>Mobile number<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" /></label>
              <button type="button" className="inline-register" onClick={() => setMode("userLogin")}>Already registered? Login here</button>
              <p className="login-help">Registration stores your profile securely in the database.</p>
            </>
          )}
          {mode === "admin" && (
            <>
              <label>Admin phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9999999999" /></label>
              <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" /></label>
              <p className="login-help">Admin login opens the officer dashboard. Reporting and tracking buttons are hidden for admins.</p>
            </>
          )}
          <button className="primary"><IconMark>IN</IconMark> {mode === "admin" ? "Open Admin Panel" : mode === "userRegister" ? "Create Account" : "Login and Report"}</button>
        </section>
      </form>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function Dashboard({ officer, setPage }) {
  const [complaints, setComplaints] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ status: "", category: "", district: "" });
  const [update, setUpdate] = useState({ status: "under_review", actionType: "warning_issued", note: "", publicNote: "", assignToSelf: true });
  const [message, setMessage] = useState("");
  const [subAdmin, setSubAdmin] = useState({ name: "", phone: "", password: "", district: "Pune" });

  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString(), [filters]);
  const counts = useMemo(() => statuses.reduce((acc, [status]) => {
    acc[status] = complaints.filter((item) => item.status === status).length;
    return acc;
  }, {}), [complaints]);
  const byCategory = useMemo(() => categories.map(([key, label, mark]) => ({
    key,
    label,
    mark,
    count: complaints.filter((item) => item.category === key).length
  })), [complaints]);
  const byDistrict = useMemo(() => {
    const map = {};
    complaints.forEach((item) => { map[item.district || "Unassigned"] = (map[item.district || "Unassigned"] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [complaints]);
  const oldestUnassigned = useMemo(() => complaints.find((item) => !item.assignedOfficerId && ["submitted", "under_review"].includes(item.status)), [complaints]);
  const todayPriority = useMemo(() => complaints.filter((item) => ["submitted", "under_review"].includes(item.status)).slice(0, 4), [complaints]);

  async function load() {
    try {
      setComplaints(await api(`/api/complaints${query ? `?${query}` : ""}`));
    } catch (error) {
      setMessage(error.message);
      if (error.message.includes("Authentication")) setPage("login");
    }
  }

  useEffect(() => { if (officer) load(); }, [query]);

  async function openComplaint(id) {
    setSelected(await api(`/api/complaints/${id}`));
  }

  async function submitUpdate(event) {
    event.preventDefault();
    const data = await api(`/api/complaints/${selected._id}/status`, { method: "PATCH", body: JSON.stringify(update) });
    setSelected(data);
    setMessage("Status updated.");
    await load();
  }

  async function createSubAdmin(event) {
    event.preventDefault();
    setMessage("");
    try {
      const data = await api("/api/auth/subadmins", {
        method: "POST",
        body: JSON.stringify(subAdmin)
      });
      setMessage(`Subadmin created for ${data.officer.district}: ${data.officer.name}`);
      setSubAdmin({ name: "", phone: "", password: "", district: "Pune" });
    } catch (error) {
      setMessage(error.message);
    }
  }

  if (!officer) return <Login setOfficer={() => {}} setCitizen={() => {}} setPage={setPage} />;

  return (
    <section className="page dashboard calm-grid">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">{officer.role === "super_admin" ? "Super admin dashboard" : "District admin dashboard"}</p>
          <h1>{officer.role === "super_admin" ? "All Maharashtra Reports" : `${officer.district} Reports`}</h1>
        </div>
        <p><IconMark>ID</IconMark> {officer.name} / {officer.role} / {officer.district}</p>
      </div>
      {officer.role === "super_admin" && (
        <form className="subadmin-panel" onSubmit={createSubAdmin}>
          <div className="panel-title">
            <div>
              <p className="eyebrow">Admin management</p>
              <h2>Create Maharashtra district subadmin</h2>
            </div>
            <button className="primary">Create Subadmin</button>
          </div>
          <div className="subadmin-grid">
            <label>Name<input value={subAdmin.name} onChange={(e) => setSubAdmin({ ...subAdmin, name: e.target.value })} placeholder="Subadmin name" /></label>
            <label>Mobile<input value={subAdmin.phone} onChange={(e) => setSubAdmin({ ...subAdmin, phone: e.target.value })} placeholder="10-digit mobile" /></label>
            <label>Password<input type="password" value={subAdmin.password} onChange={(e) => setSubAdmin({ ...subAdmin, password: e.target.value })} placeholder="Temporary password" /></label>
            <label>District<select value={subAdmin.district} onChange={(e) => setSubAdmin({ ...subAdmin, district: e.target.value })}>{maharashtraDistricts.map((district) => <option key={district} value={district}>{district}</option>)}</select></label>
          </div>
        </form>
      )}
      <div className="stat-strip">
        <StatCard mark="TL" label="Total cases" value={complaints.length} note="Current filtered register" />
        <StatCard mark="SB" label="Submitted" value={counts.submitted || 0} note="Awaiting triage" tone="submitted" />
        <StatCard mark="RV" label="Under review" value={counts.under_review || 0} note="Active field desk" tone="under_review" />
        <StatCard mark="AC" label="Action taken" value={counts.action_taken || 0} note="Needs closure check" tone="action_taken" />
      </div>
      <section className="admin-workbench">
        <div className="workbench-head">
          <div>
            <p className="eyebrow">Complaint register</p>
            <h2>Review queue and case file</h2>
          </div>
          <div className="filters">
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <input placeholder={officer.role === "super_admin" ? "District" : officer.district} value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} disabled={officer.role !== "super_admin"} />
          </div>
        </div>
      <div className="split">
        <div className="complaint-list">
          {!complaints.length && <p className="empty-state">No complaints match the current filters.</p>}
          {complaints.map((item) => {
            const [, categoryLabel, mark] = categoryMeta(item.category);
            return (
              <button key={item._id} className={`case-row row-${item.status}`} onClick={() => openComplaint(item._id)}>
                <span className="case-top"><span className="category-chip">{mark}</span><span className="mono">{item.trackingCode}</span><StatusBadge status={item.status} /></span>
                <strong>{item.vendorName}</strong>
                <small>{categoryLabel} / {item.district} / {new Date(item.createdAt).toLocaleDateString()}</small>
              </button>
            );
          })}
        </div>
        {selected ? (
          <CaseFile selected={selected} update={update} setUpdate={setUpdate} submitUpdate={submitUpdate} />
        ) : (
          <PriorityPanel oldestUnassigned={oldestUnassigned} todayPriority={todayPriority} openComplaint={openComplaint} />
        )}
      </div>
      </section>
      <section className="analytics-panel">
        <MiniBars title="Complaints by category" rows={byCategory} />
        <MiniBars title="Top districts" rows={byDistrict.map(([label, count]) => ({ key: label, label, count }))} />
        <div className="trend-card">
          <p className="eyebrow">Resolution trend</p>
          <div className="trend-line" aria-label="Illustrative resolution trend"><span></span><span></span><span></span><span></span><span></span></div>
          <p>Use status history dates for a production resolution-time calculation.</p>
        </div>
      </section>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

function StatCard({ mark, label, value, note, tone = "neutral" }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      <IconMark>{mark}</IconMark>
      <span className="mono">{value}</span>
      <strong>{label}</strong>
      <small>{note}</small>
    </div>
  );
}

function MiniBars({ title, rows }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <div className="mini-chart">
      <p className="eyebrow">{title}</p>
      {rows.map((row) => (
        <div className="bar-row" key={row.key}>
          <span>{row.mark && <b>{row.mark}</b>}{row.label}</span>
          <i style={{ width: `${Math.max(7, (row.count / max) * 100)}%` }}></i>
          <em>{row.count}</em>
        </div>
      ))}
    </div>
  );
}

function PriorityPanel({ oldestUnassigned, todayPriority, openComplaint }) {
  return (
    <aside className="case-placeholder">
      <p className="eyebrow">Priority queue</p>
      <h2>{oldestUnassigned ? "Oldest unassigned case" : "No priority case pending"}</h2>
      {oldestUnassigned ? (
        <button className="priority-case" onClick={() => openComplaint(oldestUnassigned._id)}>
          <span className="mono">{oldestUnassigned.trackingCode}</span>
          <strong>{oldestUnassigned.vendorName}</strong>
          <small>{pretty(oldestUnassigned.category)} / {oldestUnassigned.district}</small>
        </button>
      ) : (
        <p className="empty-state">Select a complaint from the register to inspect its case file.</p>
      )}
      <div className="queue-list">
        <p className="eyebrow">Today queue</p>
        {todayPriority.map((item) => (
          <button key={item._id} onClick={() => openComplaint(item._id)}>
            <StatusBadge status={item.status} />
            <span>{item.vendorName}</span>
          </button>
        ))}
      </div>
    </aside>
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
        <button className="primary"><IconMark>OK</IconMark> Log action</button>
      </form>
    </article>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
