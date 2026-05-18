import { NextResponse } from "next/server";
import { stripe, PRICES } from "@/lib/stripe";

export async function GET(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json({ subscription: null }, { status: 200 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json({ subscription: null }, { status: 200 });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ subscription: null }, { status: 200 });
    }

    const subscription = subscriptions.data[0] as any;
    const price = subscription.items.data[0]?.price as any;

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10,
    });

    const invoiceItems = invoices.data.map((invoice: any) => ({
      id: invoice.id,
      amount: invoice.total / 100,
      status: invoice.status,
      date: invoice.created * 1000,
      pdfUrl: invoice.invoice_pdf,
    }));

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan: [PRICES.proYearly, PRICES.businessYearly].includes(subscription.items.data[0]?.price.id || "") ? "yearly" : "monthly",
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end * 1000,
        price: price?.unit_amount ? price.unit_amount / 100 : 0,
        interval: price?.recurring?.interval,
        invoices: invoiceItems,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}