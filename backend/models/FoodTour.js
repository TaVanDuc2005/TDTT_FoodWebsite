// backend/models/FoodTour.js
const mongoose = require("mongoose");

const foodTourSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    slots: {
      morning: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
      noon: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
      afternoon: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
      evening: [{ type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" }],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FoodTour", foodTourSchema);
