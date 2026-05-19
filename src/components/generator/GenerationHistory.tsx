"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { History, Trash2, Image as ImageIcon, Clock, Loader2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
  model: string;
}

const STORAGE_KEY = "pixelmill_generation_history";

export default function GenerationHistory({
  onSelect,
}: {
  onSelect: (item: HistoryItem) => void;
}) {
  const { t } = useLanguage();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/history?limit=1");
      if (res.status === 401) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(res.ok);
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  const fetchServerHistory = useCallback(async (pageNum: number, append: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/history?page=${pageNum}&limit=10`);
      if (!res.ok) {
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      const items: HistoryItem[] = data.items.map((item: { id: string; prompt: string; model: string; imageUrl: string; createdAt: string }) => ({
        id: item.id,
        prompt: item.prompt,
        model: item.model,
        imageUrl: item.imageUrl,
        timestamp: new Date(item.createdAt).getTime(),
      }));
      if (append) {
        setHistory((prev) => [...prev, ...items]);
      } else {
        setHistory(items);
      }
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch {
      if (!append) {
        setHistory([]);
      }
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLocalStorage = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchServerHistory(1);
    } else {
      loadLocalStorage();
    }
  }, [isLoggedIn, fetchServerHistory, loadLocalStorage]);

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchServerHistory(1);
    }
  }, [isOpen, isLoggedIn, fetchServerHistory]);

  const addToHistory = async (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    if (isLoggedIn) {
      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: item.prompt,
            model: item.model,
            imageUrl: item.imageUrl,
          }),
        });
        if (res.ok) {
          const saved = await res.json();
          const savedItem: HistoryItem = {
            id: saved.id,
            prompt: saved.prompt,
            model: saved.model,
            imageUrl: saved.imageUrl,
            timestamp: new Date(saved.createdAt).getTime(),
          };
          setHistory((prev) => [savedItem, ...prev]);
          return;
        }
      } catch {
        // fallback to local
      }
    }

    const updatedHistory = [newItem, ...history].slice(0, 20);
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const deleteItem = async (id: string) => {
    setIsDeleting(true);
    try {
      if (isLoggedIn) {
        const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
        if (!res.ok) {
          return;
        }
      }
      setHistory((prev) => {
        const updated = prev.filter((item) => item.id !== id);
        if (!isLoggedIn) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    if (!isLoggedIn) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchServerHistory(page + 1, true);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    (window as unknown as Record<string, unknown>).addToGenerationHistory = addToHistory;
    return () => {
      delete (window as unknown as Record<string, unknown>).addToGenerationHistory;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, isLoggedIn]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors min-h-[44px]"
      >
        <History className="w-5 h-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{t.history}</span>
        {history.length > 0 && (
          <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
            {history.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700">生成历史</h3>
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                {t.history.clear || "Clear"}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading && history.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p className="text-sm">加载中...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t.history.empty || "No generation history"}</p>
              </div>
            ) : (
              <div className="p-2 space-y-1.5">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                  >
                    <div
                      onClick={() => {
                        onSelect(item);
                        setIsOpen(false);
                      }}
                      className="flex gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex-shrink-0">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">
                          {item.prompt}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-purple-500">
                            {item.model}
                          </span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-0">
                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteItem(item.id);
                            }}
                            disabled={isDeleting}
                            className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 min-h-[32px]"
                          >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "确认"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 min-h-[32px]"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(item.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoggedIn && hasMore && (
                  <div className="pt-2 pb-1 text-center">
                    <button
                      onClick={loadMore}
                      disabled={isLoading}
                      className="text-xs text-purple-500 hover:text-purple-600 disabled:opacity-50 flex items-center gap-1 mx-auto"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          加载中...
                        </>
                      ) : (
                        "加载更多"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
