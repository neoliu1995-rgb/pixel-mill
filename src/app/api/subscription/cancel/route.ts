import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment service not available" },
        { status: 503 }
      );
    }

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    const sub = subscription as unknown as Stripe.Subscription & {
      current_period_end: number;
    };

    return NextResponse.json({
      success: true,
      message: "Subscription will be canceled at the end of the current period",
      subscription: {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end ? sub.current_period_end * 1000 : Date.now(),
      },
    });
  } catch (error) {
    logger.error("Error canceling subscription:", { error });
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}