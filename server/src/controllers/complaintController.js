import Complaint from "../models/Complaint.js";
import { findDuplicateMatches, generateTrackingCode, mapEvidence, publicComplaint } from "../utils/complaints.js";
import { sendEmail } from "../utils/email.js";
import { sendSMS } from "../utils/sms.js";

function parseComplaintBody(body) {
  return {
    category: body.category,
    description: body.description,
    vendorName: body.vendorName || body.title || "Unspecified Vendor",
    fssaiNumber: body.fssaiNumber || "",
    address: body.address || (body.district ? `${body.taluka || ""}, ${body.district}` : "Location provided via map"),
    district: body.district || "Unassigned",
    taluka: body.taluka || "",
    lat: body.lat === "" || body.lat === undefined ? undefined : Number(body.lat),
    lng: body.lng === "" || body.lng === undefined ? undefined : Number(body.lng),
    complainantName: body.anonymous === "true" || body.anonymous === true ? "" : body.complainantName,
    complainantPhone: body.anonymous === "true" || body.anonymous === true ? "" : body.complainantPhone,
    anonymous: body.anonymous === "true" || body.anonymous === true
  };
}

function requireCitizenFields(payload) {
  const missing = ["category", "description", "district"].filter((field) => !payload[field]);
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

  // Strict Duplicate Check: Block duplicate complaint creation
  const duplicates = await findDuplicateMatches(payload);
  const strongDuplicate = duplicates.find((m) => m.strength === "strong");

  if (strongDuplicate) {
    return res.status(400).json({
      message: `Duplicate complaint cannot be allowed. An active complaint for vendor "${strongDuplicate.vendorName}" has already been registered in ${strongDuplicate.district || "this area"} under tracking code ${strongDuplicate.trackingCode}.`,
      duplicate: true,
      existingTrackingCode: strongDuplicate.trackingCode,
      existingComplaint: strongDuplicate
    });
  }

  const Officer = (await import("../models/Officer.js")).default;
  const distAdmin = await Officer.findOne({ district: { $regex: new RegExp(`^${payload.district}$`, 'i') }, active: true });
  const assignedOfficerId = distAdmin ? distAdmin._id : undefined;
  const pendingDistrictUpdate = !!distAdmin;
  const assignedToDistrict = !!distAdmin;

  const trackingCode = await generateTrackingCode();
  const complaint = await Complaint.create({
    ...payload,
    userId: req.user ? req.user._id : undefined,
    trackingCode,
    evidence: mapEvidence(req.files, req),
    assignedOfficerId,
    pendingDistrictUpdate,
    assignedToDistrict,
    statusHistory: [
      {
        status: "submitted",
        at: new Date(),
        publicNote: "Complaint received by FDA SafeWatch."
      }
    ]
  });

  res.status(201).json({ mode: "created", trackingCode, complaint: publicComplaint(complaint) });

  // 1. Send SMS Confirmation to citizen's mobile number
  const citizenPhone = (req.user && req.user.phone) || complaint.complainantPhone;
  if (citizenPhone) {
    sendSMS({
      to: citizenPhone,
      message: `Aarogya Food Safety: Your complaint has been submitted successfully! Tracking ID: ${trackingCode}. Vendor: ${complaint.vendorName}. Status: Submitted.`
    }).catch((err) => console.error("Complaint SMS error:", err));
  }

  // 2. Send Email Confirmation
  if (req.user && req.user.email) {
    const detailHtml = `
      <h2 style="color: #0f172a; margin-top: 0;">Complaint Registered Successfully</h2>
      <p>Thank you for submitting a report to Aarogya Food Safety Portal. Below are your complaint details:</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Tracking Code:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: bold;">${trackingCode}</span></p>
        <p style="margin: 4px 0;"><strong>Category:</strong> ${complaint.category}</p>
        <p style="margin: 4px 0;"><strong>Vendor/Store:</strong> ${complaint.vendorName}</p>
        <p style="margin: 4px 0;"><strong>Location/Address:</strong> ${complaint.address}, ${complaint.district}</p>
        <p style="margin: 4px 0;"><strong>Description:</strong> ${complaint.description}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> Submitted (Pending Officer Review)</p>
      </div>

      <p>You can track the progress of this complaint live on the Aarogya Portal using your Tracking Code: <strong>${trackingCode}</strong>.</p>
    `;

    await sendEmail({
      to: req.user.email,
      subject: `Complaint Received [${trackingCode}] - Aarogya Food Safety`,
      html: detailHtml
    }).catch((err) => console.error("Complaint Email error:", err));
  }
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
  if (district) query.district = { $regex: new RegExp(`^${district}$`, 'i') };

  if (req.officer.role !== "super_admin") {
    const Officer = (await import("../models/Officer.js")).default;
    // Check if there is an active district admin or officer for this officer's district
    const districtOfficers = await Officer.find({ district: { $regex: new RegExp(`^${req.officer.district}$`, 'i') }, active: true });

    // If no active officer exists for this district, only super_admin can see it
    if (!districtOfficers.length) {
      return res.json([]);
    }

    query.district = { $regex: new RegExp(`^${req.officer.district}$`, 'i') };
  }

  const complaints = await Complaint.find(query)
    .sort({ createdAt: -1 })
    .populate("assignedOfficerId", "name email role district")
    .populate("userId", "name email phone");
  res.json(complaints);
}

