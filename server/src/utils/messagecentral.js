/**
 * Message Central VerifyNow — OTP Utility for Aarogya / FDA SafeWatch
 * 
 * API Reference: https://cpaas.messagecentral.com
 * Endpoints:
 *   - GET  /auth/v1/authentication/token  → get auth token
 *   - POST /verification/v3/send          → send OTP to mobile
 *   - POST /verification/v3/validateOtp   → validate OTP entered by user
 */

const MC_BASE = "https://cpaas.messagecentral.com";

// Cache the auth token (valid ~24h, refresh if expired)
let _cachedToken = null;
let _tokenFetchedAt = 0;
const TOKEN_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours

/**
 * Fetch an auth token for Message Central.
 * Uses static MC_AUTH_TOKEN from .env if provided; otherwise requests dynamically via customerId + password.
 */
async function getMCToken() {
  if (process.env.MC_AUTH_TOKEN && process.env.MC_AUTH_TOKEN.trim()) {
    return process.env.MC_AUTH_TOKEN.trim();
  }

  const now = Date.now();
  if (_cachedToken && (now - _tokenFetchedAt) < TOKEN_TTL_MS) {
    return _cachedToken;
  }

  const customerId = process.env.MC_CUSTOMER_ID;
  const password   = process.env.MC_PASSWORD;

  if (!customerId || !password) {
    throw new Error("Message Central credentials (MC_AUTH_TOKEN or MC_CUSTOMER_ID + MC_PASSWORD) not set in .env");
  }

  // Password must be base64-encoded
  const encodedPassword = Buffer.from(password).toString("base64");

  const url = `${MC_BASE}/auth/v1/authentication/token?customerId=${encodeURIComponent(customerId)}&key=${encodeURIComponent(encodedPassword)}&scope=NEW&country=91`;

  const response = await fetch(url, { method: "GET" });
  const data = await response.json();

  if (!response.ok || !data.token) {
    throw new Error(`Message Central auth failed: ${data.message || JSON.stringify(data)}`);
  }

  _cachedToken = data.token;
  _tokenFetchedAt = now;
  console.log("[MC VerifyNow] Auth token fetched successfully.");
  return _cachedToken;
}

/**
 * Send OTP via Message Central VerifyNow to a mobile number.
 * 
 * @param {string} mobileNumber - 10-digit Indian mobile number (or E.164)
 * @param {number} [otpLength=6] - OTP digits (default 6)
 * @returns {Promise<{ success: boolean, verificationId: string }>}
 */
export async function sendMCOtp(mobileNumber) {
  // Normalize to 10-digit
  let phone = String(mobileNumber).replace(/[^0-9]/g, "").trim();
  if (phone.startsWith("91") && phone.length === 12) phone = phone.substring(2);

  const token = await getMCToken();
  const customerId = process.env.MC_CUSTOMER_ID || "C-DD4735E4E5E5414";

  const url = new URL(`${MC_BASE}/verification/v3/send`);
  url.searchParams.set("countryCode", "91");
  url.searchParams.set("customerId", customerId);
  url.searchParams.set("flowType", "SMS");
  url.searchParams.set("mobileNumber", phone);
  url.searchParams.set("otpLength", "6");

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "authToken": token,
      "customerId": customerId,
      "Content-Type": "application/json"
    }
  });

  const data = await response.json();

  if (!response.ok && data.responseCode !== 506) {
    throw new Error(`MC OTP send failed: ${data.message || JSON.stringify(data)}`);
  }

  // Handle case where OTP was already recently sent (code 506) or successfully created (code 200)
  const verificationId = data.data?.verificationId || data.verificationId;
  if (!verificationId) {
    throw new Error(`MC OTP send did not return verificationId: ${JSON.stringify(data)}`);
  }

  console.log(`[MC VerifyNow] OTP sent to +91${phone}. Verification ID: ${verificationId}`);
  return { success: true, verificationId };
}

/**
 * Validate OTP entered by user against Message Central VerifyNow.
 * 
 * @param {string} verificationId - ID returned from sendMCOtp()
 * @param {string} otp - User-entered OTP code
 * @param {string} [mobileNumber] - Optional mobile number
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function validateMCOtp(verificationId, otp, mobileNumber) {
  const token = await getMCToken();
  const customerId = process.env.MC_CUSTOMER_ID || "C-DD4735E4E5E5414";

  const url = new URL(`${MC_BASE}/verification/v3/validateOtp`);
  url.searchParams.set("verificationId", String(verificationId).trim());
  url.searchParams.set("code", String(otp).trim());
  if (mobileNumber) {
    let phone = String(mobileNumber).replace(/[^0-9]/g, "").trim();
    if (phone.startsWith("91") && phone.length === 12) phone = phone.substring(2);
    url.searchParams.set("mobileNumber", phone);
    url.searchParams.set("countryCode", "91");
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "authToken": token,
      "customerId": customerId
    }
  });

  const data = await response.json();

  if (data.responseCode === 702) {
    throw new Error("Wrong OTP provided. Please check the code received on your mobile and try again.");
  }
  if (data.responseCode === 705) {
    throw new Error("OTP has expired. Please request a new OTP.");
  }

  const verified = data.responseCode === 200
    || data.data?.verificationStatus === "VERIFICATION_COMPLETED"
    || data.verificationStatus === "VERIFICATION_COMPLETED";

  if (!verified) {
    throw new Error(data.message || "Invalid or expired OTP. Please try again.");
  }

  console.log(`[MC VerifyNow] OTP verified successfully for ID: ${verificationId}`);
  return { success: true, message: "OTP verified" };
}

