// backend/routes/foodTourRoutes.js
const express = require("express");
const router = express.Router();
const FoodTour = require("../models/FoodTour");
const authMiddleware = require("../middleware/authMiddleware"); // middleware check JWT

// POST /api/food-tours
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name, slots } = req.body;

    const tour = await FoodTour.create({
      user: req.user.id,
      name,
      slots,
    });

    res.status(201).json(tour);
  } catch (err) {
    console.error("Lỗi tạo FoodTour:", err);
    res.status(500).json({ message: "Không tạo được Food tour" });
  }
});

module.exports = router;
