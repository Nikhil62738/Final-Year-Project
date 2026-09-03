export function evidenceFromFiles(files = [], req) {
  return files.map((file, index) => ({
    id: `evidence_${Date.now()}_${index}`,
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: `${req.protocol}://${req.get("host")}/uploads/${file.filename}`,
    uploadedAt: new Date().toISOString(),
    captureLocation: null,
    captureTimestamp: null,
    metadataAvailable: false,
    locationMatch: null,
    verificationStatus: "Location could not be verified"
  }));
}
