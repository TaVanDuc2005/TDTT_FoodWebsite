// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import LandingPage from './pages/LandingPage';
import About from './pages/About';     // <--- Thêm dòng này
import History from './pages/History'; // <--- Thêm dòng này
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        {/* Các trang mới */}
        <Route path="/about" element={<About />} />     {/* <--- Thêm dòng này */}
        <Route path="/history" element={<History />} /> {/* <--- Thêm dòng này */}
      </Routes>
    </Router>
  );
}

export default App;