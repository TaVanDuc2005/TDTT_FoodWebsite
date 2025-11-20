// src/pages/SignUp.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Auth.css'; // <--- Import CSS riêng

const SignUp = () => {
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="auth-body">
      <div className="auth-page-label">Sign up</div>
      
      <div className="auth-wrapper signup-mode">
        <div className="auth-signup-layout">
          {/* LOGO BÊN TRÁI */}
          <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center'}}>
            <div className="auth-logo-box signup-logo-square">
              <div className="auth-logo-circle signup-logo-circle">TRAVEL &amp; TOURISM<br />LOGO</div>
            </div>
          </div>

          {/* FORM BÊN PHẢI */}
          <div style={{flex:1, display:'flex', justifyContent:'center'}}>
            <div className="auth-form-shell">
              <h1 className="auth-title">ĐĂNG KÝ</h1>

              <form>
                {['Họ và tên', 'Số điện thoại', 'Địa chỉ', 'Email', 'Mật khẩu', 'Xác nhận mật khẩu'].map((label, idx) => (
                  <div className="auth-group" key={idx}>
                    <label className="auth-label">{label}:</label>
                    <input className="auth-input" type={label.includes('khẩu') ? 'password' : 'text'} />
                  </div>
                ))}

                <button type="button" className="auth-btn auth-btn-signup">ĐĂNG KÝ</button>

                <div style={{marginTop: '15px', fontSize: '12px', textAlign: 'center'}}>
                  Đã có tài khoản? <Link to="/signin">Đăng nhập</Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;