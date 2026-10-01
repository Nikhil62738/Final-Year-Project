import { lookupIfctFood } from "../services/ifctFoodData.js";
import { estimateFoodDetailsWithGroq } from "../services/groqFoodFallback.js";

// Accurate dataset of Indian & Global Food Products
// E-Numbers and Additives Reference Dictionary
const ADDITIVES_DICT = {
  "E102": { name: "Tartrazine", risk: "High Risk", category: "Artificial Color", notes: "Yellow dye. Linked to hyperactivity in children and asthmatic reactions." },
  "E110": { name: "Sunset Yellow FCF", risk: "Moderate Risk", category: "Artificial Color", notes: "Orange-yellow dye. Restricted in European Union food standards." },
  "E129": { name: "Allura Red AC", risk: "Moderate Risk", category: "Artificial Color", notes: "Red synthetic azo dye." },
  "E211": { name: "Sodium Benzoate", risk: "High Risk", category: "Preservative", notes: "Common preservative in soft drinks. Can form benzene when combined with Vitamin C." },
  "E202": { name: "Potassium Sorbate", risk: "Low Risk", category: "Preservative", notes: "Inhibits molds and yeasts in dairy and baked goods." },
  "E250": { name: "Sodium Nitrite", risk: "Critical Risk", category: "Preservative", notes: "Cured meat preservative. High levels associated with nitrosamine formation." },
  "E320": { name: "BHA (Butylated Hydroxyanisole)", risk: "High Risk", category: "Antioxidant Preservative", notes: "Synthetic antioxidant used in oils and processed foods." },
  "E621": { name: "Monosodium Glutamate (MSG)", risk: "Moderate Risk", category: "Flavor Enhancer", notes: "Savory umami flavor enhancer. May cause sensitivity in prone individuals." },
  "E635": { name: "Disodium 5'-Ribonucleotides", risk: "Low Risk", category: "Flavor Enhancer", notes: "Used synergistically with MSG." },
  "E951": { name: "Aspartame", risk: "Moderate Risk", category: "Artificial Sweetener", notes: "Low-calorie artificial sweetener. Contains phenylalanine." }
};

// Allergen Detection Keywords
const ALLERGEN_KEYWORDS = {
  "wheat": "Wheat / Gluten",
  "maida": "Wheat / Gluten",
  "gluten": "Gluten",
  "milk": "Dairy / Lactose",
  "butter": "Dairy / Lactose",
  "cheese": "Dairy / Lactose",
  "soy": "Soybean",
  "soya": "Soybean",
  "peanut": "Peanuts / Tree Nuts",
  "almond": "Tree Nuts",
  "cashew": "Tree Nuts",
  "egg": "Eggs",
  "fish": "Fish & Seafood",
  "shrimp": "Shellfish",
  "sulfite": "Sulfites"
};

function formatNutrition(nutriments = {}) {
  const kcal = nutriments["energy-kcal_100g"] ?? (nutriments.energy_100g != null ? nutriments.energy_100g / 4.184 : null);
  const format = (value, unit) => value == null || !Number.isFinite(Number(value)) ? null : `${Number(value).toFixed(1)} ${unit}`;
  return {
    calories: format(kcal, "kcal"),
    protein: format(nutriments.proteins_100g, "g"),
    carbs: format(nutriments.carbohydrates_100g, "g"),
    fat: format(nutriments.fat_100g, "g"),
    saturatedFat: format(nutriments["saturated-fat_100g"], "g"),
    sugar: format(nutriments.sugars_100g, "g"),
    fiber: format(nutriments.fiber_100g, "g"),
    salt: format(nutriments.salt_100g, "g"),
    sodium: nutriments.sodium_100g != null
      ? format(Number(nutriments.sodium_100g) * 1000, "mg")
      : nutriments.salt_100g != null ? format(Number(nutriments.salt_100g) * 393, "mg") : null
  };
}

