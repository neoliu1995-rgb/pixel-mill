import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function GET() {
  try {
    const startTime = Date.now();
    
    const testUrl = "https://image.pollinations.ai/prompt/a%20cute%20cat?width=256&height=256&nologo=true&model=flux-schnell";
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Pollinations HTTP error: ${response.status}`,
        status: response.status,
      }, { status: 500 });
    }
    
    const blob = await response.blob();
    const latency = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: "Pollinations API is working!",
      imageSize: blob.size,
      imageType: blob.type,
      latencyMs: latency,
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
