import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        description: "",
        subjectType: "unknown",
        keyFeatures: [],
        warning: "Gemini API not configured",
      });
    }

    const match = image.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json(
        { error: "Failed to parse image data" },
        { status: 400 }
      );
    }

    const [, mimeType, base64Data] = match;

    const body = {
      contents: [{
        parts: [
          {
            text: `You are analyzing an image for AI transformation. Provide a detailed analysis in this EXACT JSON format (no markdown, no code blocks):
{
  "subjectType": "person|animal|object|scene|food|landscape|other",
  "subjectDescription": "Detailed description of the main subject",
  "appearance": "Physical appearance details (for person: gender, age range, hair color/style, facial features, clothing, accessories; for object: type, color, material, size)",
  "poseAndComposition": "Body pose, angle, position in frame, background elements",
  "colors": "Dominant colors and color palette",
  "style": "Photographic style, lighting mood, overall aesthetic"
}

CRITICAL INSTRUCTIONS:
- For a PERSON: Describe facial structure, eye shape, nose, lips, hairstyle, clothing style and colors, any distinctive features (glasses, jewelry, etc.), body posture, expression
- Keep descriptions factual and objective
- Focus on features that MUST be preserved in the transformed image
- Output ONLY the JSON, nothing else`
          },
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Data,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error("Image analysis failed:", res.status);
      return NextResponse.json({
        description: "",
        subjectType: "unknown",
        keyFeatures: [],
        warning: "Analysis failed",
      });
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return NextResponse.json({
        description: "",
        subjectType: "unknown",
        keyFeatures: [],
        warning: "No description generated",
      });
    }

    let parsed;
    try {
      const cleanText = rawText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(cleanText);
    } catch {
      return NextResponse.json({
        description: rawText.trim(),
        subjectType: "unknown",
        keyFeatures: [],
      });
    }

    const description = [
      `Subject: ${parsed.subjectType} - ${parsed.subjectDescription}`,
      `Appearance: ${parsed.appearance || ""}`,
      `Pose: ${parsed.poseAndComposition || ""}`,
      `Colors: ${parsed.colors || ""}`,
      `Style: ${parsed.style || ""}`,
    ].filter(Boolean).join(". ");

    return NextResponse.json({
      description,
      subjectType: parsed.subjectType || "unknown",
      keyFeatures: [parsed.appearance, parsed.poseAndComposition, parsed.colors].filter(Boolean),
      raw: parsed,
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { description: "", error: "Analysis failed" },
      { status: 500 }
    );
  }
}