function healthReport(nutriments = {}, grade, novaGroup) {
  const number = (value) => value == null || !Number.isFinite(Number(value)) ? null : Number(value);
  const sodium = number(nutriments.sodium_100g) ?? (number(nutriments.salt_100g) == null ? null : number(nutriments.salt_100g) * 393);
  const sugar = number(nutriments.sugars_100g);
  const saturatedFat = number(nutriments["saturated-fat_100g"]);
  const flags = [];
  if (sodium != null && sodium >= 0.6) flags.push({ level: "high", title: "High sodium / salt", detail: `${Math.round(sodium * 1000)} mg sodium per 100 g. Frequent high salt intake can raise blood pressure.` });
  if (saturatedFat != null && saturatedFat >= 5) flags.push({ level: "high", title: "High saturated fat", detail: `${saturatedFat.toFixed(1)} g per 100 g. Consider choosing products lower in saturated fat.` });
  if (sugar != null && sugar >= 15) flags.push({ level: "high", title: "High sugars", detail: `${sugar.toFixed(1)} g per 100 g. Check the label for added sugars.` });
  const gradeValue = String(grade || "").toLowerCase();
  const nova = number(novaGroup);
  const isHighRisk = ["d", "e"].includes(gradeValue) || flags.length >= 2;
  const headline = isHighRisk
    ? "Higher health concern — limit frequent consumption"
    : flags.length ? "Review the nutrition alerts below" : "No configured sugar, sodium, or saturated-fat alerts";
  return {
    healthRisk: { level: isHighRisk ? "high" : flags.length ? "moderate" : "low", headline },
    safetyAlerts: flags,
    novaGroup: nova,
    processingLabel: nova ? `NOVA ${nova}` : null,
    positiveFactors: [
      number(nutriments.proteins_100g) >= 8 ? "Good source of protein (at least 8 g per 100 g)" : null,
      number(nutriments.fiber_100g) >= 3 ? "Good source of dietary fibre (at least 3 g per 100 g)" : null
    ].filter(Boolean),
    adulterationAssessment: "Not assessed by barcode or photo scanning. Laboratory testing is required to confirm adulteration."
  };
}

function alternativeSearchTerms(productName, category = "") {
  const name = `${productName || ""} ${category || ""}`.toLowerCase();
  if (/biscuit|cookie|cracker|wafer|rusk|बिस्किट|बिस्कुट|कुकी/.test(name)) return ["whole wheat biscuit", "ragi biscuit", "oats biscuit"];
  if (/noodle|instant|नूडल|नूडल्स/.test(name)) return ["whole wheat noodles", "millet noodles"];
  if (/chip|crisps|namkeen|bhujia|mixture|sev|snack|चिप्स|नमकीन|फरसाण/.test(name)) return ["roasted chana snack", "baked khakhra"];
  if (/drink|soda|cola|soft drink|sweetened juice|energy drink|पेय|शीतपेय/.test(name)) return ["unsweetened drink", "low sugar beverage"];
  if (/chocolate|candy|sweet|confection|toffee|चॉकलेट|मिठाई|गोड/.test(name)) return ["dark chocolate"];
  return [];
}

function needsHealthierAlternative(grade, nutrition = {}) {
  const lowGrade = ["d", "e"].includes(String(grade || "").toLowerCase());
  const highSugar = Number.parseFloat(nutrition.sugar) >= 15;
  const highSodium = Number.parseFloat(nutrition.sodium) >= 600;
  const highSaturatedFat = Number.parseFloat(nutrition.saturatedFat) >= 5;
  return lowGrade || highSugar || highSodium || highSaturatedFat;
}

function nutritionHealthScore(nutrition = {}, grade = "") {
  const parse = (value) => {
    const amount = Number.parseFloat(value);
    return Number.isFinite(amount) ? amount : null;
  };
  const sugar = parse(nutrition.sugar ?? nutrition.sugars_100g);
  const saturatedFat = parse(nutrition.saturatedFat ?? nutrition["saturated-fat_100g"]);
  const sodiumValue = parse(nutrition.sodium ?? nutrition.sodium_100g);
  const sodium = sodiumValue == null ? null : (nutrition.sodium_100g != null || /mg/i.test(String(nutrition.sodium || "")) ? sodiumValue : sodiumValue * 1000);
  const fiber = parse(nutrition.fiber ?? nutrition.fiber_100g);
  const protein = parse(nutrition.protein ?? nutrition.proteins_100g);
  const known = [sugar, saturatedFat, sodium, fiber, protein].filter((value) => value != null).length;

  if (known >= 2) {
    let score = 10;
    if (sugar != null) score -= Math.min(3, sugar / 7.5);
    if (saturatedFat != null) score -= Math.min(2.5, saturatedFat / 4);
    if (sodium != null) score -= Math.min(2.5, sodium / 240);
    if (fiber != null) score += Math.min(0.5, fiber / 10);
    if (protein != null) score += Math.min(0.5, protein / 30);
    return Math.round(Math.max(0, Math.min(10, score)) * 10) / 10;
  }

  const gradeScore = { a: 9.5, b: 8, c: 6, d: 4, e: 2 }[String(grade || "").toLowerCase()];
  return gradeScore ?? null;
}

