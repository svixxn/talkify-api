import { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "../config/db";
import { users } from "../config/schema";
import { eq } from "drizzle-orm";
import { APIResponse } from "./general";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const createCustomer = async (email: string) => {
  try {
    const customer = await stripe.customers.create({
      email,
    });
    return customer;
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

export const createCheckoutSession = async (
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
  customerId: string
) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      customer: customerId,
      mode: "subscription",
      success_url: `${process.env.WEB_BASE_URL}/chat?checkout_success=true`,
      cancel_url: `${process.env.WEB_BASE_URL}/chat?checkout_success=false`,
    });

    return session.url;
  } catch (error) {
    console.error("Error creating checkout session:", error);
    throw error;
  }
};

export const handleWebhook = async (event: Stripe.Event) => {
  switch (event.type) {
    case "invoice.paid":
      handleInvoicePaid(event.data.object);
      break;
    case "customer.subscription.deleted":
      handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }
};

const handleInvoicePaid = async (data: Stripe.Invoice) => {
  const { customer: customerId } = data;

  if (!customerId) {
    console.error("No customer ID or email found in the invoice data.");
    return;
  }

  await db
    .update(users)
    .set({
      isPremium: true,
    })
    .where(eq(users.stripeCustomerId, customerId as string));

  console.log(`Invoice for customer ${customerId} was paid successfully.`);
};

const handleSubscriptionDeleted = async (data: Stripe.Subscription) => {
  const { customer } = data;

  if (!customer) {
    console.error("No customer ID or email found in the subscription data.");
    return;
  }

  await db
    .update(users)
    .set({
      isPremium: false,
    })
    .where(eq(users.stripeCustomerId, customer as string));

  console.log(`Subscription for customer ${customer} was deleted.`);
};
