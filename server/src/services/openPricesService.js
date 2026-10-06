// Open Prices (OpenMRP / Open Food Facts Prices API) Integration
// Queries prices.openfoodfacts.org to fetch crowdsourced retail prices / MRP for barcodes

export async function lookupOpenPrices(barcode) {
  const cleanCode = String(barcode || "").trim();
  if (!cleanCode) return null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://prices.openfoodfacts.org/api/v1/prices?product_code=${encodeURIComponent(cleanCode)}&size=5`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FDA-SafeWatch/1.0 (support.fda@maharashtra.gov.in)",
        "Accept": "application/json"
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
      // Find the most recent price record
      const latest = data.items[0];
      const currency = latest.currency || "INR";
      const currencySymbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;
      const numPrice = Number(latest.price);
      const displayPrice = Number.isFinite(numPrice) ? `${currencySymbol}${numPrice}` : null;

      if (!displayPrice) return null;

      return {
        price: numPrice,
        currency,
        formattedPrice: displayPrice,
        isDiscounted: Boolean(latest.price_is_discounted),
        store: latest.location?.osm_name || latest.location?.osm_brand || null,
        city: latest.location?.osm_address_city || latest.location?.osm_address_country || null,
        date: latest.date || null,
        totalPriceRecords: data.total || data.items.length,
        source: "Open Prices API (prices.openfoodfacts.org)"
      };
    }

    return null;
  } catch (err) {
    console.warn("Open Prices lookup skipped or timed out:", err.message);
    return null;
  }
}
