"use client";

import { useState } from "react";
import GalleryCard from "./GalleryCard";

const GALLERY_ITEMS = [
  { prompt: "A majestic dragon flying over a mystical mountain range at sunset", seed: 101, category: "Fantasy" },
  { prompt: "A cozy coffee shop interior with warm lighting and vintage decor", seed: 102, category: "Architecture" },
  { prompt: "Futuristic cityscape with flying cars and neon lights at night", seed: 103, category: "Sci-Fi" },
  { prompt: "A serene Japanese garden with cherry blossoms and a koi pond", seed: 104, category: "Nature" },
  { prompt: "An astronaut floating in space with Earth in the background", seed: 105, category: "Sci-Fi" },
  { prompt: "A magical forest with glowing mushrooms and fireflies", seed: 106, category: "Fantasy" },
  { prompt: "Luxury sports car on a winding mountain road at golden hour", seed: 107, category: "Product" },
  { prompt: "A cozy cabin in the snowy mountains with smoke from chimney", seed: 108, category: "Architecture" },
  { prompt: "An underwater scene with coral reef and colorful tropical fish", seed: 109, category: "Nature" },
  { prompt: "A steampunk inventor's workshop with gears and brass instruments", seed: 110, category: "Fantasy" },
  { prompt: "A beautiful sunset over the ocean with palm trees on beach", seed: 111, category: "Nature" },
  { prompt: "Modern minimalist living room with large windows and natural light", seed: 112, category: "Architecture" },
];

const CATEGORIES = ["All", "Fantasy", "Nature", "Architecture", "Sci-Fi", "Product"];

interface InspirationGalleryProps {
  onTryPrompt: (prompt: string) => void;
}

export default function InspirationGallery({ onTryPrompt }: InspirationGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredItems = selectedCategory === "All"
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(item => item.category === selectedCategory);

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? "bg-purple-600 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item, index) => (
          <GalleryCard
            key={`${item.seed}-${index}`}
            prompt={item.prompt}
            seed={item.seed}
            category={item.category}
            onTryPrompt={onTryPrompt}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No items in this category yet.</p>
        </div>
      )}
    </div>
  );
}
