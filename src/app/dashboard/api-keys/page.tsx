"use client";

import { useState, useEffect } from "react";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  X,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
}

interface NewKeyResponse {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
  createdAt: string;
}

export default function ApiKeysPage() {
  const { t } = useLanguage();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<NewKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    fetchKeys();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t.dashboard.apiKeys.pleaseLogin);
        setLoading(false);
        return;
      }

      const profileRes = await fetch("/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setUserPlan(profileData.user.plan);
      }

      const response = await fetch("/api/keys", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 403) {
        setError(t.dashboard.apiKeys.proRequired);
        setKeys([]);
        setLoading(false);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys || []);
        setError(null);
      } else {
        setError(t.dashboard.apiKeys.failedFetch);
      }
    } catch (err) {
      setError(t.dashboard.apiKeys.failedFetch);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewlyCreatedKey(data.key);
        setNewKeyName("");
        fetchKeys();
      } else {
        const data = await response.json();
        setError(data.error || t.dashboard.apiKeys.failedCreate);
      }
    } catch (err) {
      setError(t.dashboard.apiKeys.failedCreate);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setKeys(keys.filter((k) => k.id !== id));
        setDeleteConfirmId(null);
      } else {
        setError(t.dashboard.apiKeys.failedDelete);
      }
    } catch (err) {
      setError(t.dashboard.apiKeys.failedDelete);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = key;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error && userPlan === "free") {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 text-center">
          <Shield className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {t.dashboard.apiKeys.proRequired}
          </h2>
          <p className="text-gray-500 mb-6">{t.dashboard.apiKeys.proRequiredDesc}</p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
          >
            {t.dashboard.apiKeys.upgradeNow}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.apiKeys.title}</h1>
        <p className="text-gray-500 mt-2">{t.dashboard.apiKeys.subtitle}</p>
      </div>

      {error && userPlan !== "free" && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={() => { setError(null); fetchKeys(); }}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            {t.dashboard.apiKeys.retry}
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.apiKeys.createNew}</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={t.dashboard.apiKeys.namePlaceholder}
            maxLength={50}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateKey();
            }}
          />
          <button
            onClick={handleCreateKey}
            disabled={!newKeyName.trim() || isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {t.dashboard.apiKeys.create}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">{t.dashboard.apiKeys.maxKeys}</p>
      </div>

      {newlyCreatedKey && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">{t.dashboard.apiKeys.createdSuccess}</h3>
              <p className="text-sm text-green-700">{newlyCreatedKey.name}</p>
            </div>
          </div>

          <div className="bg-white border border-green-300 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between gap-2">
              <code className="text-sm font-mono break-all text-gray-800 select-all">
                {newlyCreatedKey.key}
              </code>
              <button
                onClick={() => handleCopyKey(newlyCreatedKey.key)}
                className="flex-shrink-0 p-2 text-gray-500 hover:text-purple-600 transition-colors"
                title={t.dashboard.apiKeys.copy}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">{t.dashboard.apiKeys.warningMessage}</p>
          </div>

          <button
            onClick={() => setNewlyCreatedKey(null)}
            className="mt-3 text-sm text-gray-500 hover:text-gray-700"
          >
            {t.dashboard.apiKeys.dismiss}
          </button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t.dashboard.apiKeys.existingKeys}</h2>

        {keys.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Key className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t.dashboard.apiKeys.noKeys}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Key className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{apiKey.name}</p>
                    <p className="text-sm text-gray-500">
                      <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs">
                        {apiKey.keyPrefix}...
                      </code>
                      <span className="ml-2">
                        {new Date(apiKey.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteConfirmId(apiKey.id)}
                  className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  title={t.dashboard.apiKeys.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">{t.dashboard.apiKeys.usageTitle}</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>{t.dashboard.apiKeys.usageHeader}</p>
          <code className="block bg-white border border-blue-200 rounded-lg p-3 text-xs">
            {`x-api-key: pm_sk_your_api_key_here`}
          </code>
          <p className="mt-2">{t.dashboard.apiKeys.usageBearer}</p>
          <code className="block bg-white border border-blue-200 rounded-lg p-3 text-xs">
            {`Authorization: Bearer pm_sk_your_api_key_here`}
          </code>
        </div>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{t.dashboard.apiKeys.confirmDelete}</h3>
                <p className="text-gray-500 text-sm">{t.dashboard.apiKeys.confirmDeleteDesc}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4 inline mr-2" />
                {t.dashboard.apiKeys.cancelAction}
              </button>
              <button
                onClick={() => handleDeleteKey(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 inline mr-2" />
                )}
                {t.dashboard.apiKeys.confirmAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
