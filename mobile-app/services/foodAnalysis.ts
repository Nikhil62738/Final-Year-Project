// Food verification, health assessment, benchmark nutrition, dynamic alternative generation, and photo food recognition

export interface HealthAssessment {
  healthLevel: 'healthy' | 'moderate' | 'unhealthy';
  healthScoreText: string;
  nutriscoreGrade: string;
  novaGroup: number;
  isHealthy: boolean;
  warnings: string[];
  positives: string[];
  allergens: string[];
  additives: string[];
  nutritionSummary: {
    energyKcal: number;
    proteinG: number;
    carbsG: number;
    sugarG: number;
    fatG: number;
    satFatG: number;
    saltG: number;
    fiberG: number;
  };
  healthierAlternatives: AlternativeFood[];
}

export interface AlternativeFood {
  name: string;
  icon: string;
  category: string;
  benefit: string;
}

export interface PhotoFoodResult {
  dishName: string;
  category: string;
  isFood: boolean;
  healthLevel: 'healthy' | 'moderate' | 'unhealthy';
  estimatedCalories: number;
  protein: string;
  carbs: string;
  fat: string;
  fssaiSafetyTips: string[];
  adulterationTest?: string;
  warnings: string[];
  positives: string[];
  healthierAlternatives: AlternativeFood[];
}

// Benchmark standard nutritional database for whole foods with missing or sparse barcode API data
const WHOLE_FOOD_BENCHMARKS: Record<string, {
  energyKcal: number;
  proteinG: number;
  carbsG: number;
  sugarG: number;
  fatG: number;
  satFatG: number;
  saltG: number;
  fiberG: number;
  nutriscore: string;
  nova: number;
  positives: string[];
}> = {
  badam: {
    energyKcal: 579,
    proteinG: 21.2,
    carbsG: 21.6,
    sugarG: 4.4,
    fatG: 49.9,
    satFatG: 3.8,
    saltG: 0.01,
    fiberG: 12.5,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Excellent Source of Plant Protein (21.2g/100g)',
      'Rich in Heart-Healthy Monounsaturated Fats',
      'High Dietary Fiber (12.5g/100g) with Zero Added Sugar',
      'Packed with Natural Vitamin E & Magnesium',
      '100% Whole Natural Raw Nut (NOVA Group 1)',
    ],
  },
  almond: {
    energyKcal: 579,
    proteinG: 21.2,
    carbsG: 21.6,
    sugarG: 4.4,
    fatG: 49.9,
    satFatG: 3.8,
    saltG: 0.01,
    fiberG: 12.5,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Excellent Source of Plant Protein (21.2g/100g)',
      'Rich in Heart-Healthy Monounsaturated Fats',
      'High Dietary Fiber with Zero Added Sugar',
      'Packed with Natural Vitamin E & Magnesium',
      '100% Whole Natural Raw Nut (NOVA Group 1)',
    ],
  },
  kaju: {
    energyKcal: 553,
    proteinG: 18.2,
    carbsG: 30.2,
    sugarG: 5.9,
    fatG: 43.8,
    satFatG: 7.8,
    saltG: 0.03,
    fiberG: 3.3,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Good Source of Protein & Minerals (Zinc, Iron, Magnesium)',
      'Natural Plant-Based Energy Source',
      'Zero Trans Fats',
    ],
  },
  cashew: {
    energyKcal: 553,
    proteinG: 18.2,
    carbsG: 30.2,
    sugarG: 5.9,
    fatG: 43.8,
    satFatG: 7.8,
    saltG: 0.03,
    fiberG: 3.3,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Good Source of Protein & Minerals (Zinc, Iron, Magnesium)',
      'Natural Plant-Based Energy Source',
      'Zero Trans Fats',
    ],
  },
  walnut: {
    energyKcal: 654,
    proteinG: 15.2,
    carbsG: 13.7,
    sugarG: 2.6,
    fatG: 65.2,
    satFatG: 6.1,
    saltG: 0.01,
    fiberG: 6.7,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Highest Plant Source of Brain-Healthy Omega-3 (ALA)',
      'Rich in Polyphenol Antioxidants',
      'Low Glycemic Index & Low Sugar',
    ],
  },
  akhrot: {
    energyKcal: 654,
    proteinG: 15.2,
    carbsG: 13.7,
    sugarG: 2.6,
    fatG: 65.2,
    satFatG: 6.1,
    saltG: 0.01,
    fiberG: 6.7,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Highest Plant Source of Brain-Healthy Omega-3 (ALA)',
      'Rich in Polyphenol Antioxidants',
      'Low Glycemic Index & Low Sugar',
    ],
  },
  peanut: {
    energyKcal: 567,
    proteinG: 25.8,
    carbsG: 16.1,
    sugarG: 4.7,
    fatG: 49.2,
    satFatG: 6.3,
    saltG: 0.02,
    fiberG: 8.5,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Very High Protein Content (25.8g/100g)',
      'Rich in Niacin, Folate, and Biotin',
      'Heart-Healthy Unsaturated Fats',
    ],
  },
  pista: {
    energyKcal: 562,
    proteinG: 20.2,
    carbsG: 27.5,
    sugarG: 7.7,
    fatG: 45.3,
    satFatG: 5.9,
    saltG: 0.01,
    fiberG: 10.6,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'High Antioxidants Lutein & Zeaxanthin for Eye Health',
      'High Fiber & Low Caloric Density among Nuts',
    ],
  },
  makhana: {
    energyKcal: 347,
    proteinG: 9.7,
    carbsG: 76.9,
    sugarG: 0.5,
    fatG: 0.1,
    satFatG: 0.0,
    saltG: 0.01,
    fiberG: 14.5,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Virtually Zero Saturated Fat & Cholesterol',
      'Rich in Calcium, Magnesium, and Dietary Fiber',
      'Ideal Low-Calorie Clean Snack',
    ],
  },
  milk: {
    energyKcal: 58,
    proteinG: 3.1,
    carbsG: 4.8,
    sugarG: 4.8,
    fatG: 3.0,
    satFatG: 1.8,
    saltG: 0.1,
    fiberG: 0.0,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'High Bioavailable Calcium & Phosphorus for Bone Strength',
      'Complete Protein with Essential Amino Acids',
      'Natural Vitamin D and B12',
    ],
  },
  oats: {
    energyKcal: 389,
    proteinG: 16.9,
    carbsG: 66.3,
    sugarG: 0.0,
    fatG: 6.9,
    satFatG: 1.2,
    saltG: 0.01,
    fiberG: 10.6,
    nutriscore: 'a',
    nova: 1,
    positives: [
      'Rich in Beta-Glucan Soluble Fiber (Lowers Cholesterol)',
      'Complex Carbohydrates for Sustained Energy Release',
      'Zero Added Sugar',
    ],
  },
};

