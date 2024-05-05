import { CreateUserRequest } from "types";

export function isValidCreateUserRequest(body: any): {
  isValid: boolean;
  error: string;
} {
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
