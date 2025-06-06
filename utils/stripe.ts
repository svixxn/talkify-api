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

export const handleWebhook = async (event: any) => {
  console.log("Received webhook event:", event);

  //   switch (event.type) {
  //     case "checkout.session.completed":
  //       // Handle successful checkout session completion
  //       console.log("Checkout session completed:", event.data.object);
  //       break;
  //     // Add more cases for other event types as needed
  //     default:
  //       console.warn(`Unhandled event type: ${event.type}`);
  //   }

  //   response.status(200).send("Webhook received");
};

const handleInvoicePaid = async (invoice: Stripe.Invoice) => {
  const customerId = invoice.customer as string;

  // Here you can implement your logic to handle the paid invoice
  console.log(`Invoice for customer ${customerId} was paid successfully.`);
  // For example, you might want to update the user's subscription status in your database
};
