export type CreateUserRequest = {
  name: string;
  age: number;
};

export type ValidatorResponse = {
  isValid: boolean;
  error: string;
};
