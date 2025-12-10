import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext'; 

import './App.css'; 

// === IMPORT CÁC TRANG (PAGES) ===
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage'; 
import About from './pages/About';
import History from './pages/History';
import SignInPage from './pages/auth/SignInPage';
import SignupPage from './pages/auth/SignupPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CategoryPage from './pages/CategoryPage';

// Các trang mới làm thêm:
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';

function App() {
  const { user, loading } = useAuth(); // Thêm loading nếu context có support để tránh flash

  // (Tuỳ chọn) Nếu đang tải user từ local storage thì hiện loading
  // if (loading) return <div>Đang tải...</div>;

  return (
    <Routes>
      {/* 1. TRANG CHỦ: Nếu có user -> Home, chưa có -> Landing */}
      <Route path="/" element={user ? <HomePage /> : <LandingPage />} />
      
      {/* 2. AUTH (Đăng nhập/Đăng ký): Nếu đã login thì đá về Home */}
      <Route path="/signin" element={!user ? <SignInPage /> : <Navigate to="/" />} />
      <Route path="/login" element={!user ? <SignInPage /> : <Navigate to="/" />} />
      <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <SignupPage /> : <Navigate to="/" />} />

      {/* 3. CÁC TRANG CHỨC NĂNG CÔNG KHAI */}
      <Route path="/restaurant/:id" element={<RestaurantDetailPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/category/:slug" element={<CategoryPage />} />

      {/* 4. QUÊN MẬT KHẨU & RESET */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

      {/* 5. CÁC TRANG CẦN ĐĂNG NHẬP (PROTECTED) */}
      <Route path="/history" element={user ? <History /> : <Navigate to="/login" />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
      <Route path="/search" element={<SearchPage />} />
      
      {/* Route 404 (Nếu người dùng gõ link bậy bạ) */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;