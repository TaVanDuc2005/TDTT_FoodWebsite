import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Restaurants from "./pages/Restaurants";
import Categories from "./pages/Categories";
import Reviews from "./pages/Reviews";
import ReviewViolations from "./pages/ReviewViolations";
import ReviewsDeleted from "./pages/ReviewsDeleted";
import Users from "./pages/Users";

function routeForHash(hash) {
  if (!hash) return { name: "home" };
  if (hash.startsWith("#/restaurants")) return { name: "restaurants" };
  if (hash.startsWith("#/categories")) return { name: "categories" };
  if (hash.startsWith("#/reviews/violations"))
    return { name: "review-violations" };
  if (hash.startsWith("#/reviews/deleted")) return { name: "reviews-deleted" };
  if (hash.startsWith("#/reviews")) return { name: "reviews" };
  if (hash.startsWith("#/users")) return { name: "users" };
  return { name: "home" };
}

export default function App() {
  const [route, setRoute] = useState(routeForHash(window.location.hash));

  useEffect(() => {
    const onHash = () => setRoute(routeForHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - fixed width */}
      <Sidebar />
      
      {/* Main Content Area - fluid width */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {route.name === "restaurants" ? (
              <Restaurants />
            ) : route.name === "categories" ? (
              <Categories />
            ) : route.name === "reviews" ? (
              <Reviews />
            ) : route.name === "review-violations" ? (
              <ReviewViolations />
            ) : route.name === "reviews-deleted" ? (
              <ReviewsDeleted />
            ) : route.name === "users" ? (
              <Users />
            ) : (
              <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-700">Chào mừng trở lại!</h2>
                <p className="text-slate-500 mt-2">Chọn một mục từ menu bên trái để bắt đầu quản lý.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
