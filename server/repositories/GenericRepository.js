import { BaseRepository } from "./BaseRepository.js";

export const VendorRepository = class VendorRepository extends BaseRepository { constructor() { super("vendors"); } };
export const NotificationRepository = class NotificationRepository extends BaseRepository { constructor() { super("notifications"); } };
export const AppealRepository = class AppealRepository extends BaseRepository { constructor() { super("appeals"); } };
export const AuditRepository = class AuditRepository extends BaseRepository { constructor() { super("auditLogs"); } };
export const LabRepository = class LabRepository extends BaseRepository { constructor() { super("labResults"); } };
export const InstitutionalComplaintRepository = class InstitutionalComplaintRepository extends BaseRepository { constructor() { super("institutionalComplaints"); } };
