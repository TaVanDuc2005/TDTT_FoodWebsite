// Minimal Search Component for API Testing - SỬA THÀNH GET

import { useState } from "react";
// Đã bỏ import CSS và 'data' không cần thiết

function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]); // Giữ lại để lưu kết quả trả về

  /**
   * @description Gửi truy vấn tìm kiếm lên Python Backend bằng phương thức GET.
   */
  async function handleGetQuery() {
    console.log("Đang gửi truy vấn GET:", query);
    
    // --- BƯỚC QUAN TRỌNG: Tạo URL với Query String ---
    // Backend API 1 (v1) của bạn là: /api/v1/search/
    // và nhận query qua tham số 'q' (q: str = Query(..., description="Từ khóa tìm kiếm"))
    const baseUrl = "http://127.0.0.1:8000/api/v1/search/";
    
    // Giả định các tham số mặc định khác: lat, lon, radius, alpha, top_k
    const params = new URLSearchParams({
        q: query, // Truyền từ khóa tìm kiếm
        lat: 10.7769, 
        lon: 106.7009, 
        radius: 0, 
        alpha: 0.6, 
        top_k: 20
    });
    
    const finalUrl = `${baseUrl}?${params.toString()}`;
    console.log("URL đầy đủ:", finalUrl);
    // ----------------------------------------------------

    try {
      // Gọi sang Python Backend
      const response = await fetch(finalUrl, {
        method: "GET", // 👈 ĐÃ SỬA: Phải là GET
        headers: {
          "Content-Type": "application/json", 
          // Headers này không cần thiết cho GET nhưng giữ lại cũng không sao
        },
        // KHÔNG CÓ 'body' cho GET request
      });

      // Kiểm tra trạng thái phản hồi
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Kết quả trả về thành công:", data);
      setResults(data); // Cập nhật kết quả vào state
      
    } catch (error) {
      console.error("❌ Lỗi gửi query:", error);
      setResults([]); // Xóa kết quả nếu có lỗi
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", border: "1px solid #ddd", borderRadius: "8px" }}>
      <h2>🔍 Test API Search V1 (Phương thức GET)</h2>
      <hr/>
      
      {/* Ô TÌM KIẾM */}
      <div style={{ marginBottom: "15px" }}>
        <label htmlFor="search-input" style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nội dung cần tìm:</label>
        <input
          id="search-input"
          type="text"
          placeholder="Nhập nội dung cần tìm..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", padding: "10px", boxSizing: "border-box", borderRadius: "4px", border: "1px solid #ccc" }}
        />
      </div>

      {/* NÚT BẤM */}
      <button 
        type="button" 
        onClick={handleGetQuery} // Đã đổi tên hàm thành handleGetQuery
        style={{ padding: "10px 15px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}
      >
        BẮT ĐẦU TÌM KIẾM (GET)
      </button>

      {/* HIỂN THỊ KẾT QUẢ */}
      {results.length > 0 && (
        <div style={{ marginTop: "20px", borderTop: "1px dashed #ccc", paddingTop: "15px" }}>
          <h3>Kết Quả Trả Về ({results.length} mục):</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: '#f0f8ff', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
      {results.length === 0 && (
        <p style={{ marginTop: "20px", color: "#6c757d" }}>*Chưa có kết quả. Hãy nhập từ khóa và Bắt đầu Tìm kiếm. Kiểm tra Console nếu có lỗi.</p>
      )}
    </div>
  );
}

export default Search;