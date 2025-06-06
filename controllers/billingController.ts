import { Request, Response } from "express";
import { handleWebhook } from "../utils/stripe";
import { APIResponse, asyncWrapper } from "../utils/general";
import { httpStatus } from "../utils/constants";

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
