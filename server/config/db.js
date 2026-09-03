import path from "path";
import { fileURLToPath } from "url";
import { JSONFilePreset } from "lowdb/node";
import { defaultData } from "../data/defaultData.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const dbPath = path.join(__dirname, "..", "data", "db.json");
export const db = await JSONFilePreset(dbPath, defaultData);

export async function writeDb() {
  await db.write();
}
