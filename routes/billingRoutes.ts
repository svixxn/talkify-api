import express from "express";

import { checkAuth } from "../middlewares/authMiddleware";

import { checkAvailability } from "../middlewares/roleMiddleware";
import { handleBillingWebhook } from "../controllers/billingController";

const router = express.Router();

router.use(checkAuth);

router.route("/webhook").post(handleBillingWebhook);

export default router;