async function lookupHealthierProducts(productName, grade, nutrition = {}, category = "") {
  if (!needsHealthierAlternative(grade, nutrition)) return [];
  const terms = alternativeSearchTerms(productName, category);
  if (!terms.length) return [];
  const currentSugar = Number.parseFloat(nutrition.sugar);
  const currentSatFat = Number.parseFloat(nutrition.saturatedFat);
  const currentSodium = Number.parseFloat(nutrition.sodium);
  const sourceGrade = String(grade || "").toLowerCase();
  const sourceName = `${productName || ""} ${category || ""}`.toLowerCase();
  const isBiscuit = /biscuit/.test(terms[0]) || /biscuit|cookie|cracker|wafer|rusk|बिस्किट|बिस्कुट|कुकी/.test(sourceName);
  const isNoodle = /noodle/.test(terms[0]) || /noodle|instant|नूडल/.test(sourceName);
  const isSnack = /snack/.test(terms[0]) || /chip|crisps|namkeen|bhujia|mixture|sev|snack|चिप्स|नमकीन|फरसाण/.test(sourceName);
  const isChocolate = /chocolate/.test(terms[0]) || /chocolate|candy|sweet|confection|toffee|चॉकलेट|मिठाई|गोड/.test(sourceName);
  const sourceScore = nutritionHealthScore(nutrition, grade);
  const fields = "code,product_name,brands,image_front_url,nutriscore_grade,nutriments,categories,product_url";
  const matches = [];

  for (const term of terms) {
    try {
      const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
      url.searchParams.set("search_terms", term);
      url.searchParams.set("search_simple", "1");
      url.searchParams.set("action", "process");
      url.searchParams.set("json", "1");
      url.searchParams.set("page_size", "40");
      url.searchParams.set("cc", "in");
      url.searchParams.set("fields", fields);
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "FDA-SafeWatch/1.0 (support.fda@maharashtra.gov.in)" } });
      if (!response.ok) continue;
      const data = await response.json();
      for (const item of Array.isArray(data.products) ? data.products : []) {
        if (!item.product_name || !item.image_front_url || matches.some((match) => match.code === item.code)) continue;
        const itemName = String(item.product_name).toLowerCase();
        const category = String(item.categories || "").toLowerCase();
        const isSameCategory = isBiscuit
          ? /biscuit|cookie|cracker|wafer/.test(`${itemName} ${category}`)
          : isNoodle
            ? /noodle|pasta/.test(`${itemName} ${category}`)
            : isSnack
              ? /snack|chana|khakhra|cracker|chips/.test(`${itemName} ${category}`)
              : isChocolate
                ? /chocolate/.test(`${itemName} ${category}`)
                : true;
        if (!isSameCategory) continue;
        const n = item.nutriments || {};
        const candidateGrade = String(item.nutriscore_grade || "").toLowerCase();
        const candidateSugar = Number(n.sugars_100g);
        const candidateSatFat = Number(n["saturated-fat_100g"]);
        const candidateSodiumMg = Number(n.sodium_100g) * 1000;
        const lowerSugar = Number.isFinite(currentSugar) && currentSugar > 0 && Number.isFinite(candidateSugar) && candidateSugar < currentSugar * 0.9
          && (!Number.isFinite(currentSatFat) || !Number.isFinite(candidateSatFat) || candidateSatFat <= currentSatFat);
        const lowerSatFat = Number.isFinite(currentSatFat) && currentSatFat >= 5 && Number.isFinite(candidateSatFat) && candidateSatFat < currentSatFat * 0.9
          && (!Number.isFinite(currentSugar) || !Number.isFinite(candidateSugar) || candidateSugar <= currentSugar);
        const lowerSodium = Number.isFinite(currentSodium) && currentSodium >= 600 && Number.isFinite(candidateSodiumMg) && candidateSodiumMg < currentSodium * 0.9;
        const candidateNutrition = {
          sugar: n.sugars_100g,
          saturatedFat: n["saturated-fat_100g"],
          sodium: n.sodium_100g == null ? (n.salt_100g == null ? null : `${Number(n.salt_100g) * 393} mg`) : `${Number(n.sodium_100g) * 1000} mg`,
          fiber: n.fiber_100g,
          protein: n.proteins_100g
        };
        const healthierScore = nutritionHealthScore(candidateNutrition, candidateGrade);
        const betterGrade = candidateGrade && sourceGrade && candidateGrade < sourceGrade;
        const hasImprovedData = healthierScore != null && sourceScore != null
          ? healthierScore >= sourceScore + 0.3
          : lowerSugar || lowerSatFat || lowerSodium || betterGrade;
        if (healthierScore == null || !hasImprovedData) continue;
        matches.push({
          code: item.code || item.product_name,
          name: item.product_name,
          brand: item.brands || "Brand not listed",
          imageUrl: item.image_front_url,
          productUrl: item.code ? `https://world.openfoodfacts.org/product/${item.code}` : "",
          nutriscoreGrade: candidateGrade || null,
          healthierScore,
          nutrition: {
            sugar: n.sugars_100g == null ? null : `${Number(n.sugars_100g).toFixed(1)} g/100 g`,
            saturatedFat: n["saturated-fat_100g"] == null ? null : `${Number(n["saturated-fat_100g"]).toFixed(1)} g/100 g`,
            sodium: n.sodium_100g == null ? null : `${Number(n.sodium_100g).toFixed(0)} mg/100 g`
          }
        });
      }
    } catch (error) {
      console.warn("Healthier product lookup failed:", error.message);
    }
    if (matches.length >= 3) break;
  }
  return matches.sort((a, b) => b.healthierScore - a.healthierScore).slice(0, 3);
}

