import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { logger } from "@/lib/logger";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("JWT_SECRET is not configured");
      }

      const token = jwt.sign(
        { userId: user.id, purpose: "reset" },
        secret,
        { expiresIn: "1h" }
      );

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pixelmill.xyz";
      const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

      await sendPasswordResetEmail(email, resetUrl);
    }

    return NextResponse.json({
      success: true,
      message: "If an account with that email exists, we've sent a reset link.",
    });
  } catch (error) {
    logger.error("Forgot password error", { error });
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
