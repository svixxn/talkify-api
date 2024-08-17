import { JwtPayload } from "jsonwebtoken";

export type JwtDecodeSchema = (JwtPayload & { id: string | number }) | string;
