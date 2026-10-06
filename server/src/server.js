import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDb } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import safetyAlertRoutes from "./routes/safetyAlertRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import productRoutes from "./routes/productRoutes.js";

import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({
  path: path.join(__dirname, "..", ".env"),
});

dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

const app = express();

const configuredClientOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ==================================================
// SECURITY
// ==================================================

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://unpkg.com",
          "https://cdnjs.cloudflare.com",
          "https://accounts.google.com",
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://unpkg.com",
        ],

        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
        ],

        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://*.basemaps.cartocdn.com",
          "https://unpkg.com",
          "https://*.googleusercontent.com",
          "https://images.unsplash.com",
        ],

        mediaSrc: [
          "'self'",
          "blob:",
        ],

        connectSrc: [
          "'self'",
          "https://*.basemaps.cartocdn.com",
          "https://cdnjs.cloudflare.com",
          "https://unpkg.com",
          "https://accounts.google.com",
          "https://router.huggingface.co",
        ],

        frameSrc: [
          "'self'",
          "https://accounts.google.com",
        ],
      },
    },

    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// ==================================================
// MIDDLEWARE
// ==================================================

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || !configuredClientOrigins.length || configuredClientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      let parsedOrigin;
      try {
        parsedOrigin = new URL(origin);
      } catch {
        callback(new Error("Origin not allowed by CORS"));
        return;
      }
      const localDevOrigin = process.env.NODE_ENV !== "production"
        && ["localhost", "127.0.0.1"].includes(parsedOrigin.hostname)
        && Number(parsedOrigin.port || 80) >= 5173
        && Number(parsedOrigin.port || 80) <= 5190;
      callback(localDevOrigin ? null : new Error("Origin not allowed by CORS"), localDevOrigin);
    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
  })
);

app.use(express.json({ limit: "12mb" }));

