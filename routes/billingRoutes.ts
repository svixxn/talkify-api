import express from "express";

import { checkAuth } from "../middlewares/authMiddleware";

import {
  handleBillingWebhook,
  handleCreatePremiumCheckoutSession,
} from "../controllers/billingController";

const router = express.Router();

router.use(checkAuth);

router
  .route("/premium-checkout-session")
  .post(handleCreatePremiumCheckoutSession);

router.route("/webhook").post(handleBillingWebhook);

export default router;
