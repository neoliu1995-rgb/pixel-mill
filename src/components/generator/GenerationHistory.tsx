"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { History, Trash2, Image as ImageIcon, Clock } from "lucide-react";
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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch {
        setHistory([]);
      }
    }
  }, []);

  const addToHistory = (item: Omit<HistoryItem, "id" | "timestamp">) => {
    const newItem: HistoryItem = {
      ...item,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const updatedHistory = [newItem, ...history].slice(0, 20); // Keep last 20 items
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
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
  }, [history]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
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
            {history.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t.history.empty || "No generation history"}</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelect(item);
                      setIsOpen(false);
                    }}
                    className="flex gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0">
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
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
