import { BaseRepository } from "./BaseRepository.js";

export class ComplaintRepository extends BaseRepository {
  constructor() {
    super("complaints");
  }

  open() {
    return this.all().filter((c) => ["submitted", "under_review", "action_taken"].includes(c.status));
  }

  findByTrackingCode(code) {
    return this.all().find((c) => c.trackingCode === String(code).toUpperCase());
  }

  filter({ status, category, district, priority, assigned } = {}, officer) {
    return this.all()
      .filter((c) => officer?.role === "admin" || c.district === officer?.district)
      .filter((c) => !status || c.status === status)
      .filter((c) => !category || c.category === category)
      .filter((c) => !district || c.district?.toLowerCase().includes(String(district).toLowerCase()))
      .filter((c) => !priority || c.severity === priority)
      .filter((c) => !assigned || (assigned === "assigned" ? c.assignedOfficerId : !c.assignedOfficerId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}
