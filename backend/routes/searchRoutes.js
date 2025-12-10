// backend/routes/searchRoutes.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

const HF_SEARCH_URL =
  process.env.HF_SEARCH_URL || "https://nemo-chewz.hf.space/api/v1/search/";

/**
 * GET /api/search/advanced
 * Query: q (bắt buộc), các filter khác optional (category, minPrice, maxPrice, ... nếu sau này cần)
 */
router.get("/advanced", async (req, res) => {
  try {
    const { q, top_k, lat, lon, radius, alpha } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Thiếu từ khóa q" });
    }

    // build params gửi lên HF
    const hfParams = {
      q,
      top_k: top_k || 9999, // 👈 mặc định lấy 9999 nếu FE không truyền
    };

    // nếu sau này muốn dùng geo thì FE chỉ cần truyền lat/lon/radius/alpha
    if (lat) hfParams.lat = lat;
    if (lon) hfParams.lon = lon;
    if (radius) hfParams.radius = radius;
    if (alpha) hfParams.alpha = alpha;

    const hfResponse = await axios.get(HF_SEARCH_URL, {
      params: hfParams,
      timeout: 10000,
    });

    const results = hfResponse.data;

    return res.json({
      success: true,
      total: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Advanced search error:", error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        message: "Lỗi từ search service",
        detail: error.response.data,
      });
    }

    return res.status(500).json({
      message: "Lỗi hệ thống khi gọi search service",
    });
  }
});

module.exports = router;
