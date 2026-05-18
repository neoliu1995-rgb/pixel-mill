import { NextResponse } from "next/server";
import { stripe, PRICES } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment service not available" },
        { status: 503 }
      );
    }

    const { plan, subscriptionId, customerId } = await request.json();

    if (!plan || (!subscriptionId && !customerId)) {
      return NextResponse.json(
        { error: "Plan and subscription ID or customer ID are required" },
        { status: 400 }
      );
    }

    const priceId = plan === "yearly" ? PRICES.proYearly : PRICES.proMonthly;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        items: [
          {
            id: subscriptionId,
            price: priceId,
          },
        ],
        proration_behavior: "create_prorations",
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription`,
      customer: customerId,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error switching subscription:", error);
    return NextResponse.json(
      { error: "Failed to switch subscription" },
      { status: 500 }
    );
  }
}