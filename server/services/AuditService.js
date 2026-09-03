import { AuditRepository } from "../repositories/GenericRepository.js";
import { createId } from "../utils/id.js";

const audits = new AuditRepository();

export async function audit(event, actor = "system", details = {}) {
  return audits.insert({
    id: createId("audit"),
    event,
    actor,
    details,
    at: new Date().toISOString()
  });
}
