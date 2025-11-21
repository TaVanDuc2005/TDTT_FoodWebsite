import { Routes, Route, Navigate } from "react-router-dom";
import SignInPage from "./pages/auth/SignInPage.jsx";
import SignUpPage from "./pages/auth/SignupPage.jsx";
import Search from "./pages/test/Search.jsx";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<SignInPage />} />
      <Route path="/register" element={<SignUpPage />} />
      
      {/*Để quochoc test api */}
      <Route path="/search" element={<Search />} /> 

      {/* tạm thời, vào root tự redirect sang login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
