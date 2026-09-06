import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectDb } from "../config/db.js";
import Officer from "../models/Officer.js";

dotenv.config();

await connectDb();

const passwordHash = await bcrypt.hash("Admin@12345", 12);

await Officer.findOneAndUpdate(
  { role: "super_admin" },
  {
    name: "Super Admin",
    email: "fda@gmail.com",
    phone: "9999999999",
    passwordHash,
    role: "super_admin",
    district: "Maharashtra",
    active: true
  },
  { upsert: true, new: true }
);

console.log("Seeded super admin officer: fda@gmail.com / Admin@12345");
process.exit(0);
