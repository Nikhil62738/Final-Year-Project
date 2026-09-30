import React, { useState, useEffect } from "react";

const API_BASE = (window.SAFEWATCH_API_BASE_URL || "https://fda-safewatch.onrender.com").replace(/\/$/, "");

// Helper API caller
async function apiCall(path, options = {}) {
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

// ==================================================
// 1. VENDOR HISTORICAL PROFILE MODAL
// ==================================================
export function VendorProfileModal({ vendorQuery, onClose, navigate }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!vendorQuery) return;
    setLoading(true);
    apiCall(`/api/vendors/profile/${encodeURIComponent(vendorQuery)}`)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading vendor profile:", err);
        setLoading(false);
      });
  }, [vendorQuery]);

  if (!vendorQuery) return null;

  return (
    <div className="vendor-modal-overlay" onClick={onClose}>
      <div className="vendor-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="vendor-modal-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>{profile?.vendorName || vendorQuery}</h2>
              {profile && (
                <span className={`risk-badge risk-${profile.riskBadgeColor}`}>
                  🛡️ {profile.riskLevel}
                </span>
              )}
            </div>
            <p style={{ margin: "4px 0 0 0", color: "#94a3b8", fontSize: "0.85rem" }}>
              FSSAI Lic No: <strong>{profile?.fssaiNumber || "Verified Facility"}</strong> • District: <strong>{profile?.district || "Maharashtra"}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", fontWeight: "bold" }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
            Loading Vendor Historical Safety Records...
          </div>
        ) : (
          <div style={{ padding: "1.5rem" }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: "8px", borderBottom: "2px solid #e2e8f0", marginBottom: "1.25rem" }}>
              {[
                ["overview", "📋 Overview & Risk"],
                ["history", `📜 Complaint History (${profile.stats.totalComplaints})`],
                ["actions", `⚠️ Regulatory Actions (${profile.regulatoryActions.length})`],
                ["reviews", `⭐ Citizen Reviews (${profile.stats.averageRating}★)`]
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "8px 14px",
                    border: "none",
                    background: "none",
                    fontWeight: activeTab === key ? 800 : 600,
                    color: activeTab === key ? "#10b981" : "#64748b",
                    borderBottom: activeTab === key ? "3px solid #10b981" : "3px solid transparent",
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "1.5rem" }}>
                  <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>TOTAL COMPLAINTS</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a" }}>{profile.stats.totalComplaints}</div>
                  </div>
                  <div style={{ background: "#f0fdf4", padding: "12px", borderRadius: "10px", border: "1px solid #bbf7d0", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>RESOLVED CASES</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#15803d" }}>{profile.stats.resolvedComplaints}</div>
                  </div>
                  <div style={{ background: "#fef3c7", padding: "12px", borderRadius: "10px", border: "1px solid #fde68a", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#92400e", fontWeight: 700 }}>UNDER REVIEW</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#b45309" }}>{profile.stats.pendingComplaints}</div>
                  </div>
                  <div style={{ background: "#eff6ff", padding: "12px", borderRadius: "10px", border: "1px solid #bfdbfe", textAlign: "center" }}>
                    <div style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 700 }}>AVG RATING</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563eb" }}>{profile.stats.averageRating} ★</div>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "14px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>🏢 Establishment Safety Profile</h4>
                  <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#334155" }}><strong>Category:</strong> {profile.category}</p>
                  <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#334155" }}><strong>Location:</strong> {profile.address}, {profile.district}</p>
                  <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#334155" }}><strong>FSSAI License Status:</strong> <span style={{ color: "#16a34a", fontWeight: 700 }}>{profile.licenseStatus}</span> ({profile.fssaiValidity})</p>
                </div>
              </div>
            )}

            {/* Complaint History Tab */}
            {activeTab === "history" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {profile.complaintsTimeline.map((item) => (
                  <div key={item.id} style={{ background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "#2563eb", fontSize: "0.85rem" }}>{item.trackingCode}</span>
                      <span style={{ fontSize: "0.75rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#0f172a" }}>{item.description}</p>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                      <span>Category: <strong>{item.category}</strong></span>
                      <span>Filed: {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {profile.complaintsTimeline.length === 0 && (
                  <p style={{ color: "#94a3b8", textAlign: "center" }}>No complaints on record for this vendor.</p>
                )}
              </div>
            )}

            {/* Regulatory Actions Tab */}
            {activeTab === "actions" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {profile.regulatoryActions.map((act, i) => (
                  <div key={i} style={{ background: "#fffbeb", borderLeft: "4px solid #f59e0b", padding: "12px", borderRadius: "6px" }}>
                    <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.85rem" }}>⚠️ Action: {act.actionType.replace(/_/g, " ").toUpperCase()}</div>
                    <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#78350f" }}>{act.note}</p>
                    <span style={{ fontSize: "0.75rem", color: "#b45309" }}>Date: {new Date(act.date).toLocaleDateString()}</span>
                  </div>
                ))}
                {profile.regulatoryActions.length === 0 && (
                  <p style={{ color: "#94a3b8", textAlign: "center" }}>No formal penalties or warning notices logged.</p>
                )}
              </div>
            )}

            {/* Citizen Reviews Tab */}
            {activeTab === "reviews" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {profile.citizenReviews.map((rev, i) => (
                  <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" }}>
                    <div style={{ color: "#f59e0b", fontWeight: 800 }}>{"★".repeat(rev.stars)}{"☆".repeat(5 - rev.stars)}</div>
                    <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#1e293b" }}>{rev.feedback || "Resolution satisfactory."}</p>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Case: {rev.trackingCode}</span>
                  </div>
                ))}
                {profile.citizenReviews.length === 0 && (
                  <p style={{ color: "#94a3b8", textAlign: "center" }}>No citizen satisfaction reviews yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================================================
// 2. SAFETY ALERTS TAB
// ==================================================
export function SafetyAlertsView({ navigate }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    apiCall("/api/alerts")
      .then((data) => {
        setAlerts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Alerts load error:", err);
        setLoading(false);
      });
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    if (filter === "all") return true;
    if (filter === "critical") return a.severity === "critical";
    if (filter === "warning") return a.severity === "warning";
    if (filter === "advisory") return a.category === "fssai_advisory";
    return true;
  });

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", padding: "2rem", borderRadius: "16px", marginBottom: "2rem", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "2rem" }}>🚨</span>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>FDA Food Safety & Recall Alerts</h1>
        </div>
        <p style={{ margin: 0, color: "#cbd5e1", fontSize: "0.95rem" }}>
          Official emergency batch recalls, adulteration notices, and consumer advisories issued by FDA Maharashtra.
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          ["all", "All Safety Alerts"],
          ["critical", "🔴 Critical Recalls"],
          ["warning", "🟠 Adulteration Advisories"],
          ["advisory", "🔵 FSSAI Notices"]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: "10px 18px",
              borderRadius: "30px",
              border: "1px solid #cbd5e1",
              background: filter === key ? "#10b981" : "#ffffff",
              color: filter === key ? "#ffffff" : "#475569",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              boxShadow: filter === key ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none"
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading live safety alerts...</div>
      ) : (
        <div className="alerts-grid">
          {filteredAlerts.map((alert) => (
            <div key={alert._id || alert.title} className={`alert-card ${alert.severity}`}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "12px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    background: alert.severity === "critical" ? "#fee2e2" : alert.severity === "warning" ? "#ffedd5" : "#dbeafe",
                    color: alert.severity === "critical" ? "#991b1b" : alert.severity === "warning" ? "#9a3412" : "#1e40af"
                  }}>
                    {alert.severity}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{alert.district}</span>
                </div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", color: "#0f172a", fontWeight: 800 }}>{alert.title}</h3>
                <p style={{ margin: "0 0 10px 0", fontSize: "0.88rem", color: "#334155", fontWeight: 500 }}>{alert.summary}</p>
                <div style={{ background: "rgba(255,255,255,0.7)", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.82rem", color: "#475569" }}>
                  <strong>Affected Item:</strong> {alert.affectedProduct} <br/>
                  <strong>Batch:</strong> {alert.batchNumber}
                </div>
              </div>

              <div style={{ marginTop: "1rem", paddingTop: "10px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Issued: {new Date(alert.issuedDate).toLocaleDateString()}</span>
                <button
                  onClick={() => navigate("submit")}
                  style={{ background: "#ef4444", color: "white", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Report Violation &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================================================
// 3. REAL-TIME INGREDIENT SAFETY ANALYZER
// ==================================================
export function IngredientAnalyzerView() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const samples = [
    { title: "Processed Cheese Spread", text: "Water, Cheese, Milk Solids, Emulsifiers (E331, E339), Preservative (E200), Common Salt, Permitted Color (E160a)" },
    { title: "Flavored Carbonated Soft Drink", text: "Carbonated Water, Sugar, Acidity Regulator (E338), Caffeine, Preservative (E211), Artificial Color (E102 Tartrazine)" },
    { title: "Packaged Potato Chips", text: "Potatoes, Palmolein Oil, Salt, Flavors, Anti-caking Agent (E551), Monosodium Glutamate (E621)" }
  ];

  const handleAnalyze = async (textToUse) => {
    const query = textToUse || inputText;
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await apiCall("/api/products/analyze-ingredients", {
        method: "POST",
        body: JSON.stringify({ ingredientsText: query })
      });
      setAnalysis(res);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)", color: "white", padding: "2rem", borderRadius: "16px", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "2rem" }}>🧪</span>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Real-time Ingredient Safety Analyzer</h1>
        </div>
        <p style={{ margin: 0, color: "#e0f2fe", fontSize: "0.95rem" }}>
          Instantly evaluate packaged food ingredients, flag harmful additives (E-numbers), detect allergens, and review FSSAI compliance.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div className="analyzer-box">
          <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a" }}>Paste Ingredient List</h3>
          <textarea
            rows={6}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
            placeholder="Paste ingredient label from product package (e.g. Wheat Flour, Sugar, Palm Oil, E102, E211, MSG)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button
            onClick={() => handleAnalyze()}
            disabled={loading}
            style={{ width: "100%", marginTop: "1rem", padding: "12px", background: "#10b981", color: "white", border: "none", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}
          >
            {loading ? "Analyzing Ingredients..." : "🔍 Run Safety Analysis"}
          </button>

          <div style={{ marginTop: "1.5rem" }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>Or Try Sample Preset Products:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {samples.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInputText(s.text); handleAnalyze(s.text); }}
                  style={{ textAlign: "left", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "8px 12px", borderRadius: "6px", fontSize: "0.82rem", cursor: "pointer", fontWeight: 600, color: "#334155" }}
                >
                  📌 {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div>
          {analysis ? (
            <div className="analyzer-box" style={{ background: "#ffffff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <div
                  className="score-circle"
                  style={{
                    background: analysis.verdictColor === "green" ? "#dcfce7" : analysis.verdictColor === "orange" ? "#ffedd5" : "#fee2e2",
                    color: analysis.verdictColor === "green" ? "#166534" : analysis.verdictColor === "orange" ? "#9a3412" : "#991b1b"
                  }}
                >
                  <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{analysis.healthScore}</span>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase" }}>Safety Score</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Safety Verdict</span>
                  <h3 style={{ margin: "2px 0 0 0", color: analysis.verdictColor === "green" ? "#15803d" : analysis.verdictColor === "orange" ? "#c2410c" : "#dc2626", fontWeight: 800 }}>
                    {analysis.safetyVerdict}
                  </h3>
                </div>
              </div>

              {/* Detected Additives */}
              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#0f172a" }}>E-Numbers & Additives ({analysis.detectedAdditives.length})</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {analysis.detectedAdditives.map((add, i) => (
                    <span key={i} className="e-chip" style={{ background: add.risk.includes("High") || add.risk.includes("Critical") ? "#fee2e2" : "#f1f5f9" }}>
                      ⚠️ <strong>{add.code}</strong> - {add.name} ({add.risk})
                    </span>
                  ))}
                  {analysis.detectedAdditives.length === 0 && (
                    <span style={{ fontSize: "0.85rem", color: "#16a34a", fontWeight: 600 }}>✅ No high-risk E-numbers detected.</span>
                  )}
                </div>
              </div>

              {/* Allergen Flags */}
              <div style={{ marginBottom: "1.25rem" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "#0f172a" }}>Allergen Highlights ({analysis.detectedAllergens.length})</h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {analysis.detectedAllergens.map((all, i) => (
                    <span key={i} style={{ background: "#ffedd5", color: "#9a3412", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700 }}>
                      🥛 {all}
                    </span>
                  ))}
                  {analysis.detectedAllergens.length === 0 && (
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>No common major allergens flagged.</span>
                  )}
                </div>
              </div>

              {/* Health Warnings */}
              {analysis.healthWarnings.length > 0 && (
                <div style={{ background: "#fff5f5", border: "1px solid #fecdd3", padding: "12px", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "0.85rem", color: "#991b1b" }}>Health Advisories:</h4>
                  <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.82rem", color: "#7f1d1d" }}>
                    {analysis.healthWarnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="analyzer-box" style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🥗</div>
              Paste ingredient list on the left to see real-time safety scores, allergen breakdown, and additive warnings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================================================
// 4. FOOD ITEM BARCODE & IMAGE SCANNER APP
// ==================================================
export function FoodScannerView({ navigate }) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");


  const handleScan = async (codeToUse) => {
    const code = codeToUse || barcodeInput;
    if (!code.trim()) return;

    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const data = await apiCall("/api/products/scan", {
        method: "POST",
        body: JSON.stringify({ barcode: code })
      });

      if (data.isFoodItem === false) {
        setErrorMessage(data.error);
      } else {
        setResult(data.product);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to scan product.");
    } finally {
      setLoading(false);
    }
  };

return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1.5rem" }}>
      <div style={{ background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "white", padding: "2rem", borderRadius: "16px", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{ fontSize: "2rem" }}>📷</span>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>FDA Food Scanner & Barcode Verifier</h1>
        </div>
        <p style={{ margin: 0, color: "#a7f3d0", fontSize: "0.95rem" }}>
          Look up available package and nutrition data by barcode, or use the app to identify likely food from a photo.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Scanner Panel */}
        <div className="analyzer-box">
          <h3 style={{ margin: "0 0 1rem 0", color: "#0f172a" }}>Scan Food Product</h3>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
              ENTER FOOD BARCODE NUMBER
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="e.g. 8901058852378"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
              />
              <button
                onClick={() => handleScan()}
                style={{ background: "#059669", color: "white", border: "none", padding: "0 18px", borderRadius: "6px", fontWeight: 800, cursor: "pointer" }}
              >
                Scan
              </button>
            </div>
          </div>


</div>

        {/* Scanner Results Display */}
        <div>
          {errorMessage && (
            <div style={{ background: "#fef2f2", border: "2px solid #ef4444", borderRadius: "14px", padding: "1.5rem", color: "#991b1b" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🚫 NON-FOOD ITEM DETECTED</div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem" }}>{errorMessage}</p>
            </div>
          )}

          {result && (
            <div className="analyzer-box" style={{ background: "#ffffff" }}>
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                <img src={result.imageUrl} alt={result.name} style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "10px" }} />
                <div>
                  <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px", fontWeight: 700 }}>{result.category}</span>
                  <h3 style={{ margin: "4px 0", fontSize: "1.15rem", color: "#0f172a", fontWeight: 800 }}>{result.name}</h3>
                  <div style={{ fontSize: "0.82rem", color: "#475569" }}>Brand: <strong>{result.brand}</strong></div>
                  <div style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 700 }}>FSSAI: {result.fssaiLicense} ({result.fssaiStatus})</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "1rem" }}>
                <div style={{ background: "#f1f5f9", padding: "8px 14px", borderRadius: "8px", fontWeight: 800 }}>
                  Nutri-Score: <span style={{ color: "#2563eb", fontSize: "1.1rem" }}>{result.nutriscoreGrade}</span>
                </div>
                <div style={{ background: "#f0fdf4", padding: "8px 14px", borderRadius: "8px", fontWeight: 800, color: "#166534" }}>
                  Health Score: {result.healthRating} / 100
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", color: "#334155", marginBottom: "1rem" }}>
                <strong>Ingredients:</strong> {result.ingredients.join(", ")}
              </div>

              {result.allergens.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <strong style={{ fontSize: "0.82rem", color: "#9a3412" }}>Allergens:</strong>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    {result.allergens.map((all, i) => (
                      <span key={i} style={{ background: "#ffedd5", color: "#9a3412", padding: "2px 8px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700 }}>
                        {all}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate("submit")}
                style={{ width: "100%", padding: "10px", background: "#ea580c", color: "white", border: "none", borderRadius: "8px", fontWeight: 800, cursor: "pointer" }}
              >
                Report Complaint Against This Product &rarr;
              </button>
            </div>
          )}

          {!result && !errorMessage && (
            <div className="analyzer-box" style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔍</div>
              Enter or select a food item barcode to view official FDA parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================================================
// 5. FLOATING HELP CHATBOT FOR NEW USERS
// ==================================================
export function HelpChatbot({ navigate, openVendorProfile }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Welcome to FDA SafeWatch! I am your AI Assistant. How can I assist you today?"
    }
  ]);

  const quickQuestions = [
    { title: "🚨 How to file a complaint?", answer: "Click 'Submit Complaint' in the menu. Fill in vendor details, attach evidence photos, and receive your tracking code." },
    { title: "🔍 How to track status?", answer: "Enter your 10-character tracking code in 'Track Complaint' to view officer inspection notes in real time." },
    { title: "📷 How to scan barcodes?", answer: "Go to 'Food Scanner' tab to verify FSSAI license numbers and ingredients of packaged food items." },
    { title: "⚠️ Check Safety Alerts", answer: "Click 'Safety Alerts' tab on the home screen to view urgent food recalls and adulteration advisories." },
    { title: "🏪 Vendor Risk Profiles", answer: "Click any vendor name across complaints to open their full historical safety profile and compliance score." }
  ];

  const handleAsk = (q) => {
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: q.title },
      { sender: "bot", text: q.answer }
    ]);
  };

  return (
    <>
      <button className="chatbot-fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div style={{ background: "linear-gradient(135deg, #10b981 0%, #047857 100%)", color: "white", padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>🤖 SafeWatch Guide Assistant</div>
            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "white", fontSize: "1.1rem", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {messages.map((m, i) => (
              <div key={i} className={m.sender === "bot" ? "chat-msg-bot" : "chat-msg-user"}>
                {m.text}
              </div>
            ))}
          </div>

          <div style={{ padding: "10px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginBottom: "6px" }}>QUICK ASSISTANCE TOPICS:</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(q)}
                  style={{ textAlign: "left", background: "#ffffff", border: "1px solid #cbd5e1", padding: "6px 10px", borderRadius: "6px", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600, color: "#334155" }}
                >
                  {q.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==================================================
// 6. COMPLAINT SATISFACTION RATING WIDGET
// ==================================================
export function ComplaintRatingWidget({ complaintId, existingRating, onRated }) {
  const [stars, setStars] = useState(existingRating?.stars || 5);
  const [feedback, setFeedback] = useState(existingRating?.feedback || "");
  const [submitted, setSubmitted] = useState(!!existingRating?.stars);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/api/complaints/${complaintId}/rate`, {
        method: "POST",
        body: JSON.stringify({ stars, feedback })
      });
      setSubmitted(true);
      if (onRated) onRated({ stars, feedback });
    } catch (err) {
      console.error("Rating submission error:", err);
    }
  };

  if (submitted) {
    return (
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px", borderRadius: "10px", color: "#166534" }}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem" }}>⭐ Thank you for your feedback!</div>
        <div style={{ color: "#f59e0b", fontSize: "1.1rem", margin: "4px 0" }}>{"★".repeat(stars)}{"☆".repeat(5 - stars)}</div>
        {feedback && <p style={{ margin: 0, fontSize: "0.85rem", color: "#15803d" }}>"{feedback}"</p>}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: "14px", borderRadius: "10px" }}>
      <h4 style={{ margin: "0 0 6px 0", color: "#92400e" }}>⭐ Rate Complaint Resolution Satisfaction</h4>
      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStars(s)}
            style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: s <= stars ? "#f59e0b" : "#cbd5e1" }}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Share your experience regarding the officer's action..."
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #fcd34d", fontSize: "0.85rem", marginBottom: "8px" }}
      />
      <button type="submit" style={{ background: "#f59e0b", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", fontWeight: 800, cursor: "pointer", fontSize: "0.82rem" }}>
        Submit Rating
      </button>
    </form>
  );
}

// ==================================================
// 7. OFFICER WORKLOAD VIEW (ADMIN DASHBOARD)
// ==================================================
export function OfficerWorkloadDashboard() {
  const [workloads, setWorkloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall("/api/complaints/workload")
      .then((data) => {
        setWorkloads(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Workload load error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ margin: 0, color: "#0f172a", fontSize: "1.25rem", fontWeight: 800 }}>👮 Officer Workload Capacity Dashboard</h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>Monitor case distribution and resolution speeds across district officers.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Calculating officer workloads...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569", fontSize: "0.75rem", textTransform: "uppercase" }}>
                <th style={{ padding: "10px" }}>Officer Name</th>
                <th style={{ padding: "10px" }}>District</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Total Assigned</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Pending Review</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Resolved</th>
                <th style={{ padding: "10px", textAlign: "center" }}>Workload Capacity</th>
              </tr>
            </thead>
            <tbody>
              {workloads.map((off) => (
                <tr key={off.officerId} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px", fontWeight: 700, color: "#0f172a" }}>{off.name}</td>
                  <td style={{ padding: "10px", color: "#475569" }}>{off.district}</td>
                  <td style={{ padding: "10px", textAlign: "center", fontWeight: 800 }}>{off.stats.total}</td>
                  <td style={{ padding: "10px", textAlign: "center", color: "#b45309", fontWeight: 800 }}>{off.stats.pending}</td>
                  <td style={{ padding: "10px", textAlign: "center", color: "#15803d", fontWeight: 800 }}>{off.stats.resolved}</td>
                  <td style={{ padding: "10px", textAlign: "center" }}>
                    <span className={`risk-badge risk-${off.workloadColor}`}>
                      {off.workloadStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================================================
// 8. LOGIN HISTORY & SESSION LOGS VIEW
// ==================================================
export function LoginSessionLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiCall("/api/logs/sessions")
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Session logs load error:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
      <h2 style={{ margin: "0 0 4px 0", color: "#0f172a", fontSize: "1.25rem", fontWeight: 800 }}>🔐 Login History & Session Audit Log</h2>
      <p style={{ margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "0.85rem" }}>Track admin and officer login timestamps, IP addresses, and authentication status.</p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Loading session logs...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0", color: "#475569", fontSize: "0.75rem", textTransform: "uppercase" }}>
                <th style={{ padding: "10px" }}>Timestamp</th>
                <th style={{ padding: "10px" }}>User Name / Email</th>
                <th style={{ padding: "10px" }}>Type / Role</th>
                <th style={{ padding: "10px" }}>IP Address</th>
                <th style={{ padding: "10px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "10px", color: "#64748b" }}>{new Date(log.loginTime).toLocaleString()}</td>
                  <td style={{ padding: "10px", fontWeight: 700, color: "#0f172a" }}>{log.name || log.email}</td>
                  <td style={{ padding: "10px", color: "#2563eb", fontWeight: 600 }}>{log.userType.toUpperCase()} ({log.role})</td>
                  <td style={{ padding: "10px", fontFamily: "monospace" }}>{log.ipAddress}</td>
                  <td style={{ padding: "10px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 800,
                      background: log.status === "success" ? "#dcfce7" : "#fee2e2",
                      color: log.status === "success" ? "#166534" : "#991b1b"
                    }}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==================================================
// 9. SUPER ADMIN ANNOUNCEMENTS BROADCAST
// ==================================================
export function SuperAdminAnnouncements({ officer }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    apiCall("/api/announcements")
      .then((data) => setAnnouncements(data))
      .catch((err) => console.error("Announcements fetch error:", err));
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !content) return;
    try {
      const res = await apiCall("/api/announcements", {
        method: "POST",
        body: JSON.stringify({ title, content, priority })
      });
      setAnnouncements([res, ...announcements]);
      setTitle("");
      setContent("");
    } catch (err) {
      console.error("Announcement error:", err);
    }
  };

  return (
    <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
      <h2 style={{ margin: "0 0 1rem 0", color: "#0f172a", fontSize: "1.25rem", fontWeight: 800 }}>📢 District Broadcast Announcements</h2>

      {officer?.role === "super_admin" && (
        <form onSubmit={handleSend} style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #cbd5e1", marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>Broadcast Announcement to All District Admins</h4>
          <input
            required
            placeholder="Announcement Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "8px" }}
          />
          <textarea
            required
            rows={3}
            placeholder="Write announcement details for district officers..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", marginBottom: "8px" }}
          />
          <button type="submit" style={{ background: "#2563eb", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: 800, cursor: "pointer" }}>
            🚀 Broadcast Announcement
          </button>
        </form>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {announcements.map((ann) => (
          <div key={ann._id} style={{ background: "#eff6ff", borderLeft: "4px solid #2563eb", padding: "12px", borderRadius: "6px" }}>
            <div style={{ fontWeight: 800, color: "#1e40af" }}>📢 {ann.title}</div>
            <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#1e293b" }}>{ann.content}</p>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>By: {ann.createdByName} • {new Date(ann.createdAt).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
