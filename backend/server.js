// File: TDTT_FoodWebsite/backend/server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const searchRoutes = require("./routes/searchRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const contactRoutes = require("./routes/contactRoutes");
app.use("/api", contactRoutes);

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);
// -> /api/auth/register
// -> /api/auth/login
// -> /api/auth/google

// 🆕 THÊM ĐOẠN NÀY VÀO ĐÂY
const restaurantRoutes = require("./routes/restaurantRoutes");
app.use("/api", restaurantRoutes);
// -> /api/restaurants
// -> /api/restaurants/:id
// -> /api/restaurants/featured
// -> /api/restaurants/categories/stats
// 🆕 KẾT THÚC ĐOẠN THÊM


app.use("/api/search", searchRoutes); // dùng cho cả /api/search/advanced


const foodTourRoutes = require("./routes/foodTourRoutes");
app.use("/api/food-tours", foodTourRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server chạy port ${PORT}`));
