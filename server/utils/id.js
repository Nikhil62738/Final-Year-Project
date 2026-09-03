import { customAlphabet } from "nanoid";

const id = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

export function createId(prefix) {
  return `${prefix}_${id()}`;
}

export function trackingCode(count) {
  return `FDA-${new Date().getFullYear()}-${String(count + 1).padStart(6, "0")}`;
}