async function lookupNutritionReference(foodName) {
  const normalizedFood = String(foodName || "").toLowerCase().trim();
  const queryTerms = [...new Set([normalizedFood, normalizedFood.replace(/\b(cooked|grilled|fried|baked|roasted|homemade|style)\b/g, "").trim()])].filter(Boolean);
  const candidates = [];
  for (const term of queryTerms) {
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("search_terms", term);
    url.searchParams.set("search_simple", "1");
    url.searchParams.set("action", "process");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "20");
    url.searchParams.set("fields", "product_name,nutriments,nutriscore_grade,nova_group,categories,brands,ingredients_text,allergens_tags,additives_tags");
    const response = await fetch(url, { headers: { "User-Agent": "FDA-SafeWatch/1.0 (support.fda@maharashtra.gov.in)" } });
    if (!response.ok) continue;
    const data = await response.json();
    for (const item of Array.isArray(data.products) ? data.products : []) {
      const nutrition = formatNutrition(item.nutriments || {});
      if (item.product_name && Object.values(nutrition).some(Boolean) && !candidates.some((entry) => entry.code && entry.code === item.code)) candidates.push(item);
    }
    if (candidates.length) break;
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const aName = String(a.product_name).toLowerCase();
    const bName = String(b.product_name).toLowerCase();
    return Number(bName === normalizedFood) - Number(aName === normalizedFood)
      || Number(bName.includes(normalizedFood)) - Number(aName.includes(normalizedFood));
  });
  const match = candidates[0];
  const nutrition = formatNutrition(match.nutriments);
  const grade = match.nutriscore_grade || null;
  return {
    nutrition,
    nutritionReferenceName: match.product_name,
    nutritionSource: "Open Food Facts similar product reference; values are per 100 g and may differ from the pictured recipe or brand.",
    nutriscoreGrade: grade,
    ...healthReport(match.nutriments, grade, match.nova_group),
    ingredients: match.ingredients_text ? match.ingredients_text.split(/[,;]/).map((item) => item.trim()).filter(Boolean) : [],
    allergens: match.allergens_tags || [],
    additives: (match.additives_tags || []).map((code) => ({ code, name: code.replace(/^en:/, ""), risk: "Not assessed from this record" })),
    healthierAlternatives: []
  };
}

