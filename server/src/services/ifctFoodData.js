import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dataPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data/indian-foods/ifct2017-compositions.csv");
let foodRowsPromise;

function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value); value = "";
    } else value += char;
  }
  values.push(value);
  return values;
}

async function loadFoodRows() {
  if (!foodRowsPromise) {
    foodRowsPromise = fs.readFile(dataPath, "utf8").then((csv) => {
      const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
      const headers = parseCsvLine(lines[0]);
      return lines.slice(1).map((line) => {
        const values = parseCsvLine(line);
        return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
      });
    }).catch((error) => {
      foodRowsPromise = null;
      throw error;
    });
  }
  return foodRowsPromise;
}

const detailFields = [
  ["water", "Water", "g", 1], ["ash", "Ash", "g", 1],
  ["fibins", "Insoluble fibre", "g", 1], ["fibsol", "Soluble fibre", "g", 1],
  ["thia", "Thiamin (B1)", "mg", 1000], ["ribf", "Riboflavin (B2)", "mg", 1000],
  ["nia", "Niacin (B3)", "mg", 1000], ["pantac", "Pantothenic acid (B5)", "mg", 1000],
  ["vitb6c", "Vitamin B6", "mg", 1000], ["folsum", "Folate", "µg", 1_000_000],
  ["vitc", "Vitamin C", "mg", 1000], ["vita", "Vitamin A", "µg", 1_000_000],
  ["vitd", "Vitamin D", "µg", 1_000_000], ["vite", "Vitamin E", "mg", 1000],
  ["vitk1", "Vitamin K1", "µg", 1_000_000], ["ca", "Calcium", "mg", 1000],
  ["fe", "Iron", "mg", 1000], ["mg", "Magnesium", "mg", 1000],
  ["p", "Phosphorus", "mg", 1000], ["k", "Potassium", "mg", 1000],
  ["na", "Sodium", "mg", 1000], ["zn", "Zinc", "mg", 1000],
  ["cu", "Copper", "mg", 1000], ["mn", "Manganese", "mg", 1000],
  ["se", "Selenium", "µg", 1_000_000]
];

function numeric(value) {
  if (value == null || value === "" || value === "NA") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalize(text) {
  return String(text || "").normalize("NFKD").toLowerCase().replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim()
    .split(/\s+/).map((word) => word.endsWith("ies") && word.length > 4 ? `${word.slice(0, -3)}y` : word.endsWith("s") && !word.endsWith("ss") && word.length > 3 ? word.slice(0, -1) : word).join(" ");
}

function regionalAliases(text) {
  return String(text || "").split(/[;.]/).map((alias) => alias.replace(/^[a-z]{1,4}\.\s*/i, "").trim()).filter(Boolean);
}

function matchScore(row, query) {
  const name = normalize(row.name);
  const aliases = regionalAliases(row.lang).map(normalize);
  if (name === query || aliases.includes(query)) return 1000;
  if (name.startsWith(`${query} `) || query.startsWith(`${name} `)) return 100;
  if (aliases.some((alias) => alias && (alias.startsWith(`${query} `) || query.startsWith(`${alias} `)))) return 80;
  const words = query.split(" ").filter((word) => word.length > 2);
  const matched = words.filter((word) => name.includes(word) || aliases.some((alias) => alias.includes(word))).length;
  return words.length ? (matched / words.length) * 10 : 0;
}

export async function lookupIfctFood(foodName) {
  const query = normalize(foodName).split(/\s+/).filter((word) => !["fresh", "whole", "raw", "ripe", "uncooked", "unpeeled", "food", "item", "photo", "of"].includes(word)).join(" ");
  if (!query) return null;
  const rows = await loadFoodRows();
  const ranked = rows.map((row) => ({ row, score: matchScore(row, query) })).filter(({ score }) => score >= 9);
  if (!ranked.length) return null;
  ranked.sort((a, b) => b.score - a.score || a.row.name.length - b.row.name.length);
  const { row, score } = ranked[0];
  const value = (key) => numeric(row[key]);
  const fmt = (n, unit) => n == null ? null : `${n.toFixed(1)} ${unit}`;
  const nutrition = {
    calories: fmt(value("enerc") == null ? null : value("enerc") / 4.184, "kcal"),
    protein: fmt(value("protcnt"), "g"),
    carbs: fmt(value("choavldf"), "g"),
    fat: fmt(value("fatce"), "g"),
    saturatedFat: fmt(value("fasat"), "g"),
    sugar: fmt(value("fsugar"), "g"),
    fiber: fmt(value("fibtg"), "g"),
    salt: fmt(value("na") == null ? null : value("na") * 2.5, "g"),
    sodium: fmt(value("na") == null ? null : value("na") * 1000, "mg")
  };
  const detailedNutrients = detailFields.map(([code, name, unit, multiplier]) => {
    const amount = value(code);
    const uncertainty = value(`${code}_e`);
    if (amount == null) return null;
    return { code, name, value: fmt(amount * multiplier, unit), uncertainty: uncertainty == null ? null : fmt(uncertainty * multiplier, unit) };
  }).filter(Boolean);
  const nutriments = {
    "energy-kcal_100g": value("enerc") == null ? null : value("enerc") / 4.184,
    proteins_100g: value("protcnt"), carbohydrates_100g: value("choavldf"), fat_100g: value("fatce"),
    "saturated-fat_100g": value("fasat"), sugars_100g: value("fsugar"), fiber_100g: value("fibtg"),
    sodium_100g: value("na"), salt_100g: value("na") == null ? null : value("na") * 2.5
  };
  return {
    code: row.code,
    name: row.name,
    category: row.grup,
    aliases: regionalAliases(row.lang),
    nutrition,
    detailedNutrients,
    healthReportData: nutriments,
    matchConfidence: score >= 100 ? "exact" : "best-match",
    source: "IFCT 2017 (ICMR-NIN); composition values per 100 g edible portion."
  };
}
