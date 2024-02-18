import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import cors from "cors";

import userRoutes from "./routes/userRoutes";

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(cors());

app.get(["/api", "/api/version"], (req: Request, res: Response) => {
  res.json({ version: "1.0.0" });
});

app.use("/api/users", userRoutes);

export default app;
