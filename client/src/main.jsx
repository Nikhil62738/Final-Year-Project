const { useEffect, useMemo, useState } = React;

const API_BASE = "";

const categories = [
  ["adulteration", "Adulteration"],
  ["expired_product", "Expired product"],
  ["unhygienic_premises", "Unhygienic premises"],
  ["mislabeling", "Mislabeling"],
  ["pest_contamination", "Pest contamination"],
  ["other", "Other"]
];

const statuses = [
  ["submitted", "Submitted"],
  ["under_review", "Under Review"],
  ["action_taken", "Action Taken"],
  ["resolved", "Resolved"],
  ["closed", "Closed"]
];

const actionTypes = [
  ["warning_issued", "Warning issued"],
  ["fine_imposed", "Fine imposed"],
  ["license_suspended", "License suspended"],
  ["sample_sent_to_lab", "Sample sent to lab"],
  ["no_violation_found", "No violation found"],
  ["other", "Other"]
];

function pretty(value) {
  return categories.find(([key]) => key === value)?.[1] || statuses.find(([key]) => key === value)?.[1] || value;
}

function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{pretty(status)}</span>;
}

function IconMark({ children }) {
  return <span className="icon-mark" aria-hidden="true">{children}</span>;
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
  const [page, setPage] = useState("home");
  const [officer, setOfficer] = useState(() => JSON.parse(localStorage.getItem("safewatch_officer") || "null"));

  function logout() {
    localStorage.removeItem("safewatch_token");
    localStorage.removeItem("safewatch_officer");
    setOfficer(null);
    setPage("home");
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
          <button className={page === "submit" ? "active" : ""} onClick={() => setPage("submit")}>Submit</button>
          <button className={page === "track" ? "active" : ""} onClick={() => setPage("track")}>Track</button>
          <button className={page === "dashboard" || page === "login" ? "active" : ""} onClick={() => setPage(officer ? "dashboard" : "login")}>{officer ? "Dashboard" : "Officer Login"}</button>
          {officer && <button onClick={logout}>Sign Out</button>}
        </nav>
      </header>
      <main>
        {page === "home" && <Home setPage={setPage} />}
        {page === "submit" && <SubmitComplaint setPage={setPage} />}
        {page === "track" && <TrackComplaint />}
        {page === "login" && <Login setOfficer={setOfficer} setPage={setPage} />}
        {page === "dashboard" && <Dashboard officer={officer} setPage={setPage} />}
      </main>
    </>
  );
}

function Home({ setPage }) {
  return (
    <section className="page home-grid">
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
      <aside className="stamp-panel" aria-label="Process overview">
        <div className="stamp">UNDER REVIEW</div>
        <ol className="process-list">
          <li><strong>Submitted</strong><span>Complaint and evidence are received.</span></li>
          <li><strong>Under Review</strong><span>Officer verifies location, vendor, and risk.</span></li>
          <li><strong>Action Taken</strong><span>Inspection, warning, fine, lab sample, or closure is logged.</span></li>
          <li><strong>Resolved or Closed</strong><span>Public-safe status remains trackable.</span></li>
        </ol>
      </aside>
    </section>
  );
}

