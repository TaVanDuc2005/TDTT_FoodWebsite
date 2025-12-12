import React from "react";
import { Bell, Search, Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md">
           <Menu size={20} />
        </button>
        {/* Breadcrumb or Title placeholder */}
        <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
           Dashboard
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar - hidden on small screens */}
        <div className="hidden md:flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <Search size={16} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="ml-2 bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder-gray-400"
          />
        </div>

        <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 mx-1"></div>

        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                TS
            </div>
        </div>
      </div>
    </header>
  );
}
