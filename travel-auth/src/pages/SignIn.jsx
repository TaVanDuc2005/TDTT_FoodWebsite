// src/pages/SignIn.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Auth.css'; // <--- Import file CSS riêng

const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Login:", formData);
  };

  return (
    // Dùng class auth-body để tái tạo body style cũ
    <div className="auth-body"> 
      <div className="auth-page-label">Sign in</div>
      
      <div className="auth-wrapper signin-mode">
        <div className="auth-inner">
          <div className="auth-logo-area">
            <div className="auth-logo-box signin-logo-outer">
              <div className="auth-logo-circle signin-logo-inner">TRAVEL &amp; TOURISM<br />LOGO</div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-group">
              <label className="auth-label" htmlFor="email">Email:</label>
              <input className="auth-input" id="email" type="email" onChange={handleChange} />
            </div>

            <div className="auth-group">
              <label className="auth-label" htmlFor="password">Mật khẩu:</label>
              <input className="auth-input" id="password" type="password" onChange={handleChange} />
            </div>

            <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginTop:'5px'}}>
              <label><input type="checkbox" /> Nhớ mật khẩu</label>
              <span>Quên mật khẩu?</span>
            </div>

            <button type="submit" className="auth-btn auth-btn-login">ĐĂNG NHẬP</button>
            
            <div style={{marginTop: '15px', fontSize: '12px'}}>
                Chưa có tài khoản? <Link to="/signup">Đăng ký ngay</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SignIn;