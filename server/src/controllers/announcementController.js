import Announcement from "../models/Announcement.js";

// @desc    Get announcements for officer/district admin
// @route   GET /api/announcements
// @access  Officer / Admin
export const getAnnouncements = async (req, res) => {
  try {
    const officer = req.officer;
    let query = {};
    
    if (officer.role !== "super_admin") {
      query = {
        $or: [
          { targetAudience: "all_district_admins" },
          { targetAudience: "all_officers" },
          { targetDistrict: officer.district }
        ]
      };
    }
    
    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .limit(20);

    // Add read state flag per officer
    const formatted = announcements.map(ann => {
      const isRead = ann.readBy?.some(r => r.officerId?.toString() === officer._id?.toString());
      return {
        ...ann.toObject(),
        isRead
      };
    });

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch announcements", error: err.message });
  }
};

// @desc    Create announcement (Super Admin)
// @route   POST /api/announcements
// @access  Super Admin
export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, targetAudience, targetDistrict } = req.body;
    const officer = req.officer;

    if (officer.role !== "super_admin") {
      return res.status(403).json({ message: "Only Super Admin can issue announcements to district admins." });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority: priority || "normal",
      targetAudience: targetAudience || "all_district_admins",
      targetDistrict: targetDistrict || "All",
      createdById: officer._id,
      createdByName: officer.name || "Super Admin"
    });

    res.status(201).json(announcement);
  } catch (err) {
    res.status(400).json({ message: "Failed to create announcement", error: err.message });
  }
};

// @desc    Mark announcement as read
// @route   POST /api/announcements/:id/read
// @access  Officer
export const markAnnouncementRead = async (req, res) => {
  try {
    const { id } = req.params;
    const officerId = req.officer._id;

    const ann = await Announcement.findById(id);
    if (!ann) return res.status(404).json({ message: "Announcement not found" });

    const alreadyRead = ann.readBy.some(r => r.officerId?.toString() === officerId?.toString());
    if (!alreadyRead) {
      ann.readBy.push({ officerId, readAt: new Date() });
      await ann.save();
    }

    res.json({ success: true, message: "Announcement marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark announcement as read", error: err.message });
  }
};
