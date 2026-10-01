const DEFAULT_MODEL = "qwen/qwen3.8-27b";

function cleanNumber(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function cleanList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 10) : [];
}

function normalizeImageDataUrl(input) {
  let value = String(input || "").trim();
  let mime = "image/jpeg";
  const prefix = value.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,/i);
  if (prefix) {
    mime = prefix[1].toLowerCase().replace("image/jpg", "image/jpeg");
    value = value.slice(prefix[0].length);
  }
  // Accept both data URLs (web client) and raw base64 (mobile app).
  value = value.replace(/^data:image\/[^;,]+;base64,/i, "").replace(/\s+/g, "").replace(/-/g, "+").replace(/_/g, "/");
  if (!value || !/^[A-Za-z0-9+/]*={0,2}$/.test(value) || value.replace(/=+$/, "").length % 4 === 1) {
    const error = new Error("The uploaded image data is invalid. Please select the photo again.");
    error.status = 422;
    throw error;
  }
  value = value.replace(/=+$/, "");
  value += "=".repeat((4 - value.length % 4) % 4);
  if (mime === "image/jpeg") {
    if (value.startsWith("iVBORw0KGgo")) mime = "image/png";
    else if (value.startsWith("UklGR")) mime = "image/webp";
    else if (value.startsWith("R0lGOD")) mime = "image/gif";
  }
  return `data:${mime};base64,${value}`;
}

export async function estimateFoodDetailsWithGroq({ name, brand = "", category = "", ingredients = [], imageBase64 = "", language = "en" }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    if (!imageBase64) return null;
    const error = new Error("Photo food scanning requires GROQ_API_KEY in server/.env.");
    error.status = 503;
    throw error;
  }

  const knownIngredients = cleanList(ingredients);
  const responseLanguage = language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";
  const imageDataUrl = imageBase64 ? normalizeImageDataUrl(imageBase64) : "";
  const prompt = [
    imageBase64
      ? "Inspect the uploaded image. Decide first whether its main visible subject is edible food or a drink. If it is not food, set isFood to false, leave foodName and category empty, set every nutrition value to null, and return empty arrays for ingredients, additives, allergens, and alternatives. If food is visible, set isFood to true and identify the main food."
      : "The named item is a food product. Set isFood to true and return a cautious nutrition profile.",
    `Food name or image hint: ${name || "identify from the uploaded photo"}. Brand: ${brand || "not known"}. Category: ${category || "not known"}.`,
    `Known package ingredients, if any: ${knownIngredients.length ? knownIngredients.join(", ") : "none supplied"}.`,
    `Write foodName, category, and overview in ${responseLanguage}. Keep branded product names as printed when they are known.`,
    "For food images, estimate generic nutrition per 100 g for the identified food only; return null for values that cannot be reasonably estimated. Give energy kcal, protein g, carbohydrates g, total fat g, saturated fat g, total sugars g, dietary fibre g, sodium mg.",
    "Use null for nutrient values that cannot be reasonably estimated. Do not claim laboratory measurement, official approval, FSSAI verification, freshness, adulteration detection, or exact brand-specific label values.",
    "Only repeat ingredients supplied above. Do not infer package ingredients, additives, or allergens. Return healthier alternatives only when the food is generally high in sugar, sodium, saturated fat, or highly processed; otherwise return an empty list. Provide a short neutral food description.",
    "Return only a JSON object with these fields: isFood (boolean), foodName (string), category (string), nutrition (object with caloriesKcal, proteinG, carbohydratesG, fatG, saturatedFatG, sugarsG, fiberG, sodiumMg as numbers or null), ingredients (string array), additives (string array), allergens (string array), healthierAlternatives (string array), overview (string)."
  ].join("\n");

  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const messageContent = [{ type: "text", text: prompt }];
  if (imageDataUrl) messageContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: messageContent }],
      response_format: { type: "json_object" },
      temperature: 0,
      max_completion_tokens: 1200
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Groq food detail request failed (${response.status})${detail ? `: ${detail.slice(0, 240)}` : ""}`);
  }
  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned no food details.");
  const details = JSON.parse(text);
  if (imageBase64 && details.isFood === false) return { isFood: false };
  const n = details.nutrition || {};
  const nutrition = {
    calories: cleanNumber(n.caloriesKcal) == null ? null : `${cleanNumber(n.caloriesKcal).toFixed(1)} kcal`,
    protein: cleanNumber(n.proteinG) == null ? null : `${cleanNumber(n.proteinG).toFixed(1)} g`,
    carbs: cleanNumber(n.carbohydratesG) == null ? null : `${cleanNumber(n.carbohydratesG).toFixed(1)} g`,
    fat: cleanNumber(n.fatG) == null ? null : `${cleanNumber(n.fatG).toFixed(1)} g`,
    saturatedFat: cleanNumber(n.saturatedFatG) == null ? null : `${cleanNumber(n.saturatedFatG).toFixed(1)} g`,
    sugar: cleanNumber(n.sugarsG) == null ? null : `${cleanNumber(n.sugarsG).toFixed(1)} g`,
    fiber: cleanNumber(n.fiberG) == null ? null : `${cleanNumber(n.fiberG).toFixed(1)} g`,
    sodium: cleanNumber(n.sodiumMg) == null ? null : `${cleanNumber(n.sodiumMg).toFixed(1)} mg`
  };
  const healthReportData = {
    "energy-kcal_100g": cleanNumber(n.caloriesKcal), proteins_100g: cleanNumber(n.proteinG),
    carbohydrates_100g: cleanNumber(n.carbohydratesG), fat_100g: cleanNumber(n.fatG),
    "saturated-fat_100g": cleanNumber(n.saturatedFatG), sugars_100g: cleanNumber(n.sugarsG),
    fiber_100g: cleanNumber(n.fiberG), sodium_100g: cleanNumber(n.sodiumMg) == null ? null : cleanNumber(n.sodiumMg) / 1000
  };
  return {
    isFood: details.isFood !== false,
    foodName: typeof details.foodName === "string" ? details.foodName : name,
    category: typeof details.category === "string" ? details.category : category,
    nutrition,
    healthReportData,
    ingredients: knownIngredients,
    additives: [],
    allergens: [],
    healthierAlternatives: cleanList(details.healthierAlternatives),
    overview: typeof details.overview === "string" ? details.overview.slice(0, 500) : "",
    nutritionSource: "AI-generated estimate from Groq; not verified product-label or laboratory data. Values may vary by recipe, brand, and serving preparation."
  };
}
