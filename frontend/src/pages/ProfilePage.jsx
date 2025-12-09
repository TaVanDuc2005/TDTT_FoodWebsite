import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import '../App.css';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --- STATE QUẢN LÝ TAB ---
  const [activeTab, setActiveTab] = useState('info'); // 'info' hoặc 'password'

  // --- STATE FORM INFO ---
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    budget: 50000, maxDistanceKm: 5, spiceLevel: 'Vừa',
    favoriteCuisines: [], dietaryRestrictions: []
  });
  
  // --- STATE FORM ĐỔI PASS ---
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State chung
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Options (Giữ nguyên)
  const CUISINE_OPTIONS = ["Việt Nam", "Hàn Quốc", "Nhật Bản", "Trung Quốc", "Thái Lan", "Âu Mỹ", "Fast Food"];
  const DIETARY_OPTIONS = ["Ăn chay (Vegetarian)", "Thuần chay (Vegan)", "Halal", "Không Gluten", "Low Carb"];

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '', email: user.email || '', phone: user.phone || '',
        address: user.address || '', budget: user.budget || 50000,
        maxDistanceKm: user.maxDistanceKm || 5, spiceLevel: user.spiceLevel || 'Vừa',
        favoriteCuisines: user.favoriteCuisines || [], dietaryRestrictions: user.dietaryRestrictions || []
      });
      setAvatarPreview(user.avatar || "https://placehold.co/150");
    }
  }, [user]);

  // --- XỬ LÝ ĐỔI TAB ---
  const switchTab = (tab) => {
    setActiveTab(tab);
    setMessage('');
    setError('');
  };

  // --- XỬ LÝ FORM INFO (Giữ nguyên logic cũ) ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMultiSelect = (category, value) => {
    setFormData(prev => {
      const currentList = prev[category];
      return currentList.includes(value) 
        ? { ...prev, [category]: currentList.filter(item => item !== value) }
        : { ...prev, [category]: [...currentList, value] };
    });
  };

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setLoading(true); setMessage(''); setError('');
    try {
      // Logic gửi API update info (dùng FormData như bài trước)
      console.log("Update Info:", formData);
      setTimeout(() => { setMessage('Cập nhật hồ sơ thành công!'); setLoading(false); }, 1000);
    } catch (err) { setError('Lỗi rồi bà ơi'); setLoading(false); }
  };

  // --- XỬ LÝ FORM ĐỔI PASS (Mới) ---
  const handlePassChange = (e) => setPassData({...passData, [e.target.name]: e.target.value});

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage(''); setError('');

    if (passData.newPassword !== passData.confirmPassword) {
      setError('Mật khẩu mới không khớp!');
      return;
    }
    if (passData.newPassword.length < 6) {
      setError('Mật khẩu phải từ 6 ký tự trở lên.');
      return;
    }

    setLoading(true);
    try {
      // CALL API CHANGE PASSWORD
      console.log("Đổi pass:", passData);
      
      // const res = await fetch('/api/auth/change-password', {
      //   method: 'POST', body: JSON.stringify(passData) ...
      // })

      setTimeout(() => {
        setMessage('Đổi mật khẩu thành công! Nhớ pass mới nha.');
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(err.message || 'Mật khẩu cũ không đúng.');
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (!user) return <div className="text-center p-5">Đang tải...</div>;

  return (
    <div className="container" style={{ marginTop: '30px', marginBottom: '60px' }}>
      
      {/* === NÚT QUAY VỀ TRANG CHỦ === */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#666', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500 }}>
          <span>←</span> Quay về trang chủ
        </Link>
      </div>

      <div className="profile-wrapper">
        
        {/* === CỘT TRÁI: MENU === */}
        <div className="profile-card sidebar">
          <div className="avatar-section">
            <div className="avatar-upload-container">
              <img src={avatarPreview} alt="Avatar" className="profile-avatar" />
              <label htmlFor="file-input" className="camera-btn"><i className="fas fa-camera"></i>📷</label>
              <input id="file-input" type="file" accept="image/*" onChange={handleFileChange} style={{display: 'none'}} />
            </div>
            <h3 className="profile-name">{user.name}</h3>
          </div>
          
          <div className="sidebar-menu">
            <button 
              className={`menu-item ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => switchTab('info')}
            >
              📝 Hồ sơ ăn uống
            </button>
            
            <button 
              className={`menu-item ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => switchTab('password')}
            >
              🔒 Đổi mật khẩu
            </button>

            <button className="menu-item logout-btn" onClick={handleLogout}>
              🚪 Đăng xuất
            </button>
          </div>
        </div>

        {/* === CỘT PHẢI: NỘI DUNG THAY ĐỔI THEO TAB === */}
        <div className="profile-card content">
          
          {/* HIỂN THỊ THÔNG BÁO CHUNG */}
          {message && <div className="alert-box alert-success">{message}</div>}
          {error && <div className="alert-box alert-error">{error}</div>}

          {/* === TAB 1: THÔNG TIN CÁ NHÂN === */}
          {activeTab === 'info' && (
            <form onSubmit={handleUpdateInfo}>
              <h2 className="section-title">Cập nhật hồ sơ</h2>
              
              <h4 className="form-section-header">Thông tin liên hệ</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Tên hiển thị</label>
                  <input type="text" name="name" className="auth-input" value={formData.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (Không đổi được)</label>
                  <input type="email" className="auth-input disabled" value={formData.email} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại</label>
                  <input type="text" name="phone" className="auth-input" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Địa chỉ</label>
                  <input type="text" name="address" className="auth-input" value={formData.address} onChange={handleChange} />
                </div>
              </div>

              <hr style={{margin: '30px 0', borderTop: '1px dashed #ddd'}} />

              <h4 className="form-section-header">Gu ăn uống</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Ngân sách: {new Intl.NumberFormat('vi-VN').format(formData.budget)}đ</label>
                  <input type="number" name="budget" className="auth-input" value={formData.budget} onChange={handleChange} step="5000" />
                </div>
                <div className="form-group">
                   <label className="form-label">Độ cay</label>
                   <select name="spiceLevel" className="auth-input" value={formData.spiceLevel} onChange={handleChange}>
                     <option value="Không">Không cay</option>
                     <option value="Ít">Ít</option>
                     <option value="Vừa">Vừa</option>
                     <option value="Nhiều">Nhiều</option>
                   </select>
                </div>
              </div>
              
              {/* Cuisines & Dietary Tags (Giữ nguyên code cũ) */}
              <div className="form-group" style={{marginTop: 15}}>
                 <label className="form-label">Món yêu thích</label>
                 <div className="tags-container">
                   {CUISINE_OPTIONS.map(item => (
                     <div key={item} className={`choice-tag ${formData.favoriteCuisines.includes(item) ? 'selected' : ''}`} onClick={() => handleMultiSelect('favoriteCuisines', item)}>{item}</div>
                   ))}
                 </div>
              </div>
              
              <div className="form-group">
                 <label className="form-label">Chế độ ăn</label>
                 <div className="tags-container">
                   {DIETARY_OPTIONS.map(item => (
                     <div key={item} className={`choice-tag ${formData.dietaryRestrictions.includes(item) ? 'selected' : ''}`} onClick={() => handleMultiSelect('dietaryRestrictions', item)}>{item}</div>
                   ))}
                 </div>
              </div>

              <div className="form-group" style={{marginTop: 20}}>
                 <label className="form-label">Khoảng cách: {formData.maxDistanceKm} km</label>
                 <input type="range" name="maxDistanceKm" min="1" max="50" className="range-input" value={formData.maxDistanceKm} onChange={handleChange} />
              </div>

              <div style={{ marginTop: '30px', textAlign: 'right' }}>
                <button type="submit" className="auth-btn" style={{ width: 'auto', padding: '12px 40px' }} disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          )}

          {/* === TAB 2: ĐỔI MẬT KHẨU === */}
          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword}>
              <h2 className="section-title">Đổi mật khẩu</h2>
              <p style={{color: '#666', marginBottom: '20px'}}>Để bảo mật, vui lòng nhập mật khẩu cũ trước khi đổi.</p>

              <div className="form-group">
                <label className="form-label">Mật khẩu hiện tại</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  className="auth-input" 
                  value={passData.currentPassword} 
                  onChange={handlePassChange} 
                  required 
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Mật khẩu mới</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    className="auth-input" 
                    value={passData.newPassword} 
                    onChange={handlePassChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nhập lại mật khẩu mới</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    className="auth-input" 
                    value={passData.confirmPassword} 
                    onChange={handlePassChange} 
                    required 
                  />
                </div>
              </div>

              <div style={{ marginTop: '30px', textAlign: 'right' }}>
                <button type="submit" className="auth-btn" style={{ width: 'auto', padding: '12px 40px' }} disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default ProfilePage;