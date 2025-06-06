import { Request, Response } from "express";
import { handleWebhook } from "../utils/stripe";
import { asyncWrapper } from "../utils/general";

export const handleBillingWebhook = asyncWrapper(
  async (req: Request, res: Response) => {
    try {
      const event = req.body;

      console.log("Received webhook event:", event);

      const res = await handleWebhook(event);
    } catch (error) {
      console.error("Error handling webhook:", error);
      return res.status(500).send("Internal Server Error");
    }
  }
);
