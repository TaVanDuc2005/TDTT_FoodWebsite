import React, { useState, useEffect } from "react";

const ReviewCard = ({ review, onRestore, onDelete }) => {
  return (
    <div className="border-2 border-gray-300 rounded p-6 mb-4 bg-gray-100">
      <h3 className="font-bold text-lg mb-3">{review.title}</h3>
      <div className="mb-3">
        <span className="text-yellow-400 text-xl">★</span>
        <span className="ml-2 text-sm">{review.content}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <span className="text-blue-500">👤</span>
          <span>{review.userName || "Anonymous"}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-red-500">📅</span>
          <span>{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => onRestore(review)}
          className="px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2 hover:bg-green-600"
        >
          <span>✓</span> Khôi phục
        </button>
        <button
          onClick={() => onDelete(review)}
          className="px-4 py-2 bg-red-500 text-white rounded flex items-center gap-2 hover:bg-red-600"
        >
          <span>🗑</span> Xóa vĩnh viễn
        </button>
      </div>
    </div>
  );
};

export default function ReviewsDeleted() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchDeleted();
  }, []);

  async function fetchDeleted() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/reviews/deleted");
      if (!res.ok) throw new Error("Lỗi khi tải đánh giá đã xóa");
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      console.error("Failed to load deleted reviews:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(review) {
    try {
      const res = await fetch(
        `http://localhost:4000/api/reviews/${review.id}/restore`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error("Lỗi khi khôi phục đánh giá");
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      console.error("Restore error:", err);
      alert(err.message);
    }
  }

  async function handleDelete(review) {
    if (
      !confirm(
        `Xóa vĩnh viễn đánh giá "${review.title}"? Hành động này không thể hoàn tác!`
      )
    )
      return;
    try {
      const res = await fetch(
        `http://localhost:4000/api/reviews/${review.id}`,
        {
          method: "DELETE",
        }
      );
      if (!res.ok) throw new Error("Lỗi khi xóa vĩnh viễn đánh giá");
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.message);
    }
  }

  const totalPages = Math.ceil(reviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

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
      <div className="px-6 py-4 border-b bg-sky-200 text-slate-800">
        Quản lý đánh giá &nbsp; &gt; &nbsp; Đánh giá đã xóa
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-500">Đang tải...</div>
        ) : currentReviews.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            Không có đánh giá đã xóa nào
          </div>
        ) : (
          <>
            {currentReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))}

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
                {startIndex + 1} - {Math.min(endIndex, reviews.length)} of{" "}
                {reviews.length} items
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
