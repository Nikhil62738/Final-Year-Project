import User from "../models/User.js";

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash -otp -otpExpires -mcVerificationId -resetOtp -resetOtpExpires -mcResetVerificationId");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve profile" });
  }
}

export async function updateProfile(req, res) {
  try {
    const { name, phone, preferredLanguage, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name.trim();
    if (phone) {
      if (!/^[6-9]\d{9}$/.test(phone)) {
        return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" });
      }
      user.phone = phone;
    }
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (avatar !== undefined) {
      const validAvatar = typeof avatar === "string"
        && avatar.length <= 4_200_000
        && (!avatar || /^https:\/\//i.test(avatar) || /^data:image\/(jpeg|png|webp);base64,[a-z\d+/]+=*$/i.test(avatar));
      if (!validAvatar) return res.status(400).json({ message: "Upload a JPG, PNG, or WebP photo up to 3 MB." });
      user.avatar = avatar;
    }

    await user.save();
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      preferredLanguage: user.preferredLanguage,
      role: "user"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile" });
  }
}

export async function getSavedProducts(req, res) {
  try {
    const user = await User.findById(req.user._id).select("savedProducts");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.savedProducts || []);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve saved products" });
  }
}

export async function saveProduct(req, res) {
  try {
    const { barcode, name, brand, imageUrl, nutriscoreGrade } = req.body;
    if (!barcode || !name) {
      return res.status(400).json({ message: "Product barcode and name are required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existing = user.savedProducts.find((p) => p.barcode === barcode);
    if (existing) {
      return res.status(409).json({ message: "Product already saved" });
    }

    user.savedProducts.push({ barcode, name, brand: brand || "", imageUrl: imageUrl || "", nutriscoreGrade: nutriscoreGrade || "" });
    await user.save();
    res.status(201).json(user.savedProducts[user.savedProducts.length - 1]);
  } catch (error) {
    res.status(500).json({ message: "Failed to save product" });
  }
}

export async function removeSavedProduct(req, res) {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const index = user.savedProducts.findIndex((p) => p._id.toString() === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: "Saved product not found" });
    }

    user.savedProducts.splice(index, 1);
    await user.save();
    res.json({ message: "Product removed from saved list" });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove saved product" });
  }
}
