import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://pixelmill.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "/", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/gallery", changeFrequency: "daily" as const, priority: 0.8 },
    { path: "/effects", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/effects/chibi", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/effects/caricature", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/effects/retro-film", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/effects/time-travel", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/effects/pet-human", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/background-remover", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/copywriting", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/ecommerce", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/ecommerce/white-background", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/ecommerce/poster", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/ecommerce/detail-page", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/privacy", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
