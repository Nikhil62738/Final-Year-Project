import express from "express";
import { scanProduct, analyzeIngredients, getFoodProducts } from "../controllers/productController.js";

const router = express.Router();

router.get("/", getFoodProducts);
router.post("/scan", scanProduct);
router.post("/analyze-ingredients", analyzeIngredients);

export default router;
