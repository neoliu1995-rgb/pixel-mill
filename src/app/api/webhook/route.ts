import { NextResponse } from "next/server";
import { stripe, mapPriceToPlan, PLANS, CNY_PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendPaymentConfirmationEmail } from "@/lib/email";
import Stripe from "stripe";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: "Payment service not available" },
        { status: 503 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
    let event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logger.error("Webhook signature verification failed:", { error: err });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session, stripe);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription, stripe);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Webhook error:", { error });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session, stripeClient: Stripe) {
  const userId = session.metadata?.userId;
  const planFromMetadata = session.metadata?.plan || "pro";
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;

  let userIdToUse = userId;

  if (!userIdToUse && stripeCustomerId) {
    const customer = await stripeClient.customers.retrieve(stripeCustomerId) as Stripe.Customer;
    if (customer.email) {
      const user = await prisma.user.findUnique({ where: { email: customer.email } });
      if (user) {
        userIdToUse = user.id;
      }
    }
  }

  if (!userIdToUse) {
    logger.error("No userId found for checkout session:", { sessionId: session.id });
    return;
  }

  let plan = planFromMetadata;
  let currentPeriodEnd: Date | null = null;

  if (stripeSubscriptionId) {
    const subscription = await stripeClient.subscriptions.retrieve(stripeSubscriptionId);
    const priceId = subscription.items.data[0]?.price.id;
    if (priceId) {
      const mapping = mapPriceToPlan(priceId);
      if (mapping) {
        plan = mapping.plan;
      }
    }
    const periodEnd = subscription.items.data[0]?.current_period_end;
    currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;
  }

  await prisma.subscription.upsert({
    where: { userId: userIdToUse },
    update: {
      plan,
      status: "active",
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodEnd,
    },
    create: {
      userId: userIdToUse,
      plan,
      status: "active",
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodEnd,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userIdToUse } });
  if (user?.email) {
    let billingPeriod = "monthly";
    if (stripeSubscriptionId) {
      const sub = await stripeClient.subscriptions.retrieve(stripeSubscriptionId);
      const priceId = sub.items.data[0]?.price.id;
      if (priceId) {
        const mapping = mapPriceToPlan(priceId);
        if (mapping) {
          billingPeriod = mapping.billingPeriod;
        }
      }
    }
    const planConfig = PLANS[plan as keyof typeof PLANS] || CNY_PLANS[plan as keyof typeof CNY_PLANS];
    const amount = billingPeriod === "yearly"
      ? (planConfig?.yearlyPrice ?? 0)
      : (planConfig?.monthlyPrice ?? 0);
    const currency = session.currency === "cny" ? "CNY" : "USD";
    const nextBillingDate = currentPeriodEnd
      ? currentPeriodEnd.toLocaleDateString("zh-CN")
      : "";

    sendPaymentConfirmationEmail(user.email, {
      planName: plan,
      billingPeriod,
      amount,
      currency,
      nextBillingDate,
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, stripeClient: Stripe) {
  const stripeSubscriptionId = subscription.id;
  const stripeCustomerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;

  let plan = "pro";
  if (priceId) {
    const mapping = mapPriceToPlan(priceId);
    if (mapping) {
      plan = mapping.plan;
    }
  }

  const status = subscription.status === "active" ? "active" : subscription.status;
  const periodEnd = subscription.items.data[0]?.current_period_end;
  const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        plan,
        status,
        stripeCustomerId,
        currentPeriodEnd,
      },
    });

    if (status === "active") {
      const user = await prisma.user.findUnique({ where: { id: existing.userId } });
      if (user?.email) {
        const planConfig = PLANS[plan as keyof typeof PLANS] || CNY_PLANS[plan as keyof typeof CNY_PLANS];
        const billingPeriod = priceId ? (mapPriceToPlan(priceId)?.billingPeriod ?? "monthly") : "monthly";
        const amount = billingPeriod === "yearly"
          ? (planConfig?.yearlyPrice ?? 0)
          : (planConfig?.monthlyPrice ?? 0);
        const nextBillingDate = currentPeriodEnd
          ? currentPeriodEnd.toLocaleDateString("zh-CN")
          : "";

        sendPaymentConfirmationEmail(user.email, {
          planName: plan,
          billingPeriod,
          amount,
          currency: "USD",
          nextBillingDate,
        });
      }
    }
  } else {
    const userId = subscription.metadata?.userId;
    let userIdToUse = userId;

    if (!userIdToUse && stripeCustomerId) {
      const customer = await stripeClient.customers.retrieve(stripeCustomerId) as Stripe.Customer;
      if (customer.email) {
        const user = await prisma.user.findUnique({ where: { email: customer.email } });
        if (user) {
          userIdToUse = user.id;
        }
      }
    }

    if (!userIdToUse) {
      logger.error("No userId found for subscription update:", { stripeSubscriptionId });
      return;
    }

    await prisma.subscription.upsert({
      where: { userId: userIdToUse },
      update: {
        plan,
        status,
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodEnd,
      },
      create: {
        userId: userIdToUse,
        plan,
        status,
        stripeCustomerId,
        stripeSubscriptionId,
        currentPeriodEnd,
      },
    });

    if (status === "active") {
      const user = await prisma.user.findUnique({ where: { id: userIdToUse } });
      if (user?.email) {
        const planConfig = PLANS[plan as keyof typeof PLANS] || CNY_PLANS[plan as keyof typeof CNY_PLANS];
        const billingPeriod = priceId ? (mapPriceToPlan(priceId)?.billingPeriod ?? "monthly") : "monthly";
        const amount = billingPeriod === "yearly"
          ? (planConfig?.yearlyPrice ?? 0)
          : (planConfig?.monthlyPrice ?? 0);
        const nextBillingDate = currentPeriodEnd
          ? currentPeriodEnd.toLocaleDateString("zh-CN")
          : "";

        sendPaymentConfirmationEmail(user.email, {
          planName: plan,
          billingPeriod,
          amount,
          currency: "USD",
          nextBillingDate,
        });
      }
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeSubscriptionId = subscription.id;

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        plan: "free",
        status: "inactive",
        currentPeriodEnd: null,
      },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const parent = invoice.parent;
  const stripeSubscriptionId = parent?.subscription_details?.subscription;

  if (!stripeSubscriptionId || typeof stripeSubscriptionId !== "string") {
    return;
  }

  const existing = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId },
  });

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: "past_due",
      },
    });
  }
}