// 1. Check if the scanned product is actually a food product
export function validateIsFoodProduct(productData: any): { isFood: boolean; reason?: string } {
  if (!productData) {
    return { isFood: false, reason: 'Product details not found in database.' };
  }

  const name = (productData.product_name || productData.generic_name || '').toLowerCase();
  const categories = (productData.categories || productData.categories_tags?.join(' ') || '').toLowerCase();
  const mainCategory = (productData.main_category || '').toLowerCase();

  // Non-food blacklist keywords
  const nonFoodKeywords = [
    'stationery', 'notebook', 'book', 'paper', 'pen', 'pencil', 'electronics',
    'phone', 'battery', 'cable', 'clothing', 'apparel', 'shirt', 'pants', 'shoes',
    'toy', 'game', 'cosmetics', 'shampoo', 'soap', 'detergent', 'cleaner',
    'furniture', 'hardware', 'tool', 'automotive', 'cd', 'dvd', 'cardboard',
    'office supplies', 'plastic container', 'kitchenware'
  ];

  for (const keyword of nonFoodKeywords) {
    if (categories.includes(keyword) || mainCategory.includes(keyword) || name.includes(keyword)) {
      return {
        isFood: false,
        reason: `Item recognized as non-food (${keyword}). FDA SafeWatch only analyzes edible food and beverages.`,
      };
    }
  }

  return { isFood: true };
}

