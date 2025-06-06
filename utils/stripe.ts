import { Request, Response } from "express";
import Stripe from "stripe";

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
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]
) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "subscription",
      success_url: `${process.env.WEB_BASE_URL}/success`,
      cancel_url: `${process.env.WEB_BASE_URL}/cancel`,
    });

    return session;
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
    default:
      console.warn(`Unhandled event type: ${event.type}`);
  }
};

const handleInvoicePaid = async (data: Stripe.Invoice) => {
  const customerId = data.customer;

  if (!customerId) {
    console.error("No customer ID found in the invoice data.");
    return;
  }

  console.log(`Invoice for customer ${customerId} was paid successfully.`);
};
