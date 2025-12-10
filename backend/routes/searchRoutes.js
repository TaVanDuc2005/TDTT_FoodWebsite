// backend/routes/searchRoutes.js
const express = require("express");
const axios = require("axios");

const router = express.Router();

const HF_SEARCH_URL =
  process.env.HF_SEARCH_URL || "https://nemo-chewz.hf.space/api/v1/search/";

// GET /api/search/advanced
router.get("/advanced", async (req, res) => {
  try {
    const { q, top_k, lat, lon, radius, alpha, min_score } = req.query;

    if (!q || q.trim() === "") {
      return res.status(400).json({ message: "Thiếu từ khóa q" });
    }

    const DEFAULT_LAT = 10.7769;
    const DEFAULT_LON = 106.7009;
    const DEFAULT_RADIUS = 0;
    const DEFAULT_ALPHA = 0.6;
    const DEFAULT_TOP_K = 9999;
    const DEFAULT_MIN_SCORE = 0.35;

    const alphaValue = parseFloat(alpha) || DEFAULT_ALPHA;
    const minScore = parseFloat(min_score) || DEFAULT_MIN_SCORE;
    const queryLower = q.trim().toLowerCase();

    const hfParams = {
      q: q.trim(),
      top_k: top_k || DEFAULT_TOP_K,
      lat: lat || DEFAULT_LAT,
      lon: lon || DEFAULT_LON,
      radius: radius || DEFAULT_RADIUS,
      alpha: alphaValue,
    };

    const hfResponse = await axios.get(HF_SEARCH_URL, {
      params: hfParams,
      timeout: 10000,
    });

    let results = hfResponse.data;

    if (Array.isArray(results)) {
      results = results
        .map((item) => {
          const semanticScore = item.semantic_score || 0;
          const tfidfScore = item.tfidf_score || 0;
          const hybridScore =
            alphaValue * semanticScore + (1 - alphaValue) * tfidfScore;

          // ⭐ Check keyword match
          const hasKeywordInName = item.name.toLowerCase().includes(queryLower);
          const hasKeywordInMenu =
            item.menu?.some((m) => m.name.toLowerCase().includes(queryLower)) ||
            false;
          const hasKeywordMatch = hasKeywordInName || hasKeywordInMenu;

          return {
            ...item,
            hybrid_score: hybridScore,
            has_keyword_match: hasKeywordMatch,
          };
        })
        .filter((item) => {
          // ⭐ LOGIC: Giữ lại nếu:
          // 1. Score cao (>= threshold) HOẶC
          // 2. Có keyword match trực tiếp (với score tối thiểu 0.2)
          return (
            item.hybrid_score >= minScore ||
            (item.has_keyword_match && item.hybrid_score >= 0.2)
          );
        });
    }

    console.log(
      `Filtered from ${hfResponse.data.length} to ${results.length} results`
    );

    return res.json({
      success: true,
      total: results.length,
      data: results,
      metadata: {
        query: q.trim(),
        min_score_applied: minScore,
        alpha_applied: alphaValue,
        original_total: hfResponse.data.length,
        filtered_total: results.length,
      },
    });
  } catch (error) {
    console.error("Advanced search error:", error.message);
    return res.status(500).json({
      message: "Lỗi hệ thống khi gọi search service",
    });
  }
});

module.exports = router;
