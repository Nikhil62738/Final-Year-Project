import { NotificationRepository } from "../repositories/GenericRepository.js";
import { createId } from "../utils/id.js";

const notifications = new NotificationRepository();

export async function notify(event, recipient, payload = {}) {
  const provider = process.env.SMS_PROVIDER || process.env.WHATSAPP_PROVIDER || "mock";
  return notifications.insert({
    id: createId("note"),
    event,
    recipient,
    provider,
    payload,
    status: provider === "mock" ? "mocked" : "queued",
    createdAt: new Date().toISOString()
  });
}

export function listNotifications() {
  return notifications.all();
}
