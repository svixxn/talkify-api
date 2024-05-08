import { ValidatorResponse } from "types";

export function isValidCreateUserRequest(body: any): ValidatorResponse {
  if (typeof body !== "object")
    return {
      isValid: false,
      error: "Invalid body type",
    };

  if (typeof body.name !== "string" || body.name.length < 4)
    return {
      isValid: false,
      error: "Name should be longer than 3 characters",
    };

  if (typeof body.age !== "number")
    return {
      isValid: false,
      error: "Field 'age' is missing or invalid",
    };

  return {
    isValid: true,
    error: "",
  };
}

export function isValidSignInRequest(body: any): ValidatorResponse {
  if (typeof body !== "object")
    return {
      isValid: false,
      error: "Invalid body type",
    };

  if (typeof body.email !== "string")
    return {
      isValid: false,
      error: "Email is required",
    };

  if (typeof body.password !== "string")
    return {
      isValid: false,
      error: "Password is required",
    };

  return {
    isValid: true,
    error: "",
  };
}
