export type Language = 'en' | 'hi' | 'mr';

export const TRANSLATIONS = {
  en: {
    // Top & Brand
    brandTitle: 'Aaharmitra',
    brandSubtitle: 'Food Safety, Healthy India',
    locationDetecting: 'Detecting location…',
    defaultLocation: 'Mumbai, Maharashtra',
    
    // Hero Banner
    heroHeadline: 'Unsafe Food\nShould Not Be on\nAnyone’s Plate',
    heroSub: 'Report food safety issues. Track the action.\nHelp build a healthier India.',
    heroCardTitle: 'Safe Food\nHealthy Citizens\nStronger India',
    heroCardQuote: '“ Food safety is everyone’s responsibility. ”',
    heroCardAuthor: '— FSSAI',
    
    // Quick Actions
    report: 'Report Issue',
    reportSub: 'File Food Complaint',
    scan: 'Scan Product',
    scanSub: 'AI Food & Barcode',
    track: 'Track Status',
    trackSub: 'Check Tracking ID',
    transparency: 'Public Feed',
    transparencySub: 'My Complaint',

    // Stats
    statResolved: 'Complaints Resolved',
    statTime: 'Avg Resolution Time',
    statInspections: 'Active Inspections',

    // Nav & Common
    home: 'Home',
    more: 'More',
    scanFood: 'Scan Food',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    profile: 'My Profile',
    myComplaints: 'My Complaints',
    savedProducts: 'Saved Products',
    notifications: 'Notifications',
    help: 'Help & Support',
    about: 'About Aaharmitra',
    language: 'Language',
    selectLanguage: 'Select Preferred Language',
    saveLanguage: 'Save Language',
    
    // Report Wizard
    fileComplaint: 'File a Food Safety Complaint',
    stepIssue: 'Issue Details',
    stepLocation: 'Location & Evidence',
    stepContact: 'Contact Details',
    stepReview: 'Review & Submit',
    category: 'Complaint Category',
    selectCategory: 'Select category',
    description: 'Describe the Food Safety Violation',
    vendorName: 'Vendor / Restaurant / Shop Name',
    district: 'District',
    address: 'Detailed Address',
    detectGps: 'Detect GPS Location',
    takePhoto: 'Take Photo Evidence',
    uploadGallery: 'Upload from Gallery',
    anonymousToggle: 'File Anonymously (Hide my identity)',
    complainantName: 'Your Full Name',
    complainantPhone: 'Your Mobile Number',
    next: 'Next →',
    submitComplaint: 'Submit Complaint',
    duplicateFound: 'Duplicate Complaint Detected',
    duplicateMsg: 'An active complaint for this vendor in this location already exists. You can upvote the existing report.',
    viewExisting: 'View Existing Report',

    // Track
    enterTrackingCode: 'Enter Tracking Code',
    trackComplaintBtn: 'Track Complaint',
    complaintStatus: 'Complaint Status',
    
    // Transparency
    publicTrackerTitle: 'Public Food Safety Tracker & Feed',
    publicTrackerSub: 'Browse issues reported by citizens, support reports by voting, or look up tracking codes.',
    publicFeedTab: '🔥 Public Feed & Top Voted',
    searchCodeTab: '🔍 Search by Tracking Code',
    upvote: 'VOTE',
    voted: 'VOTED',
  },
  hi: {
    // Top & Brand
    brandTitle: 'एफडीए सेफवॉच',
    brandSubtitle: 'सुरक्षित भोजन, स्वस्थ भारत',
    locationDetecting: 'स्थान खोजा जा रहा है…',
    defaultLocation: 'मुंबई, महाराष्ट्र',

    // Hero Banner
    heroHeadline: 'असुरक्षित भोजन\nकिसी की थाली में\nनहीं होना चाहिए',
    heroSub: 'खाद्य सुरक्षा संबंधी रिपोर्ट करें। कार्रवाई ट्रैक करें।\nस्वस्थ भारत बनाएं।',
    heroCardTitle: 'सुरक्षित भोजन\nस्वस्थ नागरिक\nसशक्त भारत',
    heroCardQuote: '“ खाद्य सुरक्षा हर किसी की जिम्मेदारी है। ”',
    heroCardAuthor: '— एफएसएसएआई',

    // Quick Actions
    report: 'शिकायत करें',
    reportSub: 'खाद्य सुरक्षा उल्लंघन',
    scan: 'उत्पाद स्कैन',
    scanSub: 'एआई खाद्य और बारकोड',
    track: 'स्थिति ट्रैक करें',
    trackSub: 'ट्रैकिंग आईडी जांचें',
    transparency: 'सार्वजनिक फ़ीड',
    transparencySub: 'पारदर्शिता रजिस्टर',

    // Stats
    statResolved: 'सुलझाई गई शिकायतें',
    statTime: 'औसत समाधान समय',
    statInspections: 'सक्रिय निरीक्षण',

    // Nav & Common
    home: 'होम',
    more: 'अधिक',
    scanFood: 'खाद्य स्कैन',
    login: 'लॉग इन करें',
    register: 'रजिस्टर करें',
    logout: 'लॉग आउट',
    profile: 'मेरी प्रोफ़ाइल',
    myComplaints: 'मेरी शिकायतें',
    savedProducts: 'सहेजे गए उत्पाद',
    notifications: 'सूचनाएं',
    help: 'सहायता एवं समर्थन',
    about: 'एफडीए सेफवॉच के बारे में',
    language: 'भाषा बदलें',
    selectLanguage: 'अपनी पसंदीदा भाषा चुनें',
    saveLanguage: 'भाषा सुरक्षित करें',

    // Report Wizard
    fileComplaint: 'खाद्य सुरक्षा शिकायत दर्ज करें',
    stepIssue: 'समस्या का विवरण',
    stepLocation: 'स्थान एवं साक्ष्य',
    stepContact: 'संपर्क विवरण',
    stepReview: 'समीक्षा एवं जमा करें',
    category: 'शिकायत की श्रेणी',
    selectCategory: 'श्रेणी चुनें',
    description: 'खाद्य सुरक्षा उल्लंघन का विवरण दें',
    vendorName: 'दुकान / होटल / विक्रेता का नाम',
    district: 'जिला',
    address: 'विस्तृत पता',
    detectGps: 'जीपीएस स्थान पहचानें',
    takePhoto: 'साक्ष्य फोटो खींचें',
    uploadGallery: 'गैलरी से अपलोड करें',
    anonymousToggle: 'गोपनीय शिकायत (मेरी पहचान छुपाएं)',
    complainantName: 'आपका पूरा नाम',
    complainantPhone: 'आपका मोबाइल नंबर',
    next: 'आगे बढ़ें →',
    submitComplaint: 'शिकायत दर्ज करें',
    duplicateFound: 'समान शिकायत पहले से मौजूद है',
    duplicateMsg: 'इस विक्रेता और स्थान के लिए पहले से सक्रिय शिकायत दर्ज है। आप इस पर वोट दे सकते हैं।',
    viewExisting: 'मौजूदा शिकायत देखें',

    // Track
    enterTrackingCode: 'ट्रैकिंग कोड दर्ज करें',
    trackComplaintBtn: 'शिकायत ट्रैक करें',
    complaintStatus: 'शिकायत की स्थिति',

    // Transparency
    publicTrackerTitle: 'सार्वजनिक खाद्य सुरक्षा ट्रैकर एवं फ़ीड',
    publicTrackerSub: 'नागरिकों द्वारा दर्ज मामलों को देखें, वोट देकर समर्थन करें, या ट्रैकिंग कोड खोजें।',
    publicFeedTab: '🔥 सार्वजनिक फ़ीड व लोकप्रिय',
    searchCodeTab: '🔍 ट्रैकिंग कोड द्वारा खोजें',
    upvote: 'वोट',
    voted: 'वोट दिया',
  },
  mr: {
    // Top & Brand
    brandTitle: 'एफडीए सेफवॉच',
    brandSubtitle: 'सुरक्षित अन्न, निरोगी भारत',
    locationDetecting: 'स्थान शोधत आहे…',
    defaultLocation: 'मुंबई, महाराष्ट्र',

    // Hero Banner
    heroHeadline: 'असुरक्षित अन्न\nकोणाच्याही ताटात\nअसू नये',
    heroSub: 'अन्न सुरक्षेची तक्रार नोंदवा. कारवाई ट्रॅक करा.\nनिरोगी भारत घडवा.',
    heroCardTitle: 'सुरक्षित अन्न\nनिरोगी नागरिक\nसशक्त भारत',
    heroCardQuote: '“ अन्न सुरक्षा ही प्रत्येकाची जबाबदारी आहे. ”',
    heroCardAuthor: '— एफएसएसएआय',

    // Quick Actions
    report: 'तक्रार नोंदवा',
    reportSub: 'अन्न भेसळ व सुरक्षा',
    scan: 'उत्पादन स्कॅन',
    scanSub: 'एआय अन्न व बारकोड',
    track: 'स्थिती तपासा',
    trackSub: 'ट्रॅकिंग कोडद्वारे शोधा',
    transparency: 'सार्वजनिक यादी',
    transparencySub: 'पारदर्शकता नोंदवही',

    // Stats
    statResolved: 'निवारण झालेल्या तक्रारी',
    statTime: 'सरासरी निवारण वेळ',
    statInspections: 'सक्रिय तपासण्या',

    // Nav & Common
    home: 'मुख्यपृष्ठ',
    more: 'अधिक पर्याय',
    scanFood: 'अन्न स्कॅन',
    login: 'लॉगिन करा',
    register: 'नोंदणी करा',
    logout: 'बाहेर पडा',
    profile: 'माझे प्रोफाइल',
    myComplaints: 'माझ्या तक्रारी',
    savedProducts: 'जतन केलेले पदार्थ',
    notifications: 'सूचना',
    help: 'मदत आणि सहकार्य',
    about: 'एफडीए सेफवॉच विषयी',
    language: 'भाषा निवडा',
    selectLanguage: 'तुमची पसंतीची भाषा निवडा',
    saveLanguage: 'भाषा जतन करा',

    // Report Wizard
    fileComplaint: 'अन्न सुरक्षा तक्रार नोंदवा',
    stepIssue: 'समस्येचे स्वरूप',
    stepLocation: 'ठिकाण व पुरावे',
    stepContact: 'संपर्क तपशील',
    stepReview: 'तपासा व दाखल करा',
    category: 'तक्रारीचा प्रकार',
    selectCategory: 'प्रकार निवडा',
    description: 'अन्न भेसळ किंवा समस्येचे वर्णन करा',
    vendorName: 'दुकानदार / हॉटेलचे नाव',
    district: 'जिल्हा',
    address: 'संपूर्ण पत्ता',
    detectGps: 'जीपीएस स्थान मिळवा',
    takePhoto: 'फोटो पुरावा काढा',
    uploadGallery: 'गॅलरीतून फोटो निवडा',
    anonymousToggle: 'गोपनीय तक्रार (नाव गुप्त ठेवा)',
    complainantName: 'तुमचे पूर्ण नाव',
    complainantPhone: 'तुमचा मोबाईल नंबर',
    next: 'पुढे जा →',
    submitComplaint: 'तक्रार दाखल करा',
    duplicateFound: 'समान तक्रार आधीच नोंदवलेली आहे',
    duplicateMsg: 'या विक्रेत्याविरुद्ध याच भागात आधीच तक्रार नोंदवली गेली आहे. आपण या तक्रारीस मत (Vote) देऊ शकता.',
    viewExisting: 'नोंदवलेली तक्रार पहा',

    // Track
    enterTrackingCode: 'ट्रॅकिंग कोड टाका',
    trackComplaintBtn: 'तक्रार शोधा',
    complaintStatus: 'तक्रारीची सद्यस्थिती',

    // Transparency
    publicTrackerTitle: 'सार्वजनिक अन्न सुरक्षा नोंदवही आणि फीड',
    publicTrackerSub: 'नागरिकांनी नोंदवलेल्या तक्रारी पहा, मत देऊन पाठिंबा द्या किंवा ट्रॅकिंग कोड शोधा.',
    publicFeedTab: '🔥 सार्वजनिक फीड व सर्वाधिक मते',
    searchCodeTab: '🔍 ट्रॅकिंग कोडनुसार शोधा',
    upvote: 'मत द्या',
    voted: 'मत दिले',
  },
};