app.post("/api/assistant/ask", (req, res) => {
  const question = String(req.body?.question || "").trim().toLowerCase();
  if (!question) return res.status(400).json({ message: "Please enter a question." });
  const requestedLanguage = String(req.body?.language || "en").toLowerCase();
  const language = requestedLanguage.startsWith("hi") ? "hi" : requestedLanguage.startsWith("mr") ? "mr" : "en";

  const answers = [
    { match: /complaint|report|submit|file|शिकायत|तक्रार|तक्रारी/, answer: {
      en: "To report a food safety issue, open Submit Complaint, enter the vendor and location, describe what happened, and attach clear evidence photos if available. After submission, save the tracking code to follow progress.",
      hi: "खाद्य सुरक्षा की शिकायत दर्ज करने के लिए Submit Complaint खोलें। विक्रेता और स्थान की जानकारी दें, घटना का विवरण लिखें और उपलब्ध हो तो साफ़ तस्वीरें जोड़ें। जमा करने के बाद शिकायत का ट्रैकिंग कोड सुरक्षित रखें।",
      mr: "अन्न सुरक्षेबाबत तक्रार नोंदवण्यासाठी Submit Complaint उघडा. विक्रेता आणि ठिकाणाची माहिती द्या, काय घडले ते लिहा आणि शक्य असल्यास स्पष्ट फोटो जोडा. तक्रार सादर केल्यानंतर तिचा ट्रॅकिंग कोड जतन करा."
    } },
    { match: /track|status|tracking code|resolution|स्थिति|स्थिती|पाठपुरावा/, answer: {
      en: "Open Track Complaint and search with the FDA tracking code shown after submission. The status timeline displays updates published by the assigned FDA officers.",
      hi: "Track Complaint खोलें और शिकायत जमा करते समय मिला FDA ट्रैकिंग कोड दर्ज करें। समयरेखा में FDA अधिकारियों द्वारा साझा किए गए स्थिति अपडेट दिखेंगे।",
      mr: "Track Complaint उघडा आणि तक्रार सादर केल्यानंतर मिळालेला FDA ट्रॅकिंग कोड टाका. वेळरेषेत FDA अधिकाऱ्यांनी दिलेले स्थिती अपडेट दिसतील."
    } },
    { match: /vote|upvote|support|मतदान|वोट|मत द्या/, answer: {
      en: "Sign in and open the public complaint feed. You can vote on another citizen's complaint once; you cannot vote on a complaint you submitted.",
      hi: "साइन इन करके सार्वजनिक शिकायत सूची खोलें। आप किसी दूसरे नागरिक की शिकायत पर एक बार वोट कर सकते हैं; अपनी शिकायत पर वोट नहीं कर सकते।",
      mr: "साइन इन करून सार्वजनिक तक्रारींची यादी उघडा. दुसऱ्या नागरिकाच्या तक्रारीला एकदा मत देता येते; स्वतःच्या तक्रारीला मत देता येत नाही."
    } },
    { match: /scan|scanner|barcode|photo|picture|image|identify|स्कैन|बारकोड|फोटो|छायाचित्र|ओळखा|पहचान/, answer: {
      en: "Use Scan Product to scan a known product barcode or upload a photo for food image recognition. Photo recognition gives a likely food label only; it cannot confirm nutrition, ingredients, allergens, freshness, or safety. Unknown barcodes are not presented as verified products.",
      hi: "Scan Product में उत्पाद का बारकोड स्कैन करें या खाने की पहचान के लिए तस्वीर अपलोड करें। तस्वीर से केवल संभावित खाद्य पदार्थ का नाम मिलता है; इससे पोषण, सामग्री, एलर्जी, ताज़गी या सुरक्षा की पुष्टि नहीं होती। अज्ञात बारकोड को सत्यापित उत्पाद नहीं बताया जाता।",
      mr: "Scan Product मध्ये उत्पादनाचा बारकोड स्कॅन करा किंवा खाद्यपदार्थ ओळखण्यासाठी फोटो अपलोड करा. फोटोवरून फक्त संभाव्य खाद्यपदार्थाचे नाव मिळते; पोषण, घटक, अॅलर्जी, ताजेपणा किंवा सुरक्षिततेची खात्री होत नाही. अज्ञात बारकोडला पडताळलेले उत्पादन म्हणून दाखवले जात नाही."
    } },
    { match: /alert|recall|warning|अलर्ट|सूचना|आठवण|रिकॉल/, answer: {
      en: "Open Safety Alerts to review published recalls and food safety advisories. Follow the product and batch details in each official alert.",
      hi: "जारी किए गए रिकॉल और खाद्य सुरक्षा सलाह देखने के लिए Safety Alerts खोलें। हर आधिकारिक अलर्ट में दिए गए उत्पाद और बैच का विवरण देखें।",
      mr: "जाहीर केलेले रिकॉल आणि अन्नसुरक्षा सूचना पाहण्यासाठी Safety Alerts उघडा. प्रत्येक अधिकृत सूचनेतील उत्पादन आणि बॅचचा तपशील तपासा."
    } },
    { match: /profile|edit|phone|language|account|प्रोफाइल|संपादित|खाता|खाते/, answer: {
      en: "Open Profile in the top navigation to view or edit your name, phone number, and preferred language. Your email address is read-only.",
      hi: "अपना नाम, फ़ोन नंबर और पसंदीदा भाषा देखने या बदलने के लिए ऊपर दिए गए Profile को खोलें। ईमेल पता बदला नहीं जा सकता।",
      mr: "तुमचे नाव, फोन नंबर आणि पसंतीची भाषा पाहण्यासाठी किंवा बदलण्यासाठी वरचे Profile उघडा. ईमेल पत्ता बदलता येत नाही."
    } },
    { match: /vendor|restaurant|shop|history|risk|विक्रेता|दुकान|व्यापारी/, answer: {
      en: "Select a vendor name in a complaint to view the available vendor profile and its recorded complaint history and regulatory actions.",
      hi: "उपलब्ध विक्रेता प्रोफ़ाइल, शिकायत इतिहास और नियामक कार्रवाई देखने के लिए शिकायत में विक्रेता के नाम पर टैप करें।",
      mr: "उपलब्ध विक्रेता प्रोफाइल, तक्रारींचा इतिहास आणि नियामक कारवाई पाहण्यासाठी तक्रारीतील विक्रेत्याच्या नावावर टॅप करा."
    } },
    { match: /duplicate|already reported|existing|पहले से|आधीच|डुप्लिकेट/, answer: {
      en: "When you submit a complaint, SafeWatch checks for similar active reports. If a match is found, review its tracking code and support the existing report instead of creating another.",
      hi: "शिकायत जमा करते समय SafeWatch मिलती-जुलती सक्रिय शिकायतें खोजता है। मिलान मिलने पर उसका ट्रैकिंग कोड देखें और नई शिकायत बनाने के बजाय उसी शिकायत का समर्थन करें।",
      mr: "तक्रार सादर करताना SafeWatch तत्सम सक्रिय तक्रारी तपासते. जुळणारी तक्रार आढळल्यास तिचा ट्रॅकिंग कोड पाहून नवीन तक्रार करण्याऐवजी त्या तक्रारीला समर्थन द्या."
    } },
    { match: /login|register|sign up|password|otp|लॉगिन|नोंदणी|पासवर्ड|खाते उघडा/, answer: {
      en: "Use Login or Register in the top navigation. Follow the one-time verification steps shown on screen; never share your password or verification code.",
      hi: "ऊपर दिए गए Login या Register विकल्प का उपयोग करें। स्क्रीन पर दिए गए सत्यापन चरण पूरे करें; अपना पासवर्ड या सत्यापन कोड किसी से साझा न करें।",
      mr: "वरच्या Login किंवा Register पर्यायाचा वापर करा. स्क्रीनवरील पडताळणीच्या सूचना पूर्ण करा; तुमचा पासवर्ड किंवा पडताळणी कोड कोणालाही सांगू नका."
    } },
    { match: /contact|help|support|emergency|संपर्क|मदद|सहाय्य|आपत्काल/, answer: {
      en: "For urgent danger contact local emergency services. For SafeWatch support, use the contact details in the page footer or the Help section.",
      hi: "तत्काल खतरे में स्थानीय आपातकालीन सेवाओं से संपर्क करें। SafeWatch सहायता के लिए पेज के नीचे दिए गए संपर्क विवरण या Help अनुभाग का उपयोग करें।",
      mr: "तातडीच्या धोक्याच्या वेळी स्थानिक आपत्कालीन सेवांशी संपर्क साधा. SafeWatch मदतीसाठी पेजच्या तळाशी दिलेला संपर्क किंवा Help विभाग वापरा."
    } },
  ];
  const entry = answers.find((item) => item.match.test(question));
  const fallback = {
    en: "I can help with filing or tracking complaints, voting, food scans, safety alerts, your profile, and vendor records. Try asking about one of those topics.",
    hi: "मैं शिकायत दर्ज करने या उसकी स्थिति देखने, वोट देने, खाद्य स्कैन, सुरक्षा अलर्ट, प्रोफ़ाइल और विक्रेता रिकॉर्ड में मदद कर सकता हूँ। इनमें से किसी विषय पर पूछें।",
    mr: "मी तक्रार नोंदवणे किंवा तिची स्थिती पाहणे, मतदान, खाद्यपदार्थ स्कॅन, सुरक्षा सूचना, प्रोफाइल आणि विक्रेता नोंदी याबाबत मदत करू शकतो. यापैकी एखाद्या विषयावर विचारा."
  };
  res.json({ answer: entry ? entry.answer[language] : fallback[language], language });
});

