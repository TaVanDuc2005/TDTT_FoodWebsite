// src/pages/AdvancedSearchPage.jsx
import React, { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RestaurantCard from "../components/RestaurantCard";
import { searchAPI } from "/services/api";

const ITEMS_PER_PAGE = 50;

const AdvancedSearchPage = () => {
  const [keyword, setKeyword] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  // Tính toán phân trang
  const totalPages =
    restaurants.length > 0 ? Math.ceil(restaurants.length / ITEMS_PER_PAGE) : 1;

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentRestaurants = restaurants.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setHasSearched(true);

    if (!keyword.trim()) {
      setError("Vui lòng nhập từ khóa tìm kiếm");
      return;
    }

    try {
      setLoading(true);
      setCurrentPage(1); // reset về trang 1 mỗi lần search

      const res = await searchAPI.advanced({ q: keyword.trim() });

      setRestaurants(res.data || []);
      setTotal(res.total || (res.data ? res.data.length : 0));
    } catch (err) {
      console.error(err);
      setError(err.message || "Lỗi tìm kiếm");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Tạo danh sách số trang để hiển thị giống hình: 1 2 ... 24
  const getPageNumbers = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages
        );
      }
    }
    return pages;
  };

  return (
    <div className="app-container">
      <Header />

      <main className="container" style={{ minHeight: "70vh" }}>
        {/* Header giống trang Tất cả nhà hàng */}
        <section className="restaurants-header">
          <h2 className="restaurants-title">Kết quả tìm kiếm</h2>
          {hasSearched && !loading && !error && (
            <p className="restaurants-subtitle">
              Tìm thấy <strong>{total}</strong> kết quả — Trang{" "}
              <strong>{currentPage}</strong> / {totalPages}
            </p>
          )}
        </section>

        {/* Form search */}
        <form onSubmit={handleSubmit} className="search-form-advanced">
          <input
            type="text"
            placeholder="Nhập món ăn / tên quán / khu vực..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="search-input-advanced"
          />

          <button type="submit" className="search-button-advanced">
            Tìm kiếm
          </button>
        </form>

        {loading && <p>🔍 Đang tìm kiếm...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {/* Grid nhà hàng – dùng lại layout RestaurantCard y như trang tất cả */}
        <div className="restaurant-grid">
          {currentRestaurants.map((item) => (
            <RestaurantCard
              key={item._id}
              restaurant={{
                id: item._id,
                name: item.name,
                address: item.address,
                avg_rating: item.avg_rating,
                avatar_url: item.avatar_url,
                // Nếu RestaurantCard cần thêm field (district, price_range, ...),
                // map thêm ở đây từ JSON HuggingFace trả về
              }}
            />
          ))}
        </div>

        {/* Pagination giống hình */}
        {hasSearched && !loading && totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn prev"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ← Trước
            </button>

            {getPageNumbers().map((p, index) =>
              p === "..." ? (
                <span key={`dots-${index}`} className="page-dots">
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  className={p === currentPage ? "page-btn active" : "page-btn"}
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              )
            )}

            <button
              className="page-btn next"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Sau →
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdvancedSearchPage;
