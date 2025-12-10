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
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Thiếu từ khóa q" });
    }

    // Gửi request sang service HuggingFace
    const hfResponse = await axios.get(HF_SEARCH_URL, {
      params: { q }, // hiện tại chỉ cần q, sau này thêm filter thì nhét vào đây
      timeout: 10000,
    });

    const results = hfResponse.data;

    // Ở đây result đã là danh sách nhà hàng từ MongoDB (từ service Python)
    // Bạn có thể xử lý thêm nếu muốn (sort lại, filter thêm, ...) rồi trả về
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
