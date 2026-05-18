"use client";

import { useState } from "react";
import { ExternalLink, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/LanguageProvider";

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  content: string;
  rating: number;
  company?: string;
}

interface PressItem {
  name: string;
  logo: string;
  quote?: string;
}

export default function SocialProof() {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  const TESTIMONIALS: Testimonial[] = [
    {
      name: t.socialProof.testimonialsData?.[0]?.name || "Sarah Chen",
      role: t.socialProof.testimonialsData?.[0]?.role || "Digital Artist",
      avatar: "👩‍🎨",
      content: t.socialProof.testimonialsData?.[0]?.content || "PixelMill has completely transformed my creative workflow. What used to take minutes now takes seconds! The quality is excellent.",
      rating: 5,
      company: "Dribbble",
    },
    {
      name: t.socialProof.testimonialsData?.[1]?.name || "Michael Park",
      role: t.socialProof.testimonialsData?.[1]?.role || "Product Designer",
      avatar: "👨‍💼",
      content: t.socialProof.testimonialsData?.[1]?.content || "As a product designer, I need to quickly generate UI prototypes and concept art. PixelMill saves me at least 2 hours every day.",
      rating: 5,
      company: "Figma",
    },
    {
      name: t.socialProof.testimonialsData?.[2]?.name || "Emily Rodriguez",
      role: t.socialProof.testimonialsData?.[2]?.role || "Marketing Director",
      avatar: "👩‍💼",
      content: t.socialProof.testimonialsData?.[2]?.content || "Our team uses PixelMill for social media content creation. Easy to use, professional results, and great value!",
      rating: 5,
      company: "Marketing Agency",
    },
    {
      name: t.socialProof.testimonialsData?.[3]?.name || "Alex Kim",
      role: t.socialProof.testimonialsData?.[3]?.role || "Indie Game Developer",
      avatar: "🧑‍💻",
      content: t.socialProof.testimonialsData?.[3]?.content || "Game art resources are expensive, but PixelMill allows me to create beautiful game assets on my own. Highly recommended!",
      rating: 5,
      company: "Indie Dev",
    },
    {
      name: t.socialProof.testimonialsData?.[4]?.name || "Lisa Wang",
      role: t.socialProof.testimonialsData?.[4]?.role || "E-commerce Manager",
      avatar: "👩‍🛒",
      content: t.socialProof.testimonialsData?.[4]?.content || "Removing backgrounds from product images and adding creative backgrounds - PixelMill does it all! No more spending hundreds on photo editing.",
      rating: 5,
      company: "E-commerce",
    },
    {
      name: t.socialProof.testimonialsData?.[5]?.name || "David Chen",
      role: t.socialProof.testimonialsData?.[5]?.role || "Content Creator",
      avatar: "👨‍🎬",
      content: t.socialProof.testimonialsData?.[5]?.content || "Creating YouTube content requires lots of visuals, and PixelMill helps me handle all the materials easily. Viewers say my video quality keeps improving!",
      rating: 5,
      company: "YouTube Creator",
    },
  ];

  const PRESS_ITEMS: PressItem[] = [
    { name: "TechCrunch", logo: "📰" },
    { name: "Product Hunt", logo: "🚀" },
    { name: "The Verge", logo: "📱" },
    { name: "Wired", logo: "🔌" },
  ];

  const STATS = [
    { value: "100K+", key: "activeUsers" },
    { value: "1M+", key: "generatedImages" },
    { value: "4.9", key: "userRating" },
    { value: "50+", key: "countries" },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const visibleTestimonials = TESTIMONIALS.slice(currentIndex, currentIndex + 3);
  if (visibleTestimonials.length < 3) {
    const remaining = TESTIMONIALS.slice(0, 3 - visibleTestimonials.length);
    visibleTestimonials.push(...remaining);
  }

  return (
    <div className="space-y-12">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <div key={i} className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
            <div className="text-3xl font-bold text-purple-600 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{t.socialProof[stat.key as keyof typeof t.socialProof]}</div>
          </div>
        ))}
      </div>

      {/* Press */}
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">{t.socialProof.trusted}</p>
        <div className="flex flex-wrap justify-center items-center gap-8">
          {PRESS_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">{item.logo}</span>
              <span className="font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Carousel */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{t.socialProof.testimonials}</h3>
          <div className="flex gap-2">
            <button
              onClick={prevSlide}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="p-2 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex gap-6 transition-transform duration-300">
            {TESTIMONIALS.map((testimonial, i) => (
              <div
                key={i}
                className={cn(
                  "flex-shrink-0 w-[calc(33.333%-16px)] bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg hover:border-purple-200 transition-all",
                  i >= currentIndex && i < currentIndex + 3 ? "block" : "hidden"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(testimonial.rating)].map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                    {testimonial.company && (
                      <p className="text-xs text-purple-600 mt-1">{testimonial.company}</p>
                    )}
                  </div>
                </div>
                <p className="mt-4 text-gray-600 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                i === currentIndex ? "bg-purple-600 w-6" : "bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}