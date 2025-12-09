// src/pages/ForgotPasswordPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Link API (nhớ check file .env nha)
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Lỗi rồi bà ơi!');

      setMessage('📧 Link xác nhận đã được gửi! Bà check email ngay nha.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Nếu có Logo thì bỏ vào đây nha */}
        {/* <img src="/logo.png" alt="Logo" style={{height: 50, marginBottom: 20}} /> */}
        
        <h2 className="auth-title">Quên mật khẩu?</h2>
        <p className="auth-subtitle">
          Đừng lo, chuyện nhỏ! Nhập email vào đây tụi tui gửi lại mật khẩu cho.
        </p>

        {message && <div className="alert-box alert-success">{message}</div>}
        {error && <div className="alert-box alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email của bà</label>
            <input
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi link khôi phục'}
          </button>
        </form>

        <Link to="/login" className="back-link">
          ← Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;