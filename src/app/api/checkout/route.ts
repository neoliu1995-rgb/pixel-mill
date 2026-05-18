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

    const { plan, customerId, billingPeriod } = await request.json();

    // Determine price based on plan and billing period
    let priceId: string;
    if (plan === "business") {
      priceId = billingPeriod === "yearly" ? PRICES.businessYearly : PRICES.businessMonthly;
    } else {
      priceId = billingPeriod === "yearly" ? PRICES.proYearly : PRICES.proMonthly;
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
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      customer: customerId || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}