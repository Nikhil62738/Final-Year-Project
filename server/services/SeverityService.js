const highRisk = ["spoiled dairy", "spoiled milk", "spoiled meat", "unsafe water", "poison", "vomit", "hospital", "pest", "rat", "cockroach", "severe adulteration", "fungus", "mold"];
const mediumRisk = ["expired", "stale", "bad smell", "unhygienic", "dirty", "mislabel"];

export function suggestSeverity({ category = "", description = "", vendorName = "" }) {
  const text = `${category} ${description} ${vendorName}`.toLowerCase();
  const reasons = [];
  let score = 35;

  highRisk.forEach((term) => {
    if (text.includes(term)) {
      score += 18;
      reasons.push(`Mentions ${term}`);
    }
  });

  mediumRisk.forEach((term) => {
    if (text.includes(term)) {
      score += 8;
      reasons.push(`Mentions ${term}`);
    }
  });

  if (category === "pest_contamination" || category === "adulteration") {
    score += 12;
    reasons.push("Higher-risk complaint category");
  }

  score = Math.min(score, 100);
  return {
    severity: score >= 75 ? "high" : score >= 50 ? "medium" : "low",
    score,
    reasons: reasons.length ? reasons.slice(0, 4) : ["No high-risk keywords found"]
  };
}

export function suggestCategory(description = "") {
  const text = description.toLowerCase();
  if (/(insect|cockroach|rat|pest|mouse)/.test(text)) return "pest_contamination";
  if (/(expired|date|stale|old stock)/.test(text)) return "expired_product";
  if (/(dirty|unhygienic|unclean|drain|waste)/.test(text)) return "unhygienic_premises";
  if (/(label|wrong information|misleading|ingredient)/.test(text)) return "mislabeling";
  if (/(adulter|chemical|mixed|fake|poison)/.test(text)) return "adulteration";
  return "other";
}