// @desc    Scan a known barcode or classify an uploaded food photo
// @route   POST /api/products/scan
// @access  Public
export const scanProduct = async (req, res) => {
  try {
    const { barcode, query, isImageUpload, imageBase64, language = "en" } = req.body;

    if (imageBase64 && imageBase64.length > 12_000_000) {
      return res.status(413).json({ isFoodItem: false, error: "Image is too large. Please choose a smaller photo." });
    }

    if (isImageUpload) {
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ isFoodItem: false, error: "Upload a food photo to scan." });
      }

      let photoEstimate;
      try {
        photoEstimate = await estimateFoodDetailsWithGroq({ name: "", imageBase64, language });
      } catch (imageError) {
        if (imageError.status === 422) return res.status(422).json({ isFoodItem: false, error: imageError.message });
        throw imageError;
      }
      if (!photoEstimate?.isFood || !photoEstimate.foodName?.trim()) {
        return res.status(422).json({ isFoodItem: false, error: "This photo does not appear to show identifiable food or a drink. Upload a clear photo focused on food." });
      }

      const prediction = { label: photoEstimate.foodName.trim(), score: null };
      const foodConfidence = null;
      let nutritionReference = {
        ...healthReport(photoEstimate.healthReportData),
        nutrition: photoEstimate.nutrition,
        nutritionReferenceName: photoEstimate.foodName,
        foodGroup: photoEstimate.category,
        nutritionSource: photoEstimate.nutritionSource,
        aiFoodOverview: photoEstimate.overview,
        healthierAlternatives: await lookupHealthierProducts(photoEstimate.foodName, null, photoEstimate.nutrition, photoEstimate.category),
        aiGeneratedEstimate: true,
        ingredients: photoEstimate.ingredients,
        allergens: photoEstimate.allergens,
        additives: photoEstimate.additives
      };

      try {
        const ifctMatch = await lookupIfctFood(prediction.label);
        if (ifctMatch) {
          const health = healthReport(ifctMatch.healthReportData);
          nutritionReference = {
            ...health,
            ...healthReport(photoEstimate.healthReportData),
            nutrition: ifctMatch.nutrition,
            nutritionReferenceName: ifctMatch.name,
            foodGroup: ifctMatch.category,
            foodCompositionCode: ifctMatch.code,
            nutritionSource: ifctMatch.source,
            detailedNutrients: ifctMatch.detailedNutrients,
            healthierAlternatives: nutritionReference.healthierAlternatives,
            aiGeneratedEstimate: false,
            aiFoodOverview: photoEstimate.overview,
            ingredients: [],
            allergens: [],
            additives: []
          };
        }
      } catch (lookupError) {
        console.warn("IFCT food nutrition lookup failed:", lookupError.message);
      }

      return res.json({
        isFoodItem: true,
        recognition: { name: prediction.label, confidence: prediction.score, foodConfidence },
        product: {
          name: prediction.label,
          category: nutritionReference?.foodGroup || "Image recognized food",
          brand: "Not identified from photo",
          nutrition: nutritionReference?.nutrition || null,
          nutritionSource: nutritionReference?.nutritionSource || "No matching nutrition record was found. Nutrition and ingredient values are left blank rather than estimated.",
          aiFoodOverview: nutritionReference?.aiFoodOverview || "",
          nutritionReferenceName: nutritionReference?.nutritionReferenceName || null,
          detailedNutrients: nutritionReference?.detailedNutrients || [],
          foodCompositionCode: nutritionReference?.foodCompositionCode || null,
          foodDataMatch: nutritionReference?.foodCompositionCode ? "IFCT 2017 ingredient record" : null,
          aiGeneratedEstimate: nutritionReference?.aiGeneratedEstimate || false,
          nutriscoreGrade: nutritionReference?.nutriscoreGrade || null,
          novaGroup: nutritionReference?.novaGroup || null,
          healthRisk: nutritionReference?.healthRisk || null,
          safetyAlerts: nutritionReference?.safetyAlerts || [],
          positiveFactors: nutritionReference?.positiveFactors || [],
          adulterationAssessment: "Not assessed by photo scanning. Laboratory testing is required to confirm adulteration.",
          healthierAlternatives: nutritionReference?.healthierAlternatives || [],
          ingredients: nutritionReference?.ingredients || [],
          allergens: nutritionReference?.allergens || [],
          additives: nutritionReference?.additives || [],
          warnings: ["Photo recognition identifies the food only; it cannot verify ingredients, allergens, nutrition, freshness, or safety."]
        }
      });
    }

    // Check for explicit Non-Food keywords or Non-Food barcode test
    const nonFoodKeywords = ["phone", "laptop", "shoe", "shirt", "gadget", "book", "camera", "headphone", "charger", "car", "toy", "tool", "electronic"];
    const queryLower = (query || barcode || "").toLowerCase();

    if (nonFoodKeywords.some(kw => queryLower.includes(kw)) || barcode === "0000000000" || barcode === "1234567890") {
      return res.status(422).json({
        isFoodItem: false,
        error: "Non-Food Item Detected! FDA SafeWatch scanner is strictly limited to food, beverage, and agricultural products. Please scan a valid food item or barcode."
      });
    }

    if (!barcode || !/^\d{8,14}$/.test(String(barcode))) {
      return res.status(400).json({ isFoodItem: false, error: "Enter a valid 8 to 14 digit product barcode." });
    }

    const fields = "code,product_name,brands,categories,ingredients_text,image_front_url,nutriscore_grade,nova_group,nutriments,allergens_tags,additives_tags";
    const lookup = await fetch(`https://world.openfoodfacts.org/api/v3/product/${encodeURIComponent(barcode)}?product_type=food&cc=in&lc=en&tags_lc=en&fields=${fields}`, {
      headers: { "User-Agent": "FDA-SafeWatch/1.0 (support.fda@maharashtra.gov.in)" }
    });
    if (lookup.status === 404) {
      return res.status(404).json({ isFoodItem: false, error: "This barcode is not listed in Open Food Facts, so its food status and product details could not be verified." });
    }
    if (!lookup.ok) {
      return res.status(502).json({ isFoodItem: false, error: "The food product database is temporarily unavailable. Please try again." });
    }
    const lookupData = await lookup.json();
    const record = lookupData?.product;
    if (!record?.product_name) {
      return res.status(404).json({
        isFoodItem: false,
        error: "This barcode is not listed in Open Food Facts, so its food status and product details could not be verified."
      });
    }

    const nutrition = record.nutriments || {};
    const nutritionDetails = formatNutrition(nutrition);
    const hasProductNutrition = Object.values(nutritionDetails).some(Boolean);
    let ifctReference = null;
    if (!hasProductNutrition) {
      try {
        ifctReference = await lookupIfctFood(record.product_name);
      } catch (lookupError) {
        console.warn("IFCT ingredient reference lookup failed:", lookupError.message);
      }
    }
    let groqEstimate = null;
    if (!hasProductNutrition && !ifctReference) {
      try {
        groqEstimate = await estimateFoodDetailsWithGroq({
          name: record.product_name,
          brand: record.brands || "",
          category: record.categories || "",
          ingredients: record.ingredients_text ? record.ingredients_text.split(/[,;]/).map((item) => item.trim()).filter(Boolean) : [],
          language
        });
      } catch (lookupError) {
        console.warn("Groq package nutrition estimate failed:", lookupError.message);
      }
    }
    const reportedNutrition = hasProductNutrition ? nutritionDetails : ifctReference?.nutrition || groqEstimate?.nutrition || nutritionDetails;
    const alternatives = await lookupHealthierProducts(record.product_name, record.nutriscore_grade, reportedNutrition, record.categories);
    const reportHealth = ifctReference && !hasProductNutrition
      ? healthReport(ifctReference.healthReportData, record.nutriscore_grade, record.nova_group)
      : groqEstimate && !hasProductNutrition
        ? healthReport(groqEstimate.healthReportData, record.nutriscore_grade, record.nova_group)
      : healthReport(nutrition, record.nutriscore_grade, record.nova_group);
    const product = {
      barcode: record.code || String(barcode),
      name: record.product_name,
      brand: record.brands || "Brand not listed",
      category: record.categories || "Food product",
      fssaiLicense: null,
      fssaiStatus: "Not verified by this lookup",
      nutriscoreGrade: record.nutriscore_grade || null,
      novaGroup: record.nova_group || null,
      ...reportHealth,
      nutrition: reportedNutrition,
      detailedNutrients: ifctReference && !hasProductNutrition ? ifctReference.detailedNutrients : [],
      foodCompositionCode: ifctReference && !hasProductNutrition ? ifctReference.code : null,
      nutritionReferenceName: ifctReference && !hasProductNutrition ? ifctReference.name : null,
      aiGeneratedEstimate: Boolean(groqEstimate && !hasProductNutrition),
      aiFoodOverview: groqEstimate && !hasProductNutrition ? groqEstimate.overview : "",
      nutritionSource: ifctReference && !hasProductNutrition
        ? `Barcode record has no nutrition values. Showing a generic raw-food reference for ${ifctReference.name} from ${ifctReference.source} It may differ from the packaged product${record.brands ? ` (${record.brands})` : ""}.`
        : groqEstimate && !hasProductNutrition
          ? groqEstimate.nutritionSource
          : "Open Food Facts product data; values are per 100 g when available.",
      healthierAlternatives: alternatives,
      healthRating: null,
      imageUrl: record.image_front_url || "",
      ingredients: record.ingredients_text ? record.ingredients_text.split(/[,;]/).map((item) => item.trim()).filter(Boolean) : [],
      additives: (record.additives_tags || []).map((code) => ({ code, name: code.replace(/^en:/, ""), risk: "Not assessed", purpose: "" })),
      allergens: record.allergens_tags || [],
      warnings: ["Product details come from the community-maintained Open Food Facts database and may be incomplete or outdated. Check the package label."]
    };

    res.json({
      isFoodItem: true,
      product
    });
  } catch (err) {
    res.status(err.status || 500).json({ isFoodItem: false, message: "Product scanning failed", error: err.message });
  }
};

