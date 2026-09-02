import Complaint from "../models/Complaint.js";

const OPEN_STATUSES = ["submitted", "under_review", "action_taken"];

export function normalizeFssai(value = "") {
  return String(value).replace(/\D/g, "");
}

export function normalizeName(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|and|restaurant|hotel|foods|food|store|shop|mart|pvt|ltd)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return new Set(normalizeName(value).split(" ").filter(Boolean));
}

export function nameSimilarity(left, right) {
  const a = tokenize(left);
  const b = tokenize(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  const union = new Set([...a, ...b]).size;
  return intersection / union;
}

export function haversineMeters(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v === undefined || v === null || Number.isNaN(Number(v)))) {
    return null;
  }

  const toRad = (deg) => (Number(deg) * Math.PI) / 180;
  const earthRadius = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function generateTrackingCode() {
  const year = new Date().getFullYear();
  const count = await Complaint.countDocuments({
    createdAt: {
      $gte: new Date(`${year}-01-01T00:00:00.000Z`),
      $lt: new Date(`${year + 1}-01-01T00:00:00.000Z`)
    }
  });
  return `FDA-${year}-${String(count + 1).padStart(6, "0")}`;
}

export function publicComplaint(complaint) {
  return {
    trackingCode: complaint.trackingCode,
    category: complaint.category,
    vendorName: complaint.vendorName,
    address: complaint.address,
    district: complaint.district,
    status: complaint.status,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    statusHistory: complaint.statusHistory.map((entry) => ({
      status: entry.status,
      at: entry.at,
      publicNote: entry.publicNote || ""
    })),
    actionNotes: complaint.actionNotes
      .filter((note) => note.publicNote)
      .map((note) => ({ actionType: note.actionType, at: note.at, publicNote: note.publicNote }))
  };
}

export function mapEvidence(files = [], req) {
  return files.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
  }));
}

export async function findDuplicateMatches(payload) {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const category = payload.category;
  const incomingFssai = normalizeFssai(payload.fssaiNumber);

  const candidates = await Complaint.find({
    status: { $in: OPEN_STATUSES },
    category,
    createdAt: { $gte: sixtyDaysAgo }
  }).sort({ createdAt: -1 });

  const matches = [];

  for (const complaint of candidates) {
    const existingFssai = normalizeFssai(complaint.fssaiNumber);
    const distanceMeters = haversineMeters(payload.lat, payload.lng, complaint.lat, complaint.lng);
    const similarity = nameSimilarity(payload.vendorName, complaint.vendorName);
    const sameFssai = incomingFssai && existingFssai && incomingFssai === existingFssai;

    if (sameFssai) {
      matches.push({ complaint, strength: "strong", reason: "Same FSSAI license number and category", distanceMeters, similarity });
      continue;
    }

    if (distanceMeters !== null && distanceMeters <= 150) {
      if (similarity >= 0.45) {
        matches.push({ complaint, strength: "strong", reason: "Same category, nearby location, and similar vendor name", distanceMeters, similarity });
      } else {
        matches.push({ complaint, strength: "weak", reason: "Same category and nearby location; vendor name differs", distanceMeters, similarity });
      }
    }
  }

  return matches.slice(0, 5).map(({ complaint, strength, reason, distanceMeters, similarity }) => ({
    id: complaint.id,
    trackingCode: complaint.trackingCode,
    category: complaint.category,
    vendorName: complaint.vendorName,
    address: complaint.address,
    status: complaint.status,
    createdAt: complaint.createdAt,
    strength,
    reason,
    distanceMeters: distanceMeters === null ? null : Math.round(distanceMeters),
    similarity: Number(similarity.toFixed(2))
  }));
}
