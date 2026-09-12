import admin from "firebase-admin";

/**
 * Firebase Integration Utility for Aarogya / FDA SafeWatch Portal
 * Project: aarogya-6273
 * Handles:
 * 1. Firebase SMS OTP sending & verification
 * 2. Firebase Cloud Messages / Notifications / SMS Dispatch
 * 3. Firebase Admin SDK & Identity Toolkit REST API
 */

// Firebase project configuration (matches firebaseConfig from Firebase Console)
const firebaseConfig = {
  apiKey:            process.env.FIREBASE_API_KEY             || "AIzaSyA3FmNv0-7crSbeSTJYhfzMhRqMSE2ofgw",
  authDomain:        process.env.FIREBASE_AUTH_DOMAIN         || "aarogya-6273.firebaseapp.com",
  projectId:         process.env.FIREBASE_PROJECT_ID          || "aarogya-6273",
  storageBucket:     process.env.FIREBASE_STORAGE_BUCKET      || "aarogya-6273.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "199316601901",
  appId:             process.env.FIREBASE_APP_ID              || "1:199316601901:web:8376a353fc01dfb5964ca4",
  measurementId:     process.env.FIREBASE_MEASUREMENT_ID      || "G-CHJBK31YLL"
};

let firebaseApp = null;

export function getFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountJson) {
      const parsedAccount = typeof serviceAccountJson === "string" && serviceAccountJson.trim().startsWith("{")
        ? JSON.parse(serviceAccountJson)
        : serviceAccountJson;

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(parsedAccount),
        projectId: projectId || parsedAccount.project_id
      });
      console.log("[Firebase Admin] Initialized with Service Account.");
    } else if (projectId) {
      firebaseApp = admin.initializeApp({
        projectId: projectId
      });
      console.log(`[Firebase Admin] Initialized with Project ID: ${projectId}`);
    }
  } catch (err) {
    console.warn("[Firebase Admin Init Warning]:", err.message);
  }

  return firebaseApp;
}

/**
 * Send an SMS or OTP message using Firebase Identity Platform REST API,
 * Firebase Cloud Functions, or Firebase Admin SDK.
 *
 * @param {Object} params
 * @param {string} params.to - Recipient phone number in E.164 format (+919876543210) or 10-digit format
 * @param {string} params.message - SMS message or OTP notification text
 * @param {string} [params.otp] - Optional specific OTP code
 */
export async function sendFirebaseMessage({ to, message, otp }) {
  // Use the configured firebaseConfig (has hardcoded fallbacks for aarogya-6273)
  const firebaseApiKey = firebaseConfig.apiKey;
  const firebaseProjectId = firebaseConfig.projectId;

  // Format phone number to E.164 (+91 for India)
  let cleanPhone = String(to).replace(/[^0-9+]/g, "").trim();
  let e164Phone = cleanPhone;
  if (!e164Phone.startsWith("+")) {
    if (e164Phone.length === 10) {
      e164Phone = `+91${e164Phone}`;
    } else if (e164Phone.startsWith("91") && e164Phone.length === 12) {
      e164Phone = `+${e164Phone}`;
    }
  }

  // 1. Firebase Identity Platform REST API (sendVerificationCode)
  if (firebaseApiKey) {
    try {
      const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=${firebaseApiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: e164Phone,
          recaptchaToken: process.env.FIREBASE_RECAPTCHA_TOKEN || "mock-token"
        })
      });

      const data = await response.json();
      if (response.ok && data.sessionInfo) {
        console.log(`[Firebase SMS] Successfully dispatched OTP verification to ${e164Phone}. Session: ${data.sessionInfo.substring(0, 10)}...`);
        return { success: true, provider: "Firebase Identity Toolkit", sessionInfo: data.sessionInfo };
      } else {
        console.warn("[Firebase SMS REST Warning]:", data.error?.message || data);
      }
    } catch (err) {
      console.error("[Firebase REST Error]:", err.message);
    }
  }

  // 2. Firebase Cloud Function / Custom Firebase SMS Endpoint
  const firebaseCustomUrl = process.env.FIREBASE_SMS_URL;
  if (firebaseCustomUrl) {
    try {
      const response = await fetch(firebaseCustomUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.FIREBASE_AUTH_BEARER || ""}`
        },
        body: JSON.stringify({
          phone: e164Phone,
          message: message,
          otp: otp,
          projectId: firebaseProjectId
        })
      });
      if (response.ok) {
        console.log(`[Firebase Custom SMS] Message dispatched to ${e164Phone}`);
        return { success: true, provider: "Firebase Custom Function" };
      }
    } catch (err) {
      console.error("[Firebase Custom Function Error]:", err.message);
    }
  }

  return { success: false, provider: "Firebase", reason: "Firebase credentials not fully set or handled by fallback" };
}