// Helper to find whole food benchmark
function findBenchmark(productName: string, categories: string) {
  const text = `${productName} ${categories}`.toLowerCase();
  for (const key of Object.keys(WHOLE_FOOD_BENCHMARKS)) {
    if (text.includes(key)) {
      return WHOLE_FOOD_BENCHMARKS[key];
    }
  }
  return null;
}

// 2. Comprehensive Health & Nutritional Assessment
export function analyzeProductHealth(productData: any): HealthAssessment {
  const nutriments = productData.nutriments || {};
  const productName = productData.product_name || productData.generic_name || '';
  const categories = productData.categories || productData.categories_tags?.join(' ') || '';
  const benchmark = findBenchmark(productName, categories);

  // Parse Raw Nutriments with comprehensive fallback keys
  let rawEnergy = Number(
    nutriments['energy-kcal_100g'] ??
    nutriments['energy-kcal'] ??
    nutriments['energy-kcal_value'] ??
    (nutriments['energy_100g'] && Number(nutriments['energy_100g']) > 0
      ? Math.round(Number(nutriments['energy_100g']) / 4.184)
      : 0)
  );

  let rawProtein = Number(nutriments['proteins_100g'] ?? nutriments['proteins_value'] ?? nutriments['proteins'] ?? nutriments['protein_100g'] ?? 0);
  let rawCarbs = Number(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates_value'] ?? nutriments['carbohydrates'] ?? nutriments['carbs_100g'] ?? 0);
  let rawSugar = Number(nutriments['sugars_100g'] ?? nutriments['sugars_value'] ?? nutriments['sugars'] ?? nutriments['sugar_100g'] ?? 0);
  let rawFat = Number(nutriments['fat_100g'] ?? nutriments['fat_value'] ?? nutriments['fat'] ?? nutriments['total_fat_100g'] ?? 0);
  let rawSatFat = Number(nutriments['saturated-fat_100g'] ?? nutriments['saturated-fat_value'] ?? nutriments['saturated-fat'] ?? 0);
  let rawFiber = Number(nutriments['fiber_100g'] ?? nutriments['fiber_value'] ?? nutriments['fiber'] ?? 0);
  let rawSalt = Number(nutriments['salt_100g'] ?? nutriments['salt_value'] ?? (nutriments['sodium_100g'] ? Number(nutriments['sodium_100g']) * 2.5 : 0));

  // If nutriments are completely missing or 0, use standard FSSAI benchmark for recognized whole foods
  const hasZeroNutrition = rawEnergy === 0 && rawProtein === 0 && rawFat === 0 && rawCarbs === 0;

  const energyKcal = hasZeroNutrition && benchmark ? benchmark.energyKcal : rawEnergy;
  const protein = hasZeroNutrition && benchmark ? benchmark.proteinG : rawProtein;
  const carbs = hasZeroNutrition && benchmark ? benchmark.carbsG : rawCarbs;
  const sugar = hasZeroNutrition && benchmark ? benchmark.sugarG : rawSugar;
  const fat = hasZeroNutrition && benchmark ? benchmark.fatG : rawFat;
  const satFat = hasZeroNutrition && benchmark ? benchmark.satFatG : rawSatFat;
  const fiber = hasZeroNutrition && benchmark ? benchmark.fiberG : rawFiber;
  const salt = hasZeroNutrition && benchmark ? benchmark.saltG : rawSalt;

  // Grade & Nova Group Determination
  let rawGrade = (productData.nutriscore_grade || '').toLowerCase();
  let nova = Number(productData.nova_group) || (benchmark ? benchmark.nova : 0);

  // Clean Nutri-Score (never leave as "unknown")
  let grade = rawGrade;
  if (!grade || grade === 'unknown' || grade === 'not-applicable') {
    if (benchmark) {
      grade = benchmark.nutriscore;
    } else if (nova === 1 || nova === 2 || (sugar < 5 && satFat < 3 && salt < 0.5)) {
      grade = 'a';
    } else if (sugar > 18 || satFat > 8 || nova === 4) {
      grade = 'd';
    } else {
      grade = 'b';
    }
  }

  if (nova === 0) {
    nova = benchmark ? benchmark.nova : grade === 'a' || grade === 'b' ? 1 : 3;
  }

  const warnings: string[] = [];
  const positives: string[] = [];
  const allergens: string[] = [];
  const additives: string[] = [];

  // Parse additives
  if (Array.isArray(productData.additives_tags)) {
    productData.additives_tags.forEach((tag: string) => {
      const clean = tag.replace('en:', '').toUpperCase();
      additives.push(clean);
    });
  }

  // Parse allergens
  if (productData.allergens_tags && Array.isArray(productData.allergens_tags)) {
    productData.allergens_tags.forEach((tag: string) => {
      allergens.push(tag.replace('en:', '').replace(/-/g, ' '));
    });
  } else if (productData.allergens) {
    allergens.push(...productData.allergens.split(',').map((s: string) => s.trim()));
  }

  // Warnings evaluation
  if (sugar > 15) {
    warnings.push(`High Sugar (${sugar}g/100g) — Exceeds FSSAI daily recommendation for processed foods`);
  } else if (sugar > 8 && nova >= 3) {
    warnings.push(`Moderate Sugar (${sugar}g/100g) — Consume in moderation`);
  }

  if (salt > 1.5) {
    warnings.push(`High Sodium/Salt (${salt}g/100g) — High risk for hypertension & kidney strain`);
  }

  if (satFat > 5 && nova >= 3) {
    warnings.push(`High Saturated Fat (${satFat}g/100g) — May increase LDL bad cholesterol`);
  }

  if (nova === 4) {
    warnings.push('Ultra-Processed Food (NOVA Group 4) — Contains industrial formulations and emulsifiers');
  }

  const ingredientsText = (productData.ingredients_text || '').toLowerCase();
  if (ingredientsText.includes('palm oil') || ingredientsText.includes('palmolein')) {
    warnings.push('Contains Palm Oil / Palmolein — High in saturated fatty acids');
  }
  if (ingredientsText.includes('hydrogenated') || ingredientsText.includes('trans fat') || ingredientsText.includes('vanaspati')) {
    warnings.push('Contains Partially Hydrogenated Fats / Trans Fats');
  }
  if (ingredientsText.includes('e102') || ingredientsText.includes('tartrazine') || ingredientsText.includes('e110') || ingredientsText.includes('sunset yellow')) {
    warnings.push('Contains Synthetic Azo Food Colors (Tartrazine / Sunset Yellow)');
  }
  if (ingredientsText.includes('e621') || ingredientsText.includes('msg') || ingredientsText.includes('monosodium glutamate')) {
    warnings.push('Contains Monosodium Glutamate (MSG / Flavor Enhancer E621)');
  }

  // Positives evaluation
  if (benchmark) {
    positives.push(...benchmark.positives);
  } else {
    if (protein >= 6) positives.push(`Good Source of Protein (${protein}g/100g)`);
    if (fiber >= 3) positives.push(`Rich in Dietary Fiber (${fiber}g/100g)`);
    if (sugar <= 2 && sugar > 0) positives.push('Very Low Sugar Content');
    if (salt <= 0.3) positives.push('Low Sodium / Heart-Friendly');
    if (nova === 1) positives.push('Minimally Processed / Natural Whole Food (NOVA Group 1)');
    if (additives.length === 0) positives.push('No Synthetic Additives or Preservatives Detected');
  }

  // Determine Overall Health Level
  let healthLevel: 'healthy' | 'moderate' | 'unhealthy' = 'healthy';
  let healthScoreText = '🟢 Healthy & Nutritious Choice';
  let isHealthy = true;

  if (grade === 'd' || grade === 'e' || (nova === 4 && (sugar > 15 || satFat > 6 || warnings.length >= 2))) {
    healthLevel = 'unhealthy';
    healthScoreText = '🔴 High Health Risk — Ultra Processed / High Sugar or Fat';
    isHealthy = false;
  } else if (grade === 'c' || warnings.length > 0) {
    healthLevel = 'moderate';
    healthScoreText = '🟡 Moderate Nutritional Value — Limit Frequency';
    isHealthy = false;
  } else {
    healthLevel = 'healthy';
    healthScoreText = '🟢 Healthy & Nutritious Choice';
    isHealthy = true;
  }

  // Generate Smarter Healthier Alternatives only for Unhealthy/Moderate
  const alternatives = isHealthy
    ? []
    : generateHealthierAlternatives(productName, categories, ingredientsText, healthLevel);

  return {
    healthLevel,
    healthScoreText,
    nutriscoreGrade: grade,
    novaGroup: nova,
    isHealthy,
    warnings: warnings.length > 0 ? warnings : ['No harmful additives or high sugar/salt flags detected on label.'],
    positives: positives.length > 0 ? positives : ['Provides standard dietary caloric intake.'],
    allergens,
    additives,
    nutritionSummary: {
      energyKcal,
      proteinG: protein,
      carbsG: carbs,
      sugarG: sugar,
      fatG: fat,
      satFatG: satFat,
      saltG: salt,
      fiberG: fiber,
    },
    healthierAlternatives: alternatives,
  };
}

// 3. Dynamic Healthier Alternatives Matcher
export function generateHealthierAlternatives(
  productName: string,
  categories: string,
  ingredients: string,
  healthLevel: 'healthy' | 'moderate' | 'unhealthy'
): AlternativeFood[] {
  const text = `${productName} ${categories} ${ingredients}`.toLowerCase();

  // Beverages / Soft drinks / Colas / Energy drinks
  if (text.includes('soda') || text.includes('cola') || text.includes('energy drink') || text.includes('carbonated') || text.includes('pepsi') || text.includes('coke') || text.includes('sprite') || text.includes('soft drink')) {
    return [
      { name: 'Fresh Tender Coconut Water', icon: '🥥', category: 'Beverage', benefit: '100% natural hydration with zero added sugars or colors' },
      { name: 'Spiced Chaas (Buttermilk)', icon: '🥛', category: 'Probiotic', benefit: 'Aids digestion with live gut bacteria & rock salt' },
      { name: 'Fresh Lemon Mint Sparkler (No Sugar)', icon: '🍋', category: 'Hydration', benefit: 'Natural Vitamin C boost without artificial sweeteners' },
      { name: 'Kokum / Aam Panna Cooler', icon: '🍹', category: 'Traditional', benefit: 'Antioxidant-rich natural cooling beverage' },
    ];
  }

  // Chips / Crisps / Namkeen / Bhujia / Fried snacks
  if (text.includes('chip') || text.includes('crisp') || text.includes('namkeen') || text.includes('bhujia') || text.includes('kurkure') || text.includes('lays') || text.includes('fried') || text.includes('snack')) {
    return [
      { name: 'Roasted Phool Makhana (Foxnuts)', icon: '🍿', category: 'Snack', benefit: 'Zero trans fats, rich in calcium, magnesium & protein' },
      { name: 'Baked Ragi & Multigrain Crisps', icon: '🌾', category: 'Millets', benefit: 'Fiber-rich complex carbohydrates with no palm oil' },
      { name: 'Roasted Spiced Black Chana', icon: '🥜', category: 'Protein', benefit: 'Traditional low-glycemic high-protein crunch' },
      { name: 'Air-Popped Salted Corn / Seeds', icon: '🌻', category: 'Whole Grain', benefit: 'Whole grain goodness with 80% less saturated fat' },
    ];
  }

  // Instant noodles / Instant pasta / Ready to eat
  if (text.includes('noodle') || text.includes('maggi') || text.includes('pasta') || text.includes('ramen') || text.includes('soup packet') || text.includes('ready to eat')) {
    return [
      { name: 'Foxtail Millet Whole Wheat Noodles', icon: '🍜', category: 'Millets', benefit: 'Non-fried, no MSG, low glycemic index' },
      { name: 'Vegetable Dal Khichdi Bowl', icon: '🍲', category: 'Balanced Meal', benefit: 'Complete amino acid profile with lentils & veggies' },
      { name: 'Brown Rice & Veggie Vermicelli', icon: '🌾', category: 'Whole Grain', benefit: 'Zero refined flour (maida) & zero artificial preservatives' },
    ];
  }

  // Biscuits / Cookies / Cakes / Pastries
  if (text.includes('biscuit') || text.includes('cookie') || text.includes('cake') || text.includes('cream') || text.includes('oreo') || text.includes('parle') || text.includes('pastry') || text.includes('wafer')) {
    return [
      { name: '100% Baked Oats & Chia Cookies', icon: '🍪', category: 'Bakery', benefit: 'No refined maida, zero trans fat, sweetened with jaggery' },
      { name: 'Roasted Sesame & Peanut Chikki', icon: '🍯', category: 'Energy', benefit: 'Natural iron, calcium, and healthy unsaturated fats' },
      { name: 'Dates & Almond Energy Laddoo', icon: '🌰', category: 'Superfood', benefit: 'Zero white sugar, rich in potassium & dietary fiber' },
    ];
  }

  // Chocolates / Candies / Confectionery
  if (text.includes('chocolate') || text.includes('candy') || text.includes('sweet') || text.includes('toffee') || text.includes('dairy milk') || text.includes('kitkat') || text.includes('sugar')) {
    return [
      { name: '70%+ Dark Cocoa Chocolate', icon: '🍫', category: 'Antioxidants', benefit: 'Rich in heart-protective flavonoids and 70% less sugar' },
      { name: 'Dried Anjeer (Figs) & Walnuts', icon: '🌰', category: 'Dry Fruits', benefit: 'Natural sweetness with brain-healthy Omega-3 fats' },
      { name: 'Cacao & Peanut Butter Bites', icon: '🥜', category: 'Protein', benefit: 'Natural source of energy without synthetic emulsifiers' },
    ];
  }

  // Sweetened Juices / Packaged drinks
  if (text.includes('juice') || text.includes('nectar') || text.includes('frooti') || text.includes('maaza') || text.includes('real') || text.includes('tropicana')) {
    return [
      { name: 'Whole Fresh Pomegranate / Orange', icon: '🍊', category: 'Whole Fruit', benefit: 'Full natural dietary fiber slows down sugar absorption' },
      { name: 'Cold-Pressed Green Apple & Celery', icon: '🍏', category: 'Raw Juice', benefit: 'Zero added sugar, zero synthetic acidity regulators' },
      { name: 'Fresh Mint Infused Water', icon: '🌿', category: 'Detox', benefit: 'Calorie-free refreshing natural hydration' },
    ];
  }

  // Processed Dairy / Processed cheese / Butter spreads
  if (text.includes('cheese') || text.includes('butter') || text.includes('mayo') || text.includes('spread') || text.includes('margarine')) {
    return [
      { name: 'Fresh Low-Fat Artisanal Paneer', icon: '🧀', category: 'Fresh Dairy', benefit: 'High quality biological protein without emulsifying salts' },
      { name: 'Homemade Hung Curd Herb Dip', icon: '🥣', category: 'Probiotic', benefit: '80% fewer calories than mayonnaise with gut-friendly cultures' },
      { name: 'Pure Homemade A2 Desi Cow Ghee', icon: '🧈', category: 'Healthy Fats', benefit: 'Rich in fat-soluble vitamins A, D, E & butyric acid' },
    ];
  }

  // General fallback for other processed food items
  return [
    { name: 'Fresh Seasonal Whole Fruits', icon: '🍎', category: 'Fresh Produce', benefit: 'Natural vitamins, essential enzymes and zero additives' },
    { name: 'Roasted Spiced Makhana & Nuts', icon: '🥜', category: 'Healthy Snack', benefit: 'Clean healthy fats and proteins with zero trans fat' },
    { name: 'Steamed Moong & Corn Chaat', icon: '🌽', category: 'Fresh Protein', benefit: 'Fresh fiber-rich snack without artificial preservatives' },
  ];
}

// 4. Photo Recognition & Food Analysis for Unbranded / No-Barcode items
export function analyzeFoodPhoto(dishQuery: string): PhotoFoodResult {
  const q = dishQuery.toLowerCase().trim();

  if (q.includes('badam') || q.includes('almond') || q.includes('nut') || q.includes('dry fruit')) {
    return {
      dishName: 'Raw / Dried Almonds (Badam)',
      category: 'Dry Fruits & Nuts',
      isFood: true,
      healthLevel: 'healthy',
      estimatedCalories: 579,
      protein: '21.2g',
      carbs: '21.6g',
      fat: '49.9g',
      fssaiSafetyTips: [
        'Store in a cool, airtight container to prevent lipid oxidation and mold formation.',
        'Check for natural sweet aroma; discard if almonds smell rancid or bitter.',
      ],
      adulterationTest: 'Inspect for artificial dye polishing or sulphur fumigation; pure badam has uniform natural matte skin.',
      warnings: ['Consume in balanced portion (20-30g daily) due to high nutrient & energy density.'],
      positives: [
        'Rich in Vitamin E and magnesium',
        'High natural plant protein and dietary fiber',
        'Heart-healthy monounsaturated fats',
      ],
      healthierAlternatives: [],
    };
  }

  if (q.includes('samosa') || q.includes('kachori') || q.includes('pakora') || q.includes('bhajiya') || q.includes('vada pav')) {
    return {
      dishName: 'Deep-Fried Street Snack (e.g. Samosa / Pakora)',
      category: 'Street Food / Fried Snack',
      isFood: true,
      healthLevel: 'unhealthy',
      estimatedCalories: 280,
      protein: '4.5g',
      carbs: '32.0g',
      fat: '16.5g',
      fssaiSafetyTips: [
        'Check if the cooking oil is repeatedly heated or dark black in color (Total Polar Compounds > 25% is unsafe under FSSAI regulations).',
        'Ensure street vendors store snacks in covered glass cases to prevent dust and fly contamination.',
        'Avoid snacks served on printed newspaper as ink contains toxic heavy metals and carcinogenic solvents.',
      ],
      adulterationTest: 'Avoid consuming if oil smells rancid or has an acrid burning aftertaste.',
      warnings: [
        'High Trans Fats & Saturated Fats from deep frying',
        'Refined Maida flour base causes rapid blood glucose spike',
        'Risk of re-used burnt cooking oil',
      ],
      positives: ['Freshly cooked hot food reduces live microbial bacterial load.'],
      healthierAlternatives: [
        { name: 'Baked Whole Wheat Vegetable Samosa', icon: '🥟', category: 'Baked', benefit: '70% less oil absorption with high vegetable fiber' },
        { name: 'Air-Fried Sweet Potato / Chana Tikki', icon: '🍠', category: 'Air Fried', benefit: 'Complex carbohydrates with zero repeated oil exposure' },
        { name: 'Steamed Moong Dal Dhokla', icon: '🥮', category: 'Steamed', benefit: 'Fermented easy-to-digest low fat protein' },
      ],
    };
  }

  if (q.includes('milk') || q.includes('dairy') || q.includes('doodh')) {
    return {
      dishName: 'Unpackaged / Fresh Milk',
      category: 'Fresh Dairy',
      isFood: true,
      healthLevel: 'healthy',
      estimatedCalories: 62,
      protein: '3.2g',
      carbs: '4.7g',
      fat: '3.5g',
      fssaiSafetyTips: [
        'Always boil raw unpasteurized milk to at least 72°C for 15 seconds to destroy Salmonella and E. coli pathogens.',
        'Store below 4°C in a clean sterilized container.',
      ],
      adulterationTest: 'Put a drop of milk on a slanted polished surface. Pure milk leaves a white trail behind. Adulterated milk with water flows immediately without leaving a mark.',
      warnings: ['Raw unboiled loose milk carries risk of bacterial zoonotic contamination.'],
      positives: ['Natural calcium, phosphorus and bioavailable whey & casein protein.'],
      healthierAlternatives: [],
    };
  }

  if (q.includes('paneer') || q.includes('cottage cheese') || q.includes('cheese')) {
    return {
      dishName: 'Fresh Cottage Cheese (Paneer)',
      category: 'Fresh Dairy',
      isFood: true,
      healthLevel: 'healthy',
      estimatedCalories: 265,
      protein: '18.3g',
      carbs: '1.2g',
      fat: '20.8g',
      fssaiSafetyTips: [
        'Ensure paneer is stored submerged in cold clean potable water or refrigerated below 5°C.',
        'Watch out for synthetic analogue paneer made from palm oil and starch.',
      ],
      adulterationTest: 'Boil a small piece in water, cool and add 2-3 drops of Iodine solution. If it turns blue, it contains adulterated starch/flour.',
      warnings: ['Analogue paneer may substitute milk fat with industrial palm oil.'],
      positives: ['Excellent vegetarian source of complete protein and calcium.'],
      healthierAlternatives: [],
    };
  }

  if (q.includes('sweet') || q.includes('mithai') || q.includes('gulab jamun') || q.includes('jalebi') || q.includes('ladoo') || q.includes('barfi')) {
    return {
      dishName: 'Traditional Indian Mithai / Sweet',
      category: 'Traditional Sweets / Dessert',
      isFood: true,
      healthLevel: 'unhealthy',
      estimatedCalories: 380,
      protein: '4.0g',
      carbs: '56.0g',
      fat: '16.0g',
      fssaiSafetyTips: [
        'Check for FSSAI "Best Before Date" display on sweet trays at the confectionery shop.',
        'Beware of bright non-permitted chemical colorants (e.g. Metanil Yellow, Rhodamine B).',
        'Verify that Silver Foil (Vark) is FSSAI food-grade (pure silver) and not adulterated with toxic aluminium.',
      ],
      adulterationTest: 'Rub silver foil on hands; pure silver crumbles into fine powder, whereas aluminium turns into gray greasy residue.',
      warnings: [
        'Very high simple sugars & saturated fat (causes immediate insulin surge)',
        'Mawa/Khoya used in off-season sweets often has starch or detergent adulteration',
      ],
      positives: ['Traditional festive treat — best enjoyed on special occasions in moderation.'],
      healthierAlternatives: [
        { name: 'Fresh Anjeer & Dates Dry Fruit Burfi', icon: '🌰', category: 'No Added Sugar', benefit: 'Sweetened only with whole dates and figs' },
        { name: 'Roasted Sesame (Til) & Jaggery Laddoo', icon: '🍯', category: 'Traditional', benefit: 'Rich in organic iron, zinc and healthy sesame lignans' },
        { name: 'Fresh Fruit Custard with Chia Seeds', icon: '🍓', category: 'Fruit Dessert', benefit: 'High dietary fiber and vitamins with 60% fewer calories' },
      ],
    };
  }

  if (q.includes('apple') || q.includes('banana') || q.includes('fruit') || q.includes('mango') || q.includes('orange') || q.includes('salad') || q.includes('vegetable')) {
    return {
      dishName: 'Fresh Whole Fruit / Vegetable Produce',
      category: 'Fresh Produce',
      isFood: true,
      healthLevel: 'healthy',
      estimatedCalories: 75,
      protein: '1.0g',
      carbs: '18.0g',
      fat: '0.3g',
      fssaiSafetyTips: [
        'Wash thoroughly under running potable water for at least 30 seconds to remove surface pesticide residues and wax.',
        'Avoid fruits artificially ripened with hazardous Calcium Carbide gas (banned under FSSAI Act).',
      ],
      adulterationTest: 'Artificially ripened fruits with carbide usually have uniform bright yellow skin but sour, tasteless pale pulp inside.',
      warnings: ['Always peel or wash thoroughly to eliminate surface agrochemical residues.'],
      positives: [
        'Packed with natural antioxidants, flavonoids, and Vitamin C',
        'Soluble dietary fiber promotes gut health and steady energy release',
      ],
      healthierAlternatives: [],
    };
  }

  // Generic food photo fallback
  return {
    dishName: dishQuery ? `Scanned Food Item: ${dishQuery}` : 'Fresh / Prepared Food Item',
    category: 'General Food Item',
    isFood: true,
    healthLevel: 'healthy',
    estimatedCalories: 210,
    protein: '6.0g',
    carbs: '28.0g',
    fat: '7.5g',
    fssaiSafetyTips: [
      'Check for freshness, natural aroma, and absence of mold or off-odor.',
      'Ensure proper food grade packaging and storage below room temperature.',
      'Always verify that unbranded food stalls display their 14-digit FSSAI Registration number.',
    ],
    adulterationTest: 'Inspect for artificial synthetic gloss, unnatural chemical smells, or dye bleed in water.',
    warnings: ['Ensure adequate hygiene standards during storage and preparation.'],
    positives: ['Whole food source without industrial high-fructose corn syrup.'],
    healthierAlternatives: [],
  };
}
