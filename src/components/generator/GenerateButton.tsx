"use client";

import { cn } from "@/lib/utils";

interface GenerateButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  text?: string;
  progress?: number;
}

export default function GenerateButton({ onClick, disabled, isLoading, text, progress = 0 }: GenerateButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(
        "w-full py-4 px-6 text-lg font-semibold rounded-xl transition-all",
        "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700",
        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2 relative overflow-hidden",
        isLoading && "animate-pulse"
      )}
    >
      {isLoading && progress > 0 && (
        <div 
          className="absolute inset-0 bg-white/20 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}
      
      <span className={cn("relative z-10", isLoading && "flex items-center gap-2")}>
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {text || "Generating..."}
          </>
        ) : (
          text || "Generate - FREE"
        )}
      </span>
    </button>
  );
}
