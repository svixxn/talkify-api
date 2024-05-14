import { JwtPayload } from "jsonwebtoken";

export type CreateUserRequest = {
  name: string;
  age: number;
};

export type ValidatorResponse = {
  isValid: boolean;
  error: string;
};

export type JwtDecodeSchema = (JwtPayload & { id: string | number }) | string;
