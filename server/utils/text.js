export function normalizeFssai(value = "") {
  return String(value).replace(/\D/g, "");
}

export function normalizeVendor(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|and|restaurant|hotel|foods|food|store|shop|mart|pvt|ltd|private|limited)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshtein(a = "", b = "") {
  const left = normalizeVendor(a);
  const right = normalizeVendor(b);
  const matrix = Array.from({ length: right.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= left.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= right.length; i += 1) {
    for (let j = 1; j <= left.length; j += 1) {
      matrix[i][j] = right[i - 1] === left[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[right.length][left.length];
}

export function similarity(a, b) {
  const max = Math.max(normalizeVendor(a).length, normalizeVendor(b).length, 1);
  return 1 - levenshtein(a, b) / max;
}

export function safePublicNote(value = "") {
  return String(value).replace(/[<>]/g, "").slice(0, 500);
}
