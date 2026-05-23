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
        warning: "Gemini API not configured, using generic prompt",
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
            text: `Describe this image in detail in English. Focus on:
1. Main subject(s) - what is the primary object/person/scene?
2. Key visual elements - colors, shapes, textures, materials
3. Composition and layout
4. Style and mood
5. Any text or notable features

Be concise but comprehensive (2-4 sentences maximum). This description will be used for AI image transformation, so focus on the visual characteristics that should be preserved or transformed.`
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
        temperature: 0.2,
        maxOutputTokens: 300,
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Image analysis failed:", res.status, errText);
      return NextResponse.json({
        description: "",
        warning: "Analysis failed, using generic prompt",
      });
    }

    const data = await res.json();
    const description = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!description) {
      return NextResponse.json({
        description: "",
        warning: "No description generated",
      });
    }

    return NextResponse.json({ description: description.trim() });
  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { description: "", error: "Analysis failed" },
      { status: 500 }
    );
  }
}
