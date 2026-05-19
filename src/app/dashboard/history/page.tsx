"use client";

import { useState, useEffect } from "react";
import { Image as ImageIcon, Trash2, ChevronLeft, ChevronRight, Loader2, Search, Download } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";

interface HistoryItem {
  id: string;
  prompt: string;
  model: string;
  imageUrl: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const limit = 12;

  const fetchHistory = async (p: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/history?page=${p}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
      setPage(p);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        setTotal((prev) => prev - 1);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `pixelmill-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalPages = Math.ceil(total / limit);
  const filteredItems = searchQuery
    ? items.filter((item) => item.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">生成历史</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 条记录</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索提示词..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">暂无生成记录</p>
          <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm mt-2 inline-block">
            开始创作 →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-100 relative group">
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDownload(item.imageUrl, item.prompt)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                      title="下载"
                    >
                      <Download className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 bg-white rounded-full hover:bg-red-50 transition-colors"
                      title="删除"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-red-500" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm text-gray-800 line-clamp-2 mb-1">{item.prompt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{item.model}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchHistory(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => fetchHistory(page + 1)}
                disabled={!hasMore}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
