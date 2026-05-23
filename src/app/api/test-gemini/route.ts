import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  const results = { steps: [] as string[] };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    results.steps.push(`API Key: ${apiKey ? "SET (" + apiKey.substring(0, 10) + "...)" : "NOT SET"}`);

    const testImageB64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    const body = {
      contents: [{
        parts: [
          { text: "Generate a simple red circle on white background" },
          { inlineData: { mimeType: "image/png", data: testImageB64 } },
        ],
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`;

    results.steps.push("Calling Gemini API...");
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    results.steps.push(`Response status: ${res.status}`);
    const text = await res.text();
    results.steps.push(`Response body (first 500 chars): ${text.substring(0, 500)}`);

    if (!res.ok) {
      return NextResponse.json({ success: false, ...results });
    }

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    results.steps.push(`Exception: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json({ success: false, ...results }, { status: 500 });
  }
}