app.use(morgan("dev"));

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "..", "uploads")
  )
);

// ==================================================
// ROOT ROUTE
// ==================================================

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "FDA SafeWatch API is running",
  });
});

// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

// ==================================================
// API HEALTH CHECK
// ==================================================

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "FDA SafeWatch API",
  });
});

// ==================================================
// GEOCODING
// ==================================================

app.get("/api/geocode", async (req, res) => {
  const q = req.query.q;

  if (!q) {
    return res.status(400).json({
      error: "Missing q parameter",
    });
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?format=json&q=${encodeURIComponent(q)}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "FDA-SafeWatch/1.0 (contact@maharashtra.gov.in)",
      },
    });

    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.error("Geocoding error:", err);

    res.status(500).json({
      error: "Geocoding failed",
    });
  }
});

// ==================================================
// API ROUTES
// ==================================================

app.use("/api/auth", authRoutes);

app.use(
  "/api/complaints",
  complaintRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use("/api/alerts", safetyAlertRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/products", productRoutes);

// ==================================================
// ERROR HANDLING
// ==================================================

app.use(notFound);

app.use(errorHandler);

// ==================================================
// START SERVER
// ==================================================

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(
        `FDA SafeWatch API listening on http://localhost:${port}`
      );
    });
  })
  .catch((err) => {
    console.error(
      "Database connection failed:",
      err
    );

    process.exit(1);
  });

app.get('/api/app-version', (req, res) => {
  const apkUrl = process.env.APP_APK_URL?.trim() || '';

  res.json({
    version: process.env.APP_VERSION?.trim() || '1.0.0',
    apkUrl,
    forceUpdate: process.env.APP_FORCE_UPDATE === 'true',
    releaseNotes: process.env.APP_RELEASE_NOTES?.trim() || ''
  });
});
