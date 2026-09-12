import { sendFirebaseMessage } from "./firebase.js";

/**
 * Mobile SMS & Notification Service Utility for Aarogya / FDA SafeWatch Portal
 * Priority Providers:
 * 1. Firebase (Firebase Phone Auth / Identity Platform / Cloud Messaging)
 * 2. Fast2SMS (India Quick SMS API)
 * 3. Twilio (Global SMS API)
 * 4. 2Factor.in (Indian SMS & OTP Gateway)
 * 5. Custom SMS Gateway URL (HTTP GET/POST)
 * 6. Built-in Safe Logger & Simulation Mode (for testing & development)
 */

export async function sendSMS({ to, message, otp }) {
  if (!to || !message) {
    console.warn("[SMS] Missing recipient mobile number or message content.");
    return { success: false, error: "Missing parameters" };
  }

  // Clean phone number: remove spaces, dashes, parentheses
  let cleanedPhone = String(to).replace(/[^0-9+]/g, "").trim();

  // Standardize 10-digit Indian numbers
  let nationalNumber = cleanedPhone;
  if (nationalNumber.startsWith("+91")) {
    nationalNumber = nationalNumber.substring(3);
  } else if (nationalNumber.startsWith("91") && nationalNumber.length === 12) {
    nationalNumber = nationalNumber.substring(2);
  }

  const fast2SmsKey = process.env.FAST2SMS_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
  const twoFactorKey = process.env.TWOFACTOR_API_KEY;
  const genericGatewayUrl = process.env.SMS_GATEWAY_URL;

  let providerUsed = "Firebase / Dev Console";
  let delivered = false;

  // 1. FIREBASE (Identity Platform / Cloud Messaging / Phone SMS)
  if (process.env.FIREBASE_API_KEY || process.env.FIREBASE_SMS_URL) {
    const fbResult = await sendFirebaseMessage({ to: cleanedPhone, message, otp });
    if (fbResult && fbResult.success) {
      delivered = true;
      providerUsed = fbResult.provider || "Firebase";
    }
  }

  // 2. FAST2SMS (India Bulk & Quick SMS)
  if (!delivered && fast2SmsKey && nationalNumber.length === 10) {
    try {
      providerUsed = "Fast2SMS";
      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: fast2SmsKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "q",
          message: message,
          language: "english",
          flash: 0,
          numbers: nationalNumber
        })
      });
      const data = await response.json();
      if (data && (data.return === true || data.status_code === 200)) {
        delivered = true;
        console.log(`[SMS - Fast2SMS] Message delivered to ${nationalNumber}`);
      } else {
        console.warn(`[SMS - Fast2SMS] Response:`, data);
      }
    } catch (err) {
      console.error("[SMS - Fast2SMS Error]:", err.message);
    }
  }

  // 2. 2FACTOR.IN (India OTP & Transactional SMS)
  if (!delivered && twoFactorKey && nationalNumber.length === 10) {
    try {
      providerUsed = "2Factor.in";
      const url = `https://2factor.in/API/V1/${twoFactorKey}/SMS/${nationalNumber}/${encodeURIComponent(message)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.Status === "Success") {
        delivered = true;
        console.log(`[SMS - 2Factor] Message sent to ${nationalNumber}`);
      } else {
        console.warn(`[SMS - 2Factor] Response:`, data);
      }
    } catch (err) {
      console.error("[SMS - 2Factor Error]:", err.message);
    }
  }

  // 3. TWILIO (Global SMS Gateway)
  if (!delivered && twilioSid && twilioAuthToken && twilioFrom) {
    try {
      providerUsed = "Twilio";
      const e164Phone = cleanedPhone.startsWith("+") ? cleanedPhone : `+91${nationalNumber}`;
      const authHeader = "Basic " + Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");
      
      const bodyParams = new URLSearchParams();
      bodyParams.append("To", e164Phone);
      bodyParams.append("From", twilioFrom);
      bodyParams.append("Body", message);

      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: bodyParams.toString()
      });

      const data = await response.json();
      if (response.ok && data.sid) {
        delivered = true;
        console.log(`[SMS - Twilio] Message dispatched SID: ${data.sid}`);
      } else {
        console.warn(`[SMS - Twilio] Response:`, data);
      }
    } catch (err) {
      console.error("[SMS - Twilio Error]:", err.message);
    }
  }

  // 4. GENERIC CUSTOM SMS GATEWAY URL
  if (!delivered && genericGatewayUrl) {
    try {
      providerUsed = "Custom Gateway";
      const targetUrl = genericGatewayUrl
        .replace("{phone}", encodeURIComponent(nationalNumber))
        .replace("{mobile}", encodeURIComponent(nationalNumber))
        .replace("{message}", encodeURIComponent(message));
      
      const response = await fetch(targetUrl);
      if (response.ok) {
        delivered = true;
        console.log(`[SMS - Custom Gateway] Request successfully sent to gateway.`);
      }
    } catch (err) {
      console.error("[SMS - Custom Gateway Error]:", err.message);
    }
  }

  // Visual Console Output (Always logged for developer visibility and verification)
  const timestamp = new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" });
  console.log("\n╔════════════════════════════════════════════════════════════════════╗");
  console.log(`║ 📱 MOBILE SMS DISPATCHED [${timestamp}]`);
  console.log(`║ To: ${cleanedPhone}`);
  console.log(`║ Provider: ${providerUsed} (Delivered: ${delivered ? "YES (Live Gateway)" : "LOGGED / SIMULATED"})`);
  console.log("╟────────────────────────────────────────────────────────────────────╢");
  console.log(`║ Message: ${message}`);
  console.log("╚════════════════════════════════════════════════════════════════════╝\n");

  return { success: true, delivered, provider: providerUsed, to: cleanedPhone };
}
