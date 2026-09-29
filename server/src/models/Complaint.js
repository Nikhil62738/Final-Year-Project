import mongoose from "mongoose";

const evidenceSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    publicNote: { type: String, default: "" },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: "Officer" }
  },
  { _id: false }
);

const actionNoteSchema = new mongoose.Schema(
  {
    actionType: {
      type: String,
      enum: ["warning_issued", "fine_imposed", "license_suspended", "sample_sent_to_lab", "no_violation_found", "other"],
      required: true
    },
    note: { type: String, required: true },
    publicNote: { type: String, default: "" },
    officerId: { type: mongoose.Schema.Types.ObjectId, ref: "Officer", required: true },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    trackingCode: { type: String, required: true, unique: true, index: true },
    category: {
      type: String,
      enum: ["adulteration", "expired_product", "unhygienic_premises", "mislabeling", "pest_contamination", "other"],
      required: true,
      index: true
    },
    description: { type: String, required: true, trim: true },
    vendorName: { type: String, required: true, trim: true },
    fssaiNumber: { type: String, trim: true, index: true },
    address: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true, index: true },
    taluka: { type: String, trim: true },
    lat: { type: Number },
    lng: { type: Number },
    evidence: [evidenceSchema],
    supportingEvidence: [evidenceSchema],
    resolutionProof: [evidenceSchema],
    complainantName: { type: String, trim: true },
    complainantPhone: { type: String, trim: true },
    anonymous: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["submitted", "under_review", "action_taken", "resolved", "closed"],
      default: "submitted",
      index: true
    },
    assignedOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: "Officer" },
    assignedToDistrict: { type: Boolean, default: false },
    pendingDistrictUpdate: { type: Boolean, default: false },
    districtUpdated: { type: Boolean, default: false },
    superAdminFinalized: { type: Boolean, default: false },
    actionNotes: [actionNoteSchema],
    statusHistory: [statusHistorySchema],
    upvotes: { type: Number, default: 0 },
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    rating: {
      stars: { type: Number, min: 1, max: 5 },
      feedback: { type: String, trim: true },
      ratedAt: { type: Date }
    }
  },
  { timestamps: true }
);

complaintSchema.index({ category: 1, status: 1, createdAt: -1 });

export default mongoose.model("Complaint", complaintSchema);
