import React, { useState } from "react";
import { 
  Store, 
  List, 
  MessageSquare, 
  AlertTriangle, 
  Trash2, 
  Users, 
  ChevronDown, 
  ChevronRight,
  LayoutDashboard
} from "lucide-react";

function SidebarItem({ href, icon: Icon, label, active }) {
  const isHashMatch = (href) => {
    if (href === "#/" && (!window.location.hash || window.location.hash === "#/")) return true;
    return window.location.hash.startsWith(href);
  };
  
  const isActive = active || isHashMatch(href);

  return (
    <a
      href={href}
      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? "bg-slate-800 text-white"
          : "text-slate-400 hover:text-white hover:bg-slate-800/50"
      }`}
    >
      <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-white"}`} aria-hidden="true" />
      {label}
    </a>
  );
}

function Section({ title, children }) {
  return (
    <div className="pt-6">
      <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="mt-2 space-y-1">
        {children}
      </div>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 min-h-screen border-r border-slate-800">
      <div className="h-16 flex items-center px-6 bg-slate-900 border-b border-slate-800">
         {/* Logo area */}
         <div className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                <Store size={18} />
            </div>
            <span>FoodAdmin</span>
         </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Dashboard / Overview if we had one, for now linking Home */}
        <SidebarItem href="#/" icon={LayoutDashboard} label="Tổng quan" />

        <Section title="Nhà Hàng">
          <SidebarItem href="#/restaurants" icon={Store} label="Tất cả nhà hàng" />
          <SidebarItem href="#/categories" icon={List} label="Danh mục món ăn" />
        </Section>

        <Section title="Đánh Giá">
          <SidebarItem href="#/reviews" icon={MessageSquare} label="Tất cả đánh giá" />
          <SidebarItem href="#/reviews/violations" icon={AlertTriangle} label="Báo cáo vi phạm" />
          <SidebarItem href="#/reviews/deleted" icon={Trash2} label="Đã xóa" />
        </Section>

        <Section title="Hệ Thống">
          <SidebarItem href="#/users" icon={Users} label="Người dùng" />
        </Section>
      </nav>
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white font-medium">
                AD
             </div>
             <div className="text-sm">
                <p className="text-white font-medium">Admin User</p>
                <p className="text-slate-500 text-xs">admin@example.com</p>
             </div>
        </div>
      </div>
    </aside>
  );
}
