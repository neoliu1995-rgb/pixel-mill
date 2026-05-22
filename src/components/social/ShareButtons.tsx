"use client";

import { useState } from "react";
import { Twitter, Link2, Copy } from "lucide-react";

interface ShareButtonsProps {
  url: string;
  title: string;
  imageUrl?: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;

  return (
    <div className="relative flex items-center gap-1.5">
      <a
        href={twitterIntentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
      >
        <Twitter className="h-3.5 w-3.5" />
        <span>X</span>
      </a>

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2.5 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
      >
        <Link2 className="h-3.5 w-3.5" />
        <span>Copy Link</span>
      </button>

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"
      >
        <Copy className="h-3.5 w-3.5" />
        <span>WeChat</span>
      </button>

      {copied && (
        <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded bg-violet-600 px-2 py-0.5 text-xs text-white shadow-md animate-pulse">
          Copied!
        </span>
      )}
    </div>
  );
}
