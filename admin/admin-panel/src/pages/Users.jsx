import React, { useState, useEffect } from "react";

const UserRow = ({ user, onBan, onUnban }) => {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-4">
        <img
          src={user.avatar || "/default-avatar.png"}
          alt={user.name}
          className="w-16 h-16 rounded object-cover"
        />
      </td>
      <td className="p-4">
        <div className="font-semibold text-lg">{user.name}</div>
        <div className="text-sm text-gray-600">{user.email}</div>
      </td>
      <td className="p-4">
        <span className="uppercase font-semibold">{user.role}</span>
      </td>
      <td className="p-4">
        {user.status === "active" ? (
          <span className="px-4 py-1 rounded-full bg-emerald-200 text-emerald-800 text-sm font-semibold">
            ACTIVE
          </span>
        ) : (
          <span className="px-4 py-1 rounded-full bg-gray-300 text-gray-700 text-sm font-semibold">
            BANNED
          </span>
        )}
      </td>
      <td className="p-4">
        {user.status === "active" ? (
          <button
            onClick={() => onBan(user)}
            className="px-6 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 font-semibold"
          >
            Ban
          </button>
        ) : (
          <button
            onClick={() => onUnban(user)}
            className="px-6 py-2 bg-yellow-400 text-gray-900 rounded hover:bg-yellow-500 font-semibold"
          >
            Unban
          </button>
        )}
      </td>
    </tr>
  );
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/users");
      if (!res.ok) throw new Error("Lỗi khi tải người dùng");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBan(user) {
    if (!confirm(`Ban người dùng "${user.name}"?`)) return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/users/${user.id}/ban`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error("Lỗi khi ban người dùng");
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      console.error("Ban error:", err);
      alert(err.message);
    }
  }

  async function handleUnban(user) {
    try {
      const res = await fetch(
        `http://localhost:4000/api/users/${user.id}/unban`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error("Lỗi khi unban người dùng");
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      console.error("Unban error:", err);
      alert(err.message);
    }
  }

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  const renderPagination = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }

    return pages.map((page) => (
      <button
        key={page}
        onClick={() => setCurrentPage(page)}
        className={`px-3 py-1 rounded ${
          page === currentPage
            ? "bg-sky-500 text-white"
            : "bg-white border hover:bg-gray-100"
        }`}
      >
        {page}
      </button>
    ));
  };

  return (
    <div>
      <div className="px-6 py-4 border-b bg-sky-200 text-slate-800 flex items-center gap-2">
        <span>Quản lý người dùng</span>
        <span>&nbsp;&gt;&nbsp;</span>
        <span>Xem thông tin</span>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải...</div>
        ) : (
          <>
            <div className="bg-white rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-sky-100">
                  <tr>
                    <th className="p-4 text-left font-semibold">Avatar</th>
                    <th className="p-4 text-left font-semibold">Thông tin</th>
                    <th className="p-4 text-left font-semibold">Role</th>
                    <th className="p-4 text-left font-semibold">Trạng thái</th>
                    <th className="p-4 text-left font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">
                        Không có người dùng nào
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user) => (
                      <UserRow
                        key={user.id}
                        user={user}
                        onBan={handleBan}
                        onUnban={handleUnban}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {users.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border rounded"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm">items</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    ‹
                  </button>
                  {renderPagination()}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
                  >
                    ›
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  {startIndex + 1} - {Math.min(endIndex, users.length)} of{" "}
                  {users.length} items
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