export async function getComplaint(req, res) {
  const query = { _id: req.params.id };
  if (req.officer.role !== "super_admin") {
    query.district = { $regex: new RegExp(`^${req.officer.district}$`, 'i') };
  }

  const complaint = await Complaint.findOne(query)
    .populate("assignedOfficerId", "name role district")
    .populate("userId", "name email phone");
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  res.json(complaint);
}

export async function updateComplaintStatus(req, res) {
  const query = { _id: req.params.id };
  if (req.officer.role !== "super_admin") {
    query.district = { $regex: new RegExp(`^${req.officer.district}$`, 'i') };
  }

  const complaint = await Complaint.findOne(query);
  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  let { status, actionType, note, publicNote, workflowAction } = req.body;

  if (req.files && req.files.length) {
    complaint.resolutionProof.push(...mapEvidence(req.files, req));
  }

  let emailCitizenMessage = "";
  let emailDistAdminMessage = "";

  if (workflowAction === "submit_to_super_admin") {
    complaint.pendingDistrictUpdate = false;
    if (status === "submitted") {
      status = "under_review";
    }
    emailCitizenMessage = "Your complaint has been forwarded to the Super Admin for final review.";
  } else if (workflowAction === "approve_resolve") {
    complaint.status = "resolved";
    complaint.superAdminFinalized = true;
    emailCitizenMessage = "Your complaint has been resolved by the Super Admin.";
    complaint.statusHistory.push({
      status: "resolved",
      at: new Date(),
      publicNote: publicNote || "Complaint resolved by Super Admin.",
      officerId: req.officer.id
    });
  } else if (workflowAction === "return_correction") {
    complaint.pendingDistrictUpdate = true;
    actionType = "other";
    note = `[RETURNED FOR CORRECTION] ${note || "Please review and correct."}`;
    emailDistAdminMessage = `Super Admin has returned complaint ${complaint.trackingCode} for correction. Note: ${note}`;
  }

  if (status && workflowAction !== "approve_resolve") {
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

  if (emailDistAdminMessage && complaint.assignedOfficerId) {
    const Officer = (await import("../models/Officer.js")).default;
    const distAdmin = await Officer.findById(complaint.assignedOfficerId);
    if (distAdmin) {
      if (distAdmin.phone) {
        sendSMS({
          to: distAdmin.phone,
          message: `Aarogya Alert: Complaint [${complaint.trackingCode}] has been returned for your review.`
        }).catch((err) => console.error("Officer SMS error:", err));
      }
      if (distAdmin.email) {
        sendEmail({
          to: distAdmin.email,
          subject: `[Action Required] Complaint Returned [${complaint.trackingCode}]`,
          html: `<p>${emailDistAdminMessage}</p>`
        }).catch((err) => console.error("Officer Email error:", err));
      }
    }
  }

  if (emailCitizenMessage && (complaint.userId || complaint.complainantPhone)) {
    const User = (await import("../models/User.js")).default;
    const user = complaint.userId ? await User.findById(complaint.userId) : null;
    const citizenPhone = (user && user.phone) || complaint.complainantPhone;

    // Send SMS status update to citizen
    if (citizenPhone) {
      sendSMS({
        to: citizenPhone,
        message: `Aarogya Food Safety: Status of complaint [${complaint.trackingCode}] updated to ${complaint.status.toUpperCase()}. ${emailCitizenMessage ? emailCitizenMessage.substring(0, 90) : ''}`
      }).catch((err) => console.error("Citizen SMS update error:", err));
    }

    // Send Email status update to citizen
    if (user && user.email) {
      let updateBodyHtml = `
        <h2 style="color: #0f172a; margin-top: 0;">Complaint Status Update</h2>
        <p>${emailCitizenMessage}</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0;"><strong>Tracking Code:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: bold;">${complaint.trackingCode}</span></p>
          <p style="margin: 4px 0;"><strong>Current Status:</strong> <span style="color: #059669; font-weight: bold;">${complaint.status.toUpperCase()}</span></p>
        </div>
      `;
      sendEmail({
        to: user.email,
        subject: `Update on Complaint [${complaint.trackingCode}] - Aarogya`,
        html: updateBodyHtml
      }).catch((err) => console.error("Citizen Email update error:", err));
    }
  }
}

export async function listPublicComplaints(req, res) {
  try {
    const complaints = await Complaint.find({})
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(50);

    const formatted = complaints.map((c) => publicComplaint(c));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch public complaints feed" });
  }
}

export async function listMyHistory(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required to view history" });
    }
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const formatted = complaints.map((c) => publicComplaint(c));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user complaint history" });
  }
}

export async function voteComplaint(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "You must be logged in to upvote complaints" });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const userIdStr = req.user._id.toString();
    const existingIndex = complaint.voters.findIndex((v) => v.toString() === userIdStr);

    if (existingIndex > -1) {
      // Remove vote
      complaint.voters.splice(existingIndex, 1);
      complaint.upvotes = Math.max(0, (complaint.upvotes || 0) - 1);
    } else {
      // Add vote
      complaint.voters.push(req.user._id);
      complaint.upvotes = (complaint.upvotes || 0) + 1;
    }

    await complaint.save();
    res.json(publicComplaint(complaint));
  } catch (error) {
    res.status(500).json({ message: "Failed to update vote on complaint" });
  }
}