function SubmitComplaint({ setPage }) {
  const [form, setForm] = useState({
    category: "adulteration",
    description: "",
    vendorName: "",
    fssaiNumber: "",
    address: "",
    district: "",
    lat: "",
    lng: "",
    complainantName: "",
    complainantPhone: "",
    anonymous: false
  });
  const [files, setFiles] = useState([]);
  const [matches, setMatches] = useState([]);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
      },
      () => setMessage("Location permission was not granted.")
    );
  }

  async function checkDuplicates(event) {
    event.preventDefault();
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
    <section className="page form-page">
      <p className="eyebrow">Citizen complaint</p>
      <h1>Submit Complaint</h1>
      <form className="report-form" onSubmit={checkDuplicates}>
        <fieldset>
          <legend>Issue details</legend>
          <div className="field-row">
            <label>Category<select value={form.category} onChange={(e) => setField("category", e.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <label>District<input required value={form.district} onChange={(e) => setField("district", e.target.value)} placeholder="Pune" /></label>
          </div>
          <div className="field-row">
            <label>Vendor name<input required value={form.vendorName} onChange={(e) => setField("vendorName", e.target.value)} /></label>
            <label>FSSAI license number<input value={form.fssaiNumber} onChange={(e) => setField("fssaiNumber", e.target.value)} placeholder="Optional" /></label>
          </div>
          <label>Address<textarea required value={form.address} onChange={(e) => setField("address", e.target.value)} /></label>
          <label>Description<textarea required value={form.description} onChange={(e) => setField("description", e.target.value)} /></label>
        </fieldset>
        <fieldset>
          <legend>Location and evidence</legend>
          <div className="field-row location-row">
            <label>Latitude<input value={form.lat} onChange={(e) => setField("lat", e.target.value)} /></label>
            <label>Longitude<input value={form.lng} onChange={(e) => setField("lng", e.target.value)} /></label>
            <button type="button" onClick={geolocate}><IconMark>LOC</IconMark> Use location</button>
          </div>
          <label>Evidence<input type="file" multiple accept="image/*,video/mp4,video/quicktime" onChange={(e) => setFiles([...e.target.files].slice(0, 5))} /></label>
          {files.length > 0 && <p className="file-note">{files.length} file{files.length > 1 ? "s" : ""} attached. Maximum 5 files.</p>}
        </fieldset>
        <fieldset>
          <legend>Complainant</legend>
          <label className="checkbox"><input type="checkbox" checked={form.anonymous} onChange={(e) => setField("anonymous", e.target.checked)} /> Report anonymously</label>
          {!form.anonymous && (
            <div className="field-row">
              <label>Name<input value={form.complainantName} onChange={(e) => setField("complainantName", e.target.value)} required={!form.anonymous} /></label>
              <label>Phone<input value={form.complainantPhone} onChange={(e) => setField("complainantPhone", e.target.value)} required={!form.anonymous} /></label>
            </div>
          )}
        </fieldset>
        <button className="primary submit-button" disabled={busy}>{busy ? "Checking..." : "Check duplicates and submit"}</button>
      </form>

      {checked && matches.length > 0 && (
        <section className="duplicate-box">
          <h2>Possible existing complaint</h2>
          <p>These are not blocks. Choose whether this is a different issue or whether your evidence belongs with an existing open case.</p>
          {matches.map((match) => (
            <article key={match.id} className={`match ${match.strength}`}>
              <strong>{match.trackingCode}</strong>
              <span>{match.strength.toUpperCase()} match: {match.reason}</span>
              <small>{match.vendorName} / {match.address} / {match.distanceMeters ?? "unknown"} m</small>
              <div className="actions">
                <button type="button" onClick={() => submitComplaint()}>This is different - submit anyway</button>
                <button className="primary" type="button" onClick={() => submitComplaint(match.id)}>Add my evidence to this complaint</button>
              </div>
            </article>
          ))}
        </section>
      )}
      {message && <p className="notice">{message}</p>}
    </section>
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

  return (
    <section className="page form-page">
      <p className="eyebrow">Public tracker</p>
      <h1>Track Complaint</h1>
      <form className="track-form" onSubmit={track}>
        <label>Tracking code<input className="mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="FDA-2026-000001" pattern="FDA-[0-9]{4}-[0-9]{6}" /></label>
        <button className="primary"><IconMark>TR</IconMark> Track</button>
      </form>
      {message && <p className="notice">{message}</p>}
      {complaint && (
        <section className="tracker">
          <div className="tracker-summary">
            <p className="eyebrow">Current status</p>
            <h2>{pretty(complaint.status)}</h2>
            <StatusBadge status={complaint.status} />
            <p className="mono tracking-code">{complaint.trackingCode}</p>
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
      )}
    </section>
  );
}

function Login({ setOfficer, setPage }) {
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
      setOfficer(data.officer);
      setPage("dashboard");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="page narrow login-page">
      <p className="eyebrow">Officer desk</p>
      <h1>Login</h1>
      <form className="report-form" onSubmit={submit}>
        <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        <button className="primary"><IconMark>IN</IconMark> Sign in</button>
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

  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString(), [filters]);
  const counts = useMemo(() => {
    return statuses.reduce((acc, [status]) => {
      acc[status] = complaints.filter((item) => item.status === status).length;
      return acc;
    }, {});
  }, [complaints]);

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

  if (!officer) return <Login setOfficer={() => {}} setPage={setPage} />;

  return (
    <section className="page dashboard">
      <div className="dashboard-head">
        <div>
          <p className="eyebrow">Officer dashboard</p>
          <h1>Complaints</h1>
        </div>
        <p><IconMark>ID</IconMark> {officer.name} / {officer.role} / {officer.district}</p>
      </div>
      <div className="stat-strip">
        <div><span className="mono">{complaints.length}</span><small>Total cases</small></div>
        <div><span className="mono">{counts.submitted || 0}</span><small>Submitted</small></div>
        <div><span className="mono">{counts.under_review || 0}</span><small>Under review</small></div>
        <div><span className="mono">{counts.action_taken || 0}</span><small>Action taken</small></div>
      </div>
      <div className="filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">All categories</option>{categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input placeholder="District" value={filters.district} onChange={(e) => setFilters({ ...filters, district: e.target.value })} disabled={officer.role !== "admin"} />
      </div>
      <div className="split">
        <div className="complaint-list">
          {!complaints.length && <p className="empty-state">No complaints match the current filters.</p>}
          {complaints.map((item) => (
            <button key={item._id} className="case-row" onClick={() => openComplaint(item._id)}>
              <span className="case-top"><span className="mono">{item.trackingCode}</span><StatusBadge status={item.status} /></span>
              <strong>{item.vendorName}</strong>
              <small>{pretty(item.category)} / {item.district}</small>
            </button>
          ))}
        </div>
        {selected ? (
          <article className="case-detail">
            <div className="case-detail-head">
              <p className="mono">{selected.trackingCode}</p>
              <StatusBadge status={selected.status} />
            </div>
            <h2>{selected.vendorName}</h2>
            <p className="case-address">{selected.address}</p>
            <p>{selected.description}</p>
            <div className="evidence-grid">
              {[...(selected.evidence || []), ...(selected.supportingEvidence || [])].map((file) => (
                <a key={file.url} href={file.url} target="_blank" rel="noreferrer"><IconMark>EV</IconMark> {file.originalName || file.filename}</a>
              ))}
            </div>
            <form className="update-form" onSubmit={submitUpdate}>
              <select value={update.status} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>{statuses.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <select value={update.actionType} onChange={(e) => setUpdate({ ...update, actionType: e.target.value })}>{actionTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
              <textarea required placeholder="Internal action note" value={update.note} onChange={(e) => setUpdate({ ...update, note: e.target.value })} />
              <textarea placeholder="Public-safe note" value={update.publicNote} onChange={(e) => setUpdate({ ...update, publicNote: e.target.value })} />
              <label className="checkbox"><input type="checkbox" checked={update.assignToSelf} onChange={(e) => setUpdate({ ...update, assignToSelf: e.target.checked })} /> Assign to me</label>
              <button className="primary"><IconMark>OK</IconMark> Log action</button>
            </form>
          </article>
        ) : (
          <aside className="case-placeholder">
            <p className="eyebrow">Case file</p>
            <h2>Select a complaint</h2>
            <p>Choose a case from the register to inspect evidence, assign ownership, and log action.</p>
          </aside>
        )}
      </div>
      {message && <p className="notice">{message}</p>}
    </section>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
