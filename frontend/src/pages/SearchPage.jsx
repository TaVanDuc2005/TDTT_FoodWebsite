import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import '../App.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Lấy từ khóa từ URL (ví dụ ?q=pho)
  const initialQuery = searchParams.get('q') || ''; 
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  // MOCK DATA (Dữ liệu giả để test)
  const ALL_RESTAURANTS = [
    { id: 1, name: 'Phở Thìn Lò Đúc', category: 'Phở', rating: 4.5, distance: 2.1, time: '15p', image: 'https://placehold.co/400x300/orange/white?text=Pho+Thin' },
    { id: 2, name: 'Cơm Tấm Cali', category: 'Cơm', rating: 4.2, distance: 1.5, time: '20p', image: 'https://placehold.co/400x300/orange/white?text=Com+Tam' },
    { id: 3, name: 'Bún Bò Huế Xưa', category: 'Bún', rating: 4.8, distance: 5.0, time: '35p', image: 'https://placehold.co/400x300/orange/white?text=Bun+Bo' },
    { id: 4, name: 'Phở 24', category: 'Phở', rating: 4.0, distance: 0.8, time: '10p', image: 'https://placehold.co/400x300/orange/white?text=Pho+24' },
    { id: 5, name: 'Pizza 4P\'s', category: 'Pizza', rating: 4.9, distance: 3.2, time: '40p', image: 'https://placehold.co/400x300/orange/white?text=Pizza' },
    { id: 6, name: 'Gà Rán Popeyes', category: 'Fastfood', rating: 4.6, distance: 1.2, time: '15p', image: 'https://placehold.co/400x300/orange/white?text=Popeyes' },
    { id: 7, name: 'Sushi Tei', category: 'Sushi', rating: 4.7, distance: 4.5, time: '30p', image: 'https://placehold.co/400x300/orange/white?text=Sushi' },
    { id: 8, name: 'Cơm Gà Xối Mỡ', category: 'Cơm', rating: 4.1, distance: 2.5, time: '25p', image: 'https://placehold.co/400x300/orange/white?text=Com+Ga' },
  ];

  // Hàm xử lý Search lại ngay trên trang này
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };

  // Logic lọc và tìm kiếm
  useEffect(() => {
    setLoading(true);
    setSearchTerm(initialQuery); // Sync input với URL

    // Giả lập gọi API (delay 0.8s)
    setTimeout(() => {
      let filtered = ALL_RESTAURANTS;

      // 1. Lọc theo từ khóa (Tên hoặc Category)
      if (initialQuery) {
        const lowerQ = initialQuery.toLowerCase();
        filtered = filtered.filter(item => 
            item.name.toLowerCase().includes(lowerQ) || 
            item.category.toLowerCase().includes(lowerQ)
        );
      }

      // 2. Lọc theo Filter Tab (Ví dụ logic)
      if (activeFilter === 'near') {
        filtered = filtered.sort((a, b) => a.distance - b.distance); // Xếp theo gần nhất
      } else if (activeFilter === 'best') {
        filtered = filtered.sort((a, b) => b.rating - a.rating); // Xếp theo sao cao nhất
      }

      setResults(filtered);
      setLoading(false);
    }, 800);
  }, [initialQuery, activeFilter]); // Chạy lại khi URL đổi hoặc Filter đổi

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '50px' }}>
      
      {/* === HEADER TÌM KIẾM (GRADIENT ĐẸP) === */}
      <div className="search-header-bg">
        <div className="container">
          {/* Input Search */}
          <form onSubmit={handleSearchSubmit} className="search-input-group">
            <input 
              type="text" 
              className="search-input-large"
              placeholder="Tìm món khác... (VD: Cơm, Phở, Pizza)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" style={{
              position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
              background: '#ff6b35', color: 'white', border: 'none', 
              width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer'
            }}>
              🔍
            </button>
          </form>

          {/* Bộ lọc (Filter Pills) */}
          <div className="filter-scroll">
            <button className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>
              Tất cả
            </button>
            <button className={`filter-pill ${activeFilter === 'near' ? 'active' : ''}`} onClick={() => setActiveFilter('near')}>
              📍 Gần tôi nhất
            </button>
            <button className={`filter-pill ${activeFilter === 'best' ? 'active' : ''}`} onClick={() => setActiveFilter('best')}>
              ⭐ Đánh giá cao
            </button>
            <button className={`filter-pill ${activeFilter === 'fast' ? 'active' : ''}`} onClick={() => setActiveFilter('fast')}>
              ⚡ Giao nhanh
            </button>
            <button className="filter-pill">💸 Giá rẻ</button>
          </div>
        </div>
      </div>

      {/* === KẾT QUẢ TÌM KIẾM === */}
      <div className="container">
        <h3 style={{marginBottom: '20px', fontWeight: '600', color: '#333'}}>
          {loading ? 'Đang tìm kiếm...' : (
             results.length > 0 
               ? `Tìm thấy ${results.length} kết quả cho "${initialQuery}"`
               : `Không tìm thấy kết quả nào cho "${initialQuery}"`
          )}
        </h3>

        {loading ? (
          /* LOADING SPINNER */
          <div style={{textAlign: 'center', padding: '50px'}}>
             <div className="spinner" style={{
               border: '4px solid #f3f3f3', borderTop: '4px solid #ff6b35', 
               borderRadius: '50%', width: '40px', height: '40px', 
               animation: 'spin 1s linear infinite', margin: '0 auto'
             }}></div>
             <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              /* GRID KẾT QUẢ */
              <div style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', 
                gap: '25px'
              }}>
                {results.map(res => (
                  <Link to={`/restaurant/${res.id}`} key={res.id} style={{textDecoration: 'none', color: 'inherit'}}>
                    <div className="res-card-pro">
                      <div className="res-img-wrapper">
                        <img src={res.image} alt={res.name} className="res-img-pro" />
                        <div className="rating-badge">⭐ {res.rating}</div>
                      </div>
                      <div style={{padding: '15px'}}>
                        <div style={{fontSize: '12px', color: '#ff6b35', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px'}}>
                          {res.category}
                        </div>
                        <h4 style={{margin: '0 0 8px', fontSize: '17px', fontWeight: '700', lineHeight: '1.4'}}>
                          {res.name}
                        </h4>
                        <div style={{display: 'flex', justifyContent: 'space-between', color: '#777', fontSize: '13px'}}>
                           <span>📍 {res.distance} km</span>
                           <span>🕒 {res.time}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* EMPTY STATE (KHI KHÔNG TÌM THẤY GÌ) */
              <div className="empty-state-container">
                <div className="empty-icon">🍽️</div>
                <h3>Hổng tìm thấy món "{initialQuery}" bà ơi!</h3>
                <p>Thử tìm từ khóa khác như "Cơm", "Phở" xem sao nha.</p>
                <button 
                   onClick={() => {setSearchTerm(''); navigate('/search');}}
                   style={{
                     marginTop: '20px', padding: '10px 25px', 
                     background: '#ff6b35', color: 'white', border: 'none', 
                     borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold'
                   }}
                >
                  Xem tất cả món ngon
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;