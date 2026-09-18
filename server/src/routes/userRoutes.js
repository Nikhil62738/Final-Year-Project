import express from "express";
import { protectUser } from "../middleware/userAuthMiddleware.js";
import { getProfile, updateProfile, getSavedProducts, saveProduct, removeSavedProduct } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protectUser, getProfile);
router.patch("/me", protectUser, updateProfile);
router.get("/me/saved-products", protectUser, getSavedProducts);
router.post("/me/saved-products", protectUser, saveProduct);
router.delete("/me/saved-products/:id", protectUser, removeSavedProduct);

export default router;
