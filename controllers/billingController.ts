import { Request, Response } from "express";
import { createCheckoutSession, handleWebhook } from "../utils/stripe";
import { APIResponse, asyncWrapper } from "../utils/general";
import { httpStatus } from "../utils/constants";
import { createPremiumCheckoutSessionSchema } from "../config/schema";

export const handleCreatePremiumCheckoutSession = asyncWrapper(
  async (req: Request, res: Response) => {
    const user = res.locals.user;

    const lineItems = [
      {
        price: process.env.STRIPE_PREMIUM_PRICE_ID || "",
        quantity: 1,
      },
    ];

    const sessionUrl = await createCheckoutSession(
      lineItems,
      user.stripeCustomerId
    );

    return APIResponse(
      res,
      httpStatus.OK.code,
      "Checkout session created successfully",
      { url: sessionUrl }
    );
  }
);

export const handleBillingWebhook = asyncWrapper(
  async (req: Request, res: Response) => {
    try {
      const event = req.body;

      await handleWebhook(event);

      return APIResponse(
        res,
        httpStatus.OK.code,
        "Webhook received and processed successfully"
      );
    } catch (error) {
      console.error("Error handling webhook:", error);
      return res.status(500).send("Internal Server Error");
    }
  }
);
