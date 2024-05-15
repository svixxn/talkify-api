import { ValidatorResponse } from "types";
import { z } from "zod";

export function isValidCreateUserRequest(body: any): ValidatorResponse {
  if (typeof body !== "object")
    return {
      isValid: false,
      error: "Invalid body type",
    };

  if (typeof body.name !== "string" || body.name.length < 4)
    return {
      isValid: false,
      error: "Name should be a string and longer than 3 characters",
    };

  if (typeof body.age !== "number")
    return {
      isValid: false,
      error: "Field 'age' is missing or invalid",
    };

  if (typeof body.email !== "string")
    return {
      isValid: false,
      error: "Field 'email' is missing or invalid",
    };

  if (typeof body.password !== "string" || body.password.length < 6)
    return {
      isValid: false,
      error: "Password should be a string and longer than 5 characters",
    };

  if (
    typeof body.confirmPassword !== "string" ||
    body.password !== body.confirmPassword
  )
    return {
      isValid: false,
      error: "Passwords don't match",
    };

  return {
    isValid: true,
    error: "",
  };
}

export const SignInRequest = z.object({
  email: z
    .string()
    .email("You should provide a valid email")
    .min(3, "Email should be al least 3 characters long"),
  password: z.string().min(6, "Password should be al least 6 characters long"),
});
