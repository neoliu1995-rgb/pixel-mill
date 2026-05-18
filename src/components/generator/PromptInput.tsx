"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function PromptInput({ value, onChange, disabled, placeholder }: PromptInputProps) {
  const [charCount, setCharCount] = useState(value.length);
  const maxChars = 1000;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      onChange(text);
      setCharCount(text.length);
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder || "Describe the image you want to create..."}
        className={cn(
          "w-full min-h-[120px] p-4 text-base border border-gray-200 rounded-xl resize-none",
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
          "placeholder:text-gray-400 transition-all",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50"
        )}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <span className={cn(
          "text-xs",
          charCount > maxChars * 0.9 ? "text-red-500" : "text-gray-400"
        )}>
          {charCount}/{maxChars}
        </span>
      </div>
    </div>
  );
}
