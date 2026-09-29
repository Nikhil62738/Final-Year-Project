import SessionLog from "../models/SessionLog.js";

// @desc    Get session login logs
// @route   GET /api/logs/sessions
// @access  Admin / Super Admin
export const getSessionLogs = async (req, res) => {
  try {
    const { status, userType, search } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (userType) filter.userType = userType;
    if (search) {
      filter.$or = [
        { email: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { ipAddress: { $regex: search, $options: "i" } }
      ];
    }

    const logs = await SessionLog.find(filter)
      .sort({ loginTime: -1 })
      .limit(100);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch session logs", error: err.message });
  }
};

// Helper function to log session logins
export const recordSessionLog = async ({ userType, userId, name, email, phone, role, district, ipAddress, userAgent, status, failureReason }) => {
  try {
    await SessionLog.create({
      userType,
      userId,
      name: name || email || "Unknown",
      email: email || "N/A",
      phone: phone || "N/A",
      role: role || (userType === "officer" ? "field_officer" : "citizen"),
      district: district || "N/A",
      ipAddress: ipAddress || "127.0.0.1",
      userAgent: userAgent || "Web Browser",
      status: status || "success",
      failureReason: failureReason || ""
    });
  } catch (err) {
    console.error("Error recording session log:", err);
  }
};
