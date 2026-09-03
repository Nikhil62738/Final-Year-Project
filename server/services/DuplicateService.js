import { calculateDistance } from "../utils/geo.js";
import { normalizeFssai, similarity } from "../utils/text.js";

export function findDuplicates(incoming, complaints) {
  const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
  const incomingFssai = normalizeFssai(incoming.fssaiNumber);

  return complaints
    .filter((c) => c.category === incoming.category)
    .filter((c) => new Date(c.createdAt).getTime() >= sixtyDaysAgo)
    .map((c) => {
      const distance = calculateDistance(incoming.lat, incoming.lng, c.lat, c.lng);
      const sameLicence = incomingFssai && normalizeFssai(c.fssaiNumber) === incomingFssai;
      const vendorSimilarity = similarity(incoming.vendorName, c.vendorName);

      if (sameLicence) return { c, confidence: "strong", reason: "Same licence number and category", distance };
      if (distance !== null && distance <= 150 && vendorSimilarity >= 0.55) {
        return { c, confidence: "strong", reason: "Similar vendor nearby in the last 60 days", distance };
      }
      if (distance !== null && distance <= 150) {
        return { c, confidence: "weak", reason: "Same category near this location", distance };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 6)
    .map(({ c, confidence, reason, distance }) => ({
      complaintId: c.id,
      id: c.id,
      trackingCode: c.trackingCode,
      confidence,
      strength: confidence,
      reason,
      distanceMeters: distance === null ? null : Math.round(distance),
      category: c.category,
      vendorName: c.vendorName,
      status: c.status,
      createdAt: c.createdAt
    }));
}
