import { ComplaintRepository } from "../repositories/ComplaintRepository.js";
import { createId, trackingCode } from "../utils/id.js";
import { validateComplaint } from "../validators/complaintValidator.js";
import { evidenceFromFiles } from "../services/EvidenceService.js";
import { findDuplicates } from "../services/DuplicateService.js";
import { suggestSeverity, suggestCategory } from "../services/SeverityService.js";
import { notify } from "../services/NotificationService.js";
import { audit } from "../services/AuditService.js";
import { safePublicNote } from "../utils/text.js";

const complaints = new ComplaintRepository();

function bool(value) {
  return value === true || value === "true" || value === "on";
}

function complaintPayload(body) {
  return {
    category: body.category,
    description: String(body.description || "").trim(),
    vendorName: String(body.vendorName || "").trim(),
    fssaiNumber: String(body.fssaiNumber || "").trim(),
    address: String(body.address || "").trim(),
    district: String(body.district || "").trim(),
    lat: body.lat ? Number(body.lat) : null,
    lng: body.lng ? Number(body.lng) : null,
    complainantName: bool(body.anonymous) ? "" : String(body.complainantName || "").trim(),
    complainantPhone: bool(body.anonymous) ? "" : String(body.complainantPhone || "").trim(),
    anonymous: bool(body.anonymous)
  };
}

export function checkDuplicates(req, res) {
  const payload = complaintPayload(req.body);
  res.json({ success: true, data: { matches: findDuplicates(payload, complaints.open()) }, matches: findDuplicates(payload, complaints.open()) });
}

export function suggestComplaintCategory(req, res) {
  res.json({ success: true, data: { category: suggestCategory(req.body.description || "") } });
}

export async function createComplaint(req, res) {
  const addToId = req.body.addEvidenceToComplaintId || req.body.complaintId;
  if (addToId) {
    const existing = complaints.findById(addToId);
    if (!existing || !["submitted", "under_review", "action_taken"].includes(existing.status)) {
      return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "The existing complaint could not be found." } });
    }
    const evidence = evidenceFromFiles(req.files, req);
    await complaints.update(addToId, (c) => {
      c.supportingEvidence.push(...evidence);
      c.statusHistory.push({ status: c.status, at: new Date().toISOString(), publicNote: "Additional citizen evidence was added.", officerId: null });
    });
    await audit("supporting_evidence_added", "citizen", { complaintId: addToId });
    return res.json({ success: true, data: { trackingCode: existing.trackingCode, complaint: publicComplaint(existing) }, trackingCode: existing.trackingCode });
  }

  const payload = complaintPayload(req.body);
  const errors = validateComplaint(payload);
  if (errors.length) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Please correct the highlighted fields.", fields: errors } });

  const priority = suggestSeverity(payload);
  const now = new Date().toISOString();
  const complaint = {
    id: createId("cmp"),
    trackingCode: trackingCode(complaints.all().filter((c) => c.trackingCode?.includes(new Date().getFullYear())).length),
    ...payload,
    evidence: evidenceFromFiles(req.files, req),
    supportingEvidence: [],
    status: "submitted",
    assignedOfficerId: null,
    priorityScore: priority.score,
    severity: priority.severity,
    priorityReasons: priority.reasons,
    actionNotes: [],
    statusHistory: [{ status: "submitted", at: now, publicNote: "Complaint received.", officerId: null }],
    createdAt: now,
    updatedAt: now
  };
  await complaints.insert(complaint);
  await notify("Complaint submitted", complaint.complainantPhone, { trackingCode: complaint.trackingCode });
  await audit("complaint_created", "citizen", { complaintId: complaint.id });
  res.status(201).json({ success: true, data: { trackingCode: complaint.trackingCode, complaint: publicComplaint(complaint), prioritySuggestion: priority }, trackingCode: complaint.trackingCode });
}

export function trackComplaint(req, res) {
  const complaint = complaints.findByTrackingCode(req.params.trackingCode);
  if (!complaint) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No complaint was found for this tracking code." } });
  res.json({ success: true, data: publicComplaint(complaint), ...publicComplaint(complaint) });
}

export function listComplaints(req, res) {
  res.json({ success: true, data: complaints.filter(req.query, req.officer) });
}

export function getComplaint(req, res) {
  const complaint = complaints.findById(req.params.id);
  if (!complaint || (req.officer.role !== "admin" && complaint.district !== req.officer.district)) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Complaint not found." } });
  }
  res.json({ success: true, data: complaint, ...complaint });
}

export async function assignComplaint(req, res) {
  const complaint = complaints.findById(req.params.id);
  if (!complaint || (req.officer.role !== "admin" && complaint.district !== req.officer.district)) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Complaint not found." } });
  const assigned = await complaints.update(complaint.id, (c) => { c.assignedOfficerId = req.body.officerId || req.officer.id; });
  await audit("complaint_assigned", req.officer.id, { complaintId: complaint.id });
  res.json({ success: true, data: assigned });
}

export async function updateStatus(req, res) {
  const complaint = complaints.findById(req.params.id);
  if (!complaint || (req.officer.role !== "admin" && complaint.district !== req.officer.district)) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Complaint not found." } });
  const updated = await complaints.update(complaint.id, (c) => {
    if (req.body.assignToSelf) c.assignedOfficerId = req.officer.id;
    if (req.body.status) {
      c.status = req.body.status;
      c.statusHistory.push({ status: req.body.status, at: new Date().toISOString(), publicNote: safePublicNote(req.body.publicNote), officerId: req.officer.id });
    }
    if (req.body.actionType && req.body.note) {
      c.actionNotes.push({ id: createId("act"), actionType: req.body.actionType, date: req.body.date || new Date().toISOString(), note: String(req.body.note).slice(0, 1000), publicNote: safePublicNote(req.body.publicNote), officerId: req.officer.id });
    }
  });
  await notify(`Complaint ${updated.status}`, updated.complainantPhone, { trackingCode: updated.trackingCode });
  await audit("complaint_status_updated", req.officer.id, { complaintId: complaint.id, status: updated.status });
  res.json({ success: true, data: updated, ...updated });
}

export async function addEvidence(req, res) {
  const complaint = complaints.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Complaint not found." } });
  const updated = await complaints.update(complaint.id, (c) => c.supportingEvidence.push(...evidenceFromFiles(req.files, req)));
  await audit("evidence_added", req.officer?.id || "citizen", { complaintId: complaint.id });
  res.json({ success: true, data: updated });
}

function publicComplaint(c) {
  return {
    trackingCode: c.trackingCode,
    category: c.category,
    vendorName: c.vendorName,
    address: c.address,
    district: c.district,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    statusHistory: c.statusHistory.map((h) => ({ status: h.status, at: h.at, publicNote: h.publicNote || "" }))
  };
}
