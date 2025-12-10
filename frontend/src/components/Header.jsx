import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../App.css';

// 👇 1. NHỚ MỞ LẠI DÒNG NÀY NHA BÀ
import logolmg from '../assets/logo-horizontal.svg'; 

const Header = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="header">
      <div className="container top-bar">
        
        {/* 👇 2. ĐÃ TRẢ LẠI LOGO ẢNH CHO BÀ Ở ĐÂY */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', zIndex: 101 }} onClick={closeMenu}>
          <img 
            src={logolmg} 
            alt="Chewz Logo" 
            style={{ height: '45px', objectFit: 'contain' }} 
          />
        </Link>

        {/* MOBILE TOGGLE */}
        <div className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <span style={{ fontSize: '28px', lineHeight: '1', cursor: 'pointer' }}>
            {isMobileMenuOpen ? "✕" : "☰"}
          </span>
        </div>

        {/* MENU CHÍNH */}
        <nav className={`nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <Link to="/" className={isActive('/')} onClick={closeMenu}>TRANG CHỦ</Link>
          <Link to="/planner" className={isActive('/planner')} onClick={closeMenu}>PLANNER</Link>
          <Link to="/history" className={isActive('/history')} onClick={closeMenu}>LỊCH SỬ</Link>
          <Link to="/about" className={isActive('/about')} onClick={closeMenu}>VỀ CHÚNG TÔI</Link>
          
          {/* MOBILE AUTH */}
          <div className="mobile-auth-block">
             {!user ? (
               <>
                 <Link to="/login" className="mobile-auth-link" onClick={closeMenu}>Đăng nhập</Link>
                 <Link to="/register" className="mobile-auth-link highlight" onClick={closeMenu}>Đăng ký</Link>
               </>
             ) : (
               <Link to="/profile" className="mobile-auth-link" onClick={closeMenu}>
                 👤 {user.name} (Hồ sơ)
               </Link>
             )}
          </div>
        </nav>

        {/* DESKTOP AUTH */}
        <div className="auth-buttons desktop-only">
          {user ? (
            <Link 
              to="/profile" 
              className="user-profile-link" 
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none',
                padding: '5px 12px', borderRadius: '30px',
                background: '#fff0e6', border: '1px solid #ffccb3'
              }}
            >
               <span style={{color: '#d35400', fontWeight: '700', fontSize: '14px'}}>
                 {user.name || "Khách hàng"}
               </span>
               <img 
                 src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=ff6b35&color=fff`} 
                 alt="Ava" 
                 className="header-avatar"
                 style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }}
                 onError={(e) => {e.target.src = "https://placehold.co/40"}} 
               />
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link to="/login" className="btn-login">Đăng nhập</Link>
              <Link to="/register" className="btn-register">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;