import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RestaurantCard from "../components/RestaurantCard";
import { searchAPI } from "/services/api";

const ITEMS_PER_PAGE = 12;

const AdvancedSearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search States
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Geolocation States
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  // Filter States
  const [filters, setFilters] = useState({
    category: "Tất cả",
    priceRange: "Tất cả",
    minRating: 0,
    district: "Tất cả",
    sortBy: "hybrid", // hybrid, semantic, tfidf, rating, distance, name
    maxDistance: null, // km - for "Quán gần tôi"
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Categories
  const categories = [
    "Tất cả",
    "Lẩu",
    "BBQ",
    "Cơm",
    "Phở",
    "Bún",
    "Trà sữa",
    "Cafe",
    "Hải sản",
    "Buffet",
    "Khác",
  ];

  const priceRanges = [
    "Tất cả",
    "Dưới 50k",
    "50k - 100k",
    "100k - 200k",
    "200k - 500k",
    "Trên 500k",
  ];

  const districts = [
    "Tất cả",
    "Quận 1",
    "Quận 2",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 6",
    "Quận 7",
    "Quận 8",
    "Quận 9",
    "Quận 10",
    "Quận 11",
    "Quận 12",
    "Bình Thạnh",
    "Gò Vấp",
    "Tân Bình",
    "Phú Nhuận",
    "Thủ Đức",
    "Bình Tân",
    "Tân Phú",
  ];

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  // Calculate Haversine distance in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Extract price from price_range string
  const extractPrice = (priceRange) => {
    if (!priceRange || priceRange === "Đang cập nhật") return null;
    const match = priceRange.match(/(\d+)k?/i);
    return match ? parseInt(match[1]) * 1000 : null;
  };

  // Check if restaurant matches price range filter
  const matchesPriceRange = (restaurant, range) => {
    if (range === "Tất cả") return true;

    const price = extractPrice(restaurant.price_range);
    if (!price) return false;

    switch (range) {
      case "Dưới 50k":
        return price < 50000;
      case "50k - 100k":
        return price >= 50000 && price <= 100000;
      case "100k - 200k":
        return price >= 100000 && price <= 200000;
      case "200k - 500k":
        return price >= 200000 && price <= 500000;
      case "Trên 500k":
        return price > 500000;
      default:
        return true;
    }
  };

  // Extract district from address
  const extractDistrict = (address) => {
    if (!address) return "";
    const match = address.match(/Quận\s+\d+|Q\.\s*\d+|Quận\s+\w+/i);
    if (!match) return "";
    return match[0].replace(/Q\./i, "Quận");
  };

  // Calculate hybrid score (weighted combination)
  const calculateHybridScore = (restaurant) => {
    const semantic = restaurant.semantic_score || 0;
    const tfidf = restaurant.tfidf_score || 0;

    // Weighted combination: 60% semantic + 40% TF-IDF
    // Cân bằng giữa ý nghĩa ngữ nghĩa và keyword matching
    return semantic * 0.6 + tfidf * 0.4;
  };

  // ==========================================
  // GEOLOCATION
  // ==========================================

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        setUserLocation(location);
        setLocationLoading(false);

        // Auto-apply distance filter
        setFilters((prev) => ({
          ...prev,
          maxDistance: 5, // Default 5km
          sortBy: "distance",
        }));
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Bạn cần cho phép truy cập vị trí");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Không thể xác định vị trí");
            break;
          case error.TIMEOUT:
            setLocationError("Timeout xác định vị trí");
            break;
          default:
            setLocationError("Lỗi xác định vị trí");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache 5 minutes
      }
    );
  };

  // ==========================================
  // FILTERING & SORTING
  // ==========================================

  const applyFilters = (
    restaurantList,
    customFilters = filters,
    customLocation = userLocation
  ) => {
    let filtered = [...restaurantList];

    const f = customFilters;
    const loc = customLocation;

    // Add distance data if user location available
    if (loc) {
      filtered = filtered.map((r) => ({
        ...r,
        distance:
          r.lat && r.lon
            ? calculateDistance(loc.lat, loc.lon, r.lat, r.lon)
            : null,
      }));
    }

    // Filter by category
    if (f.category !== "Tất cả") {
      filtered = filtered.filter((r) => r.category === f.category);
    }

    // Filter by price range
    if (f.priceRange !== "Tất cả") {
      filtered = filtered.filter((r) => matchesPriceRange(r, f.priceRange));
    }

    // Filter by minimum rating
    if (f.minRating > 0) {
      filtered = filtered.filter((r) => r.avg_rating >= f.minRating);
    }

    // Filter by district
    if (f.district !== "Tất cả") {
      filtered = filtered.filter((r) => {
        const district = extractDistrict(r.address);
        return district === f.district;
      });
    }

    // Filter by max distance (if location available)
    if (f.maxDistance && loc) {
      filtered = filtered.filter((r) => {
        return r.distance !== null && r.distance <= f.maxDistance;
      });
    }

    // Sort results
    switch (f.sortBy) {
      case "hybrid":
        filtered.sort((a, b) => {
          const scoreA = calculateHybridScore(a);
          const scoreB = calculateHybridScore(b);
          return scoreB - scoreA;
        });
        break;
      case "semantic":
        filtered.sort(
          (a, b) => (b.semantic_score || 0) - (a.semantic_score || 0)
        );
        break;
      case "tfidf":
        filtered.sort((a, b) => (b.tfidf_score || 0) - (a.tfidf_score || 0));
        break;
      case "rating":
        filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
        break;
      case "distance":
        if (loc) {
          filtered.sort((a, b) => {
            const distA = a.distance !== null ? a.distance : Infinity;
            const distB = b.distance !== null ? b.distance : Infinity;
            return distA - distB;
          });
        }
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name, "vi"));
        break;
      default:
        break;
    }

    return filtered;
  };

  // ==========================================
  // SEARCH HANDLER
  // ==========================================

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    setError("");
    setHasSearched(true);
    setCurrentPage(1);

    if (!keyword.trim()) {
      setError("Vui lòng nhập từ khóa tìm kiếm");
      return;
    }

    try {
      setLoading(true);

      // Call HuggingFace search API
      const res = await searchAPI.advanced({ q: keyword.trim() });
      const searchResults = res.data || [];

      setRestaurants(searchResults);

      // Apply filters immediately
      const filtered = applyFilters(searchResults);
      setFilteredRestaurants(filtered);

      // Update URL
      setSearchParams({ q: keyword.trim() });
    } catch (err) {
      console.error(err);
      setError(err.message || "Lỗi tìm kiếm");
      setRestaurants([]);
      setFilteredRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FILTER CHANGE HANDLER
  // ==========================================

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    setCurrentPage(1);

    // Dùng newFilters + userLocation hiện tại
    const filtered = applyFilters(restaurants, newFilters, userLocation);
    setFilteredRestaurants(filtered);
  };

  // Reset filters
  const handleResetFilters = () => {
    const defaultFilters = {
      category: "Tất cả",
      priceRange: "Tất cả",
      minRating: 0,
      district: "Tất cả",
      sortBy: "hybrid",
      maxDistance: null,
    };

    setFilters(defaultFilters);
    setUserLocation(null);
    setLocationError("");

    const filtered = applyFilters(restaurants, defaultFilters, null);
    setFilteredRestaurants(filtered);
    setCurrentPage(1);
  };

  // ==========================================
  // EFFECTS
  // ==========================================

  // Load initial search from URL
  useEffect(() => {
    if (hasSearched && restaurants.length > 0) {
      const filtered = applyFilters(restaurants, filters, userLocation);
      setFilteredRestaurants(filtered);
    }
  }, [userLocation, filters]);

  // Re-apply filters when userLocation changes
  useEffect(() => {
    if (hasSearched && restaurants.length > 0) {
      const filtered = applyFilters(restaurants);
      setFilteredRestaurants(filtered);
    }
  }, [userLocation]);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.ceil(filteredRestaurants.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentRestaurants = filteredRestaurants.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="app-container">
      <Header />

      <main
        className="container"
        style={{ minHeight: "70vh", paddingTop: "40px" }}
      >
        {/* Page Title */}
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#E65100",
              marginBottom: "10px",
            }}
          >
            🔍 Tìm kiếm thông minh
          </h1>
          <p style={{ color: "#666", fontSize: "15px" }}>
            Hơn 1,200 nhà hàng với thuật toán Hybrid Ranking (Semantic + TF-IDF)
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: "30px" }}>
          <div
            style={{
              display: "flex",
              gap: "12px",
              maxWidth: "100%",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Nhập món ăn, tên quán, hoặc khu vực..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{
                flex: 1,
                minWidth: "300px",
                padding: "14px 20px",
                fontSize: "15px",
                border: "2px solid #E0E0E0",
                borderRadius: "12px",
                outline: "none",
                transition: "all 0.3s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#E65100";
                e.target.style.boxShadow = "0 0 0 3px rgba(230,81,0,0.1)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E0E0E0";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              type="submit"
              style={{
                padding: "14px 32px",
                background: "linear-gradient(135deg, #E65100 0%, #FF6D00 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(230,81,0,0.3)",
                whiteSpace: "nowrap",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(230,81,0,0.4)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(230,81,0,0.3)";
              }}
            >
              🔍 Tìm kiếm
            </button>

            {/* "Quán gần tôi" Button */}
            <button
              type="button"
              onClick={getUserLocation}
              disabled={locationLoading}
              style={{
                padding: "14px 24px",
                background: userLocation
                  ? "linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)"
                  : "linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: locationLoading ? "not-allowed" : "pointer",
                transition: "all 0.3s",
                boxShadow: "0 4px 12px rgba(33,150,243,0.3)",
                whiteSpace: "nowrap",
                opacity: locationLoading ? 0.7 : 1,
              }}
              onMouseOver={(e) => {
                if (!locationLoading) {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 20px rgba(33,150,243,0.4)";
                }
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(33,150,243,0.3)";
              }}
            >
              {locationLoading
                ? "📍 Đang định vị..."
                : userLocation
                ? "✅ Đã có vị trí"
                : "📍 Quán gần tôi"}
            </button>
          </div>

          {/* Location info/error */}
          {userLocation && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 16px",
                background: "#E8F5E9",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#2E7D32",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>✅</span>
              <span>
                Vị trí hiện tại: {userLocation.lat.toFixed(6)},{" "}
                {userLocation.lon.toFixed(6)}
                {filters.maxDistance &&
                  ` (trong bán kính ${filters.maxDistance}km)`}
              </span>
            </div>
          )}

          {locationError && (
            <div
              style={{
                marginTop: "12px",
                padding: "10px 16px",
                background: "#FFEBEE",
                borderRadius: "8px",
                fontSize: "13px",
                color: "#C62828",
              }}
            >
              ⚠️ {locationError}
            </div>
          )}
        </form>

        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              fontSize: "16px",
              color: "#666",
            }}
          >
            🔍 Đang tìm kiếm với AI Semantic Search...
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "16px",
              background: "#FFEBEE",
              color: "#C62828",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* Main Content Area */}
        {hasSearched && !loading && !error && (
          <div style={{ display: "flex", gap: "30px" }}>
            {/* Sidebar Filters */}
            <aside
              style={{
                width: "280px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                  position: "sticky",
                  top: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: "#333",
                    }}
                  >
                    🎯 Bộ lọc
                  </h3>
                  <button
                    onClick={handleResetFilters}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#E65100",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Đặt lại
                  </button>
                </div>

                {/* Sort By - PRIORITY FIRST */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: "10px",
                    }}
                  >
                    🔄 Sắp xếp theo
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "2px solid #E0E0E0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none",
                      background: "#FFF3E0",
                      fontWeight: "600",
                    }}
                  >
                    <option value="hybrid">🎯 Hybrid Score (Đề xuất)</option>
                    <option value="semantic">🧠 Semantic Score</option>
                    <option value="tfidf">📊 TF-IDF Score</option>
                    <option value="rating">⭐ Đánh giá cao nhất</option>
                    {userLocation && (
                      <option value="distance">📍 Gần nhất</option>
                    )}
                    <option value="name">🔤 Tên A-Z</option>
                  </select>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#999",
                      marginTop: "6px",
                      fontStyle: "italic",
                    }}
                  >
                    {filters.sortBy === "hybrid" && "60% Semantic + 40% TF-IDF"}
                    {filters.sortBy === "semantic" &&
                      "Dựa trên ý nghĩa ngữ nghĩa"}
                    {filters.sortBy === "tfidf" && "Dựa trên keyword matching"}
                  </div>
                </div>

                {/* Distance Filter (if location available) */}
                {userLocation && (
                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#555",
                        marginBottom: "10px",
                      }}
                    >
                      📍 Khoảng cách tối đa
                    </label>
                    <select
                      value={filters.maxDistance || ""}
                      onChange={(e) =>
                        handleFilterChange(
                          "maxDistance",
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "2px solid #E0E0E0",
                        borderRadius: "8px",
                        fontSize: "14px",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="">Không giới hạn</option>
                      <option value="1">1 km</option>
                      <option value="2">2 km</option>
                      <option value="3">3 km</option>
                      <option value="5">5 km</option>
                      <option value="10">10 km</option>
                      <option value="20">20 km</option>
                    </select>
                  </div>
                )}

                {/* Category Filter */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: "10px",
                    }}
                  >
                    🍴 Loại món
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "2px solid #E0E0E0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: "10px",
                    }}
                  >
                    💰 Mức giá
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) =>
                      handleFilterChange("priceRange", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "2px solid #E0E0E0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {priceRanges.map((range) => (
                      <option key={range} value={range}>
                        {range}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: "10px",
                    }}
                  >
                    ⭐ Đánh giá tối thiểu
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {[0, 3, 3.5, 4, 4.5].map((rating) => (
                      <label
                        key={rating}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          padding: "8px",
                          borderRadius: "6px",
                          background:
                            filters.minRating === rating
                              ? "#FFF3E0"
                              : "transparent",
                          transition: "all 0.2s",
                        }}
                      >
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          checked={filters.minRating === rating}
                          onChange={(e) =>
                            handleFilterChange(
                              "minRating",
                              parseFloat(e.target.value)
                            )
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <span style={{ fontSize: "14px" }}>
                          {rating === 0 ? "Tất cả" : `${rating}+ sao`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* District Filter */}
                <div style={{ marginBottom: "24px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#555",
                      marginBottom: "10px",
                    }}
                  >
                    📍 Khu vực
                  </label>
                  <select
                    value={filters.district}
                    onChange={(e) =>
                      handleFilterChange("district", e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      border: "2px solid #E0E0E0",
                      borderRadius: "8px",
                      fontSize: "14px",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    {districts.map((dist) => (
                      <option key={dist} value={dist}>
                        {dist}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </aside>

            {/* Results Area */}
            <div style={{ flex: 1 }}>
              {/* Results Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "24px",
                  padding: "16px",
                  background: "#fff",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "20px",
                      fontWeight: "700",
                      color: "#333",
                      marginBottom: "4px",
                    }}
                  >
                    Kết quả tìm kiếm
                  </h2>
                  <p style={{ fontSize: "14px", color: "#666" }}>
                    Tìm thấy <strong>{filteredRestaurants.length}</strong> nhà
                    hàng
                    {restaurants.length !== filteredRestaurants.length &&
                      ` (từ ${restaurants.length} kết quả)`}
                  </p>
                </div>
                <div style={{ fontSize: "14px", color: "#999" }}>
                  Trang {currentPage} / {totalPages || 1}
                </div>
              </div>

              {/* Restaurant Grid */}
              {currentRestaurants.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(300px, 1fr))",
                    gap: "24px",
                    marginBottom: "40px",
                  }}
                >
                  {currentRestaurants.map((restaurant) => (
                    <div key={restaurant._id} style={{ position: "relative" }}>
                      <RestaurantCard restaurant={restaurant} />

                      {/* Show distance badge if available */}
                      {restaurant.distance !== undefined &&
                        restaurant.distance !== null && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: "16px",
                              right: "16px",
                              background: "rgba(33,150,243,0.95)",
                              color: "#fff",
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              fontWeight: "600",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                              zIndex: 10,
                            }}
                          >
                            📍 {restaurant.distance.toFixed(1)} km
                          </div>
                        )}

                      {/* Show score badges in debug mode */}
                      {false && ( // Set to true to enable debug display
                        <div
                          style={{
                            position: "absolute",
                            top: "60px",
                            left: "12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <div
                            style={{
                              background: "rgba(0,0,0,0.7)",
                              color: "#fff",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                            }}
                          >
                            Hybrid:{" "}
                            {calculateHybridScore(restaurant).toFixed(3)}
                          </div>
                          <div
                            style={{
                              background: "rgba(0,0,0,0.7)",
                              color: "#fff",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                            }}
                          >
                            Sem: {(restaurant.semantic_score || 0).toFixed(3)}
                          </div>
                          <div
                            style={{
                              background: "rgba(0,0,0,0.7)",
                              color: "#fff",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "10px",
                            }}
                          >
                            TFIDF: {(restaurant.tfidf_score || 0).toFixed(3)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    background: "#fff",
                    borderRadius: "12px",
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                    😔
                  </div>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: "600",
                      color: "#333",
                      marginBottom: "8px",
                    }}
                  >
                    Không tìm thấy kết quả
                  </h3>
                  <p style={{ color: "#666", fontSize: "14px" }}>
                    Thử điều chỉnh bộ lọc hoặc tìm kiếm từ khóa khác
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                    padding: "20px 0",
                  }}
                >
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    style={{
                      padding: "10px 16px",
                      background: currentPage === 1 ? "#F5F5F5" : "#fff",
                      border: "2px solid #E0E0E0",
                      borderRadius: "8px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: currentPage === 1 ? "#999" : "#333",
                      transition: "all 0.2s",
                    }}
                  >
                    ← Trước
                  </button>

                  {getPageNumbers().map((p, index) =>
                    p === "..." ? (
                      <span
                        key={`dots-${index}`}
                        style={{ padding: "0 8px", color: "#999" }}
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        style={{
                          padding: "10px 16px",
                          background: p === currentPage ? "#E65100" : "#fff",
                          border: "2px solid",
                          borderColor:
                            p === currentPage ? "#E65100" : "#E0E0E0",
                          borderRadius: "8px",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: p === currentPage ? "#fff" : "#333",
                          minWidth: "44px",
                          transition: "all 0.2s",
                        }}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    style={{
                      padding: "10px 16px",
                      background:
                        currentPage === totalPages ? "#F5F5F5" : "#fff",
                      border: "2px solid #E0E0E0",
                      borderRadius: "8px",
                      cursor:
                        currentPage === totalPages ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: currentPage === totalPages ? "#999" : "#333",
                      transition: "all 0.2s",
                    }}
                  >
                    Sau →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state when no search performed */}
        {!hasSearched && !loading && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎯</div>
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "700",
                color: "#333",
                marginBottom: "12px",
              }}
            >
              Tìm kiếm thông minh với AI
            </h2>
            <p
              style={{
                color: "#666",
                fontSize: "15px",
                maxWidth: "600px",
                margin: "0 auto 20px",
              }}
            >
              Sử dụng thuật toán Hybrid Ranking (Semantic Search + TF-IDF) để
              tìm nhà hàng phù hợp nhất với bạn
            </p>
            <div
              style={{
                display: "flex",
                gap: "16px",
                justifyContent: "center",
                marginTop: "24px",
                fontSize: "14px",
                color: "#999",
              }}
            >
              <span>🧠 Semantic Score</span>
              <span>📊 TF-IDF Score</span>
              <span>📍 Geolocation</span>
              <span>⭐ Rating</span>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdvancedSearchPage;
