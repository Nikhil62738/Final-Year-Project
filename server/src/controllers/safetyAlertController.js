import SafetyAlert from "../models/SafetyAlert.js";

// @desc    Get all active safety alerts
// @route   GET /api/alerts
// @access  Public
export const getSafetyAlerts = async (req, res) => {
  try {
    const alerts = await SafetyAlert.find().sort({ createdAt: -1 }).limit(30);
    
    // If DB has no alerts yet, return comprehensive default food safety alerts
    if (!alerts || alerts.length === 0) {
      const defaultAlerts = [
        {
          _id: "alert_1",
          title: "Urgent Recall: Contaminated Chilli Powder Batches",
          summary: "Excess Sudan Dye detected in specific batches of packed red chilli powder.",
          details: "FDA Laboratory analysis revealed non-permitted synthetic dye (Sudan Dye IV) in Batch #CP-2024-88. Retailers are instructed to withdraw stock immediately.",
          category: "food_recall",
          severity: "critical",
          affectedProduct: "Spice-King Red Chilli Powder 250g",
          batchNumber: "CP-2024-88",
          district: "Pune & Mumbai",
          issuedBy: "FDA HQ Mumbai",
          issuedDate: new Date(),
          status: "active",
          recommendedAction: "Do not consume. Return to point of purchase or log complaint on SafeWatch."
        },
        {
          _id: "alert_2",
          title: "Adulteration Advisory: Synthetic Milk Testing",
          summary: "Increased inspection drive against detergent and urea adulteration in unpasteurized loose milk.",
          details: "District enforcement teams are running mobile testing vans at district borders. Citizens buying raw milk from unverified dairies should request FSSAI license numbers.",
          category: "adulteration_warning",
          severity: "warning",
          affectedProduct: "Unpackaged Loose Dairy Milk",
          batchNumber: "N/A - Bulk Supply",
          district: "Nashik & Ahmednagar",
          issuedBy: "District Food Safety Commissioner",
          issuedDate: new Date(Date.now() - 86400000),
          status: "active",
          recommendedAction: "Boil thoroughly. Test milk purity using home lactometer or report suspicious vendors."
        },
        {
          _id: "alert_3",
          title: "Seasonal Hygiene Alert: Festival Sweet Manufacturers",
          summary: "Mandatory FSSAI Silver Foil (Vark) quality check for festival sweets (Mawa/Kawa).",
          details: "FDA Maharashtra has mandated that all sweet vendors use genuine edible silver foil compliant with FSSAI standard (99.9% purity). Aluminum foil usage is strictly prohibited.",
          category: "fssai_advisory",
          severity: "info",
          affectedProduct: "Mawa Sweets & Silver Vark Products",
          batchNumber: "Seasonal Festivity 2024",
          district: "All Maharashtra",
          issuedBy: "FSSAI Regional Directorate",
          issuedDate: new Date(Date.now() - 172800000),
          status: "active",
          recommendedAction: "Ensure sweet shops display FSSAI 14-digit registration number on bill invoice."
        }
      ];
      return res.json(defaultAlerts);
    }
    
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch safety alerts", error: err.message });
  }
};

// @desc    Create a safety alert
// @route   POST /api/alerts
// @access  Officer / Admin
export const createSafetyAlert = async (req, res) => {
  try {
    const alert = await SafetyAlert.create(req.body);
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ message: "Failed to create safety alert", error: err.message });
  }
};