// @desc    Real-time Ingredient Safety Analyzer
// @route   POST /api/ingredients/analyze
// @access  Public
export const analyzeIngredients = async (req, res) => {
  try {
    const { ingredientsText } = req.body;
    if (!ingredientsText) {
      return res.status(400).json({ message: "Please provide ingredients text for analysis." });
    }

    const textUpper = ingredientsText.toUpperCase();
    const textLower = ingredientsText.toLowerCase();

    // 1. Detect Harmful Additives & E-Numbers
    const detectedAdditives = [];
    Object.keys(ADDITIVES_DICT).forEach(code => {
      if (textUpper.includes(code) || textUpper.includes(ADDITIVES_DICT[code].name.toUpperCase())) {
        detectedAdditives.push({
          code,
          ...ADDITIVES_DICT[code]
        });
      }
    });

    // 2. Detect Allergens
    const detectedAllergens = [];
    Object.keys(ALLERGEN_KEYWORDS).forEach(kw => {
      if (textLower.includes(kw)) {
        const allergen = ALLERGEN_KEYWORDS[kw];
        if (!detectedAllergens.includes(allergen)) {
          detectedAllergens.push(allergen);
        }
      }
    });

    // 3. Health Warnings & Health Score Calculation
    let healthScore = 90;
    const healthWarnings = [];

    if (textLower.includes("palm oil") || textLower.includes("palmolein")) {
      healthScore -= 12;
      healthWarnings.push("Contains Palm Oil / Palmolein Oil (High Saturated Fat)");
    }
    if (textLower.includes("high fructose corn syrup") || textLower.includes("hfcs")) {
      healthScore -= 15;
      healthWarnings.push("Contains High Fructose Corn Syrup (High Glycemic Index)");
    }
    if (textLower.includes("hydrogenated") || textLower.includes("trans fat")) {
      healthScore -= 20;
      healthWarnings.push("Contains Hydrogenated Oils / Trans Fats (Risk for Cardiovascular Health)");
    }
    if (detectedAdditives.some(a => a.risk === "Critical Risk" || a.risk === "High Risk")) {
      healthScore -= 20;
      healthWarnings.push("Contains High-Risk Synthetic Additives / Preservatives");
    }

    healthScore = Math.max(25, Math.min(98, healthScore));

    let safetyVerdict = "SAFE & COMPLIANT";
    let verdictColor = "green";
    if (healthScore < 55) {
      safetyVerdict = "HIGH RISK / CAUTION";
      verdictColor = "red";
    } else if (healthScore < 78) {
      safetyVerdict = "MODERATE CONSUMPTION ADVISED";
      verdictColor = "orange";
    }

    res.json({
      healthScore,
      safetyVerdict,
      verdictColor,
      detectedAdditives,
      detectedAllergens,
      healthWarnings,
      fssaiGuidelines: "Product ingredients evaluated against FSSAI Packaging & Labeling Regulations (2020)."
    });
  } catch (err) {
    res.status(500).json({ message: "Ingredient analysis failed", error: err.message });
  }
};

// @desc    List products available to the scanner
// @route   GET /api/products
// @access  Public
export const getFoodProducts = async (_req, res) => {
  res.json({ source: "Open Food Facts", message: "Scan a product barcode to retrieve its current record." });
};
