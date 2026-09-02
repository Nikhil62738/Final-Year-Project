import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDb } from "../config/db.js";
import Officer from "../models/Officer.js";

dotenv.config();

await connectDb();

const passwordHash = await bcrypt.hash("Admin@12345", 12);

await Officer.findOneAndUpdate(
  { phone: "9999999999" },
  {
    name: "District Admin",
    phone: "9999999999",
    passwordHash,
    role: "admin",
    district: "Pune",
    active: true
  },
  { upsert: true, new: true }
);

console.log("Seeded admin officer: 9999999999 / Admin@12345");
process.exit(0);
