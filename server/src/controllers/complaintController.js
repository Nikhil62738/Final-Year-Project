import Complaint from "../models/Complaint.js";
import { findDuplicateMatches, generateTrackingCode, mapEvidence, publicComplaint } from "../utils/complaints.js";

function parseComplaintBody(body) {
  return {
    category: body.category,
    description: body.description,
    vendorName: body.vendorName,
    fssaiNumber: body.fssaiNumber || "",
    address: body.address,
    district: body.district || "Unassigned",
    lat: body.lat === "" || body.lat === undefined ? undefined : Number(body.lat),
    lng: body.lng === "" || body.lng === undefined ? undefined : Number(body.lng),
    complainantName: body.anonymous === "true" || body.anonymous === true ? "" : body.complainantName,
    complainantPhone: body.anonymous === "true" || body.anonymous === true ? "" : body.complainantPhone,
    anonymous: body.anonymous === "true" || body.anonymous === true
  };
}

function requireCitizenFields(payload) {
  const missing = ["category", "description", "vendorName", "address", "district"].filter((field) => !payload[field]);
  if (!payload.anonymous && (!payload.complainantName || !payload.complainantPhone)) {
    missing.push("complainantName/complainantPhone");
  }
  return missing;
}

export async function checkDuplicates(req, res) {
  const matches = await findDuplicateMatches(req.body);
  res.json({ matches });
}

export async function createComplaint(req, res) {
  const payload = parseComplaintBody(req.body);
  const missing = requireCitizenFields(payload);

  if (missing.length) {
    return res.status(400).json({ message: `Missing required fields: ${missing.join(", ")}` });
  }

  if (req.body.addEvidenceToComplaintId) {
    const target = await Complaint.findOne({
      _id: req.body.addEvidenceToComplaintId,
      status: { $in: ["submitted", "under_review", "action_taken"] }
    });

    if (!target) {
      return res.status(404).json({ message: "Existing open complaint was not found" });
    }

    target.supportingEvidence.push(...mapEvidence(req.files, req));
    target.statusHistory.push({
      status: target.status,
      at: new Date(),
      publicNote: "Additional citizen evidence was added to this complaint."
    });
    target.updatedAt = new Date();
    await target.save();

    return res.status(200).json({
      mode: "evidence_added",
      trackingCode: target.trackingCode,
      complaint: publicComplaint(target)
    });
  }

  const trackingCode = await generateTrackingCode();
  const complaint = await Complaint.create({
    ...payload,
    trackingCode,
    evidence: mapEvidence(req.files, req),
    statusHistory: [
      {
        status: "submitted",
        at: new Date(),
        publicNote: "Complaint received by FDA SafeWatch."
      }
    ]
  });

  res.status(201).json({ mode: "created", trackingCode, complaint: publicComplaint(complaint) });
}

export async function trackComplaint(req, res) {
  const complaint = await Complaint.findOne({ trackingCode: req.params.trackingCode.toUpperCase() });
  if (!complaint) {
    return res.status(404).json({ message: "No complaint found for this tracking code" });
  }
  res.json(publicComplaint(complaint));
}

export async function listComplaints(req, res) {
  const { status, category, district } = req.query;
  const query = {};

  if (status) query.status = status;
  if (category) query.category = category;
  if (district) query.district = district;

  if (req.officer.role !== "super_admin") {
    query.district = req.officer.district;
  }

  const complaints = await Complaint.find(query).sort({ createdAt: -1 }).select("-complainantPhone");
  res.json(complaints);
}

export async function getComplaint(req, res) {
  const query = { _id: req.params.id };
  if (req.officer.role !== "super_admin") {
    query.district = req.officer.district;
  }

  const complaint = await Complaint.findOne(query).populate("assignedOfficerId", "name role district");
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  res.json(complaint);
}

export async function updateComplaintStatus(req, res) {
  const query = { _id: req.params.id };
  if (req.officer.role !== "super_admin") {
    query.district = req.officer.district;
  }

  const complaint = await Complaint.findOne(query);
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  const { status, actionType, note, publicNote, assignToSelf } = req.body;

  if (assignToSelf) {
    complaint.assignedOfficerId = req.officer.id;
  }

  if (status) {
    complaint.status = status;
    complaint.statusHistory.push({
      status,
      at: new Date(),
      publicNote: publicNote || "",
      officerId: req.officer.id
    });
  }

  if (actionType && note) {
    complaint.actionNotes.push({
      actionType,
      note,
      publicNote: publicNote || "",
      officerId: req.officer.id
    });
  }

  await complaint.save();
  res.json(complaint);
}
