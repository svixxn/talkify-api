export const httpStatus = {
  OK: {
    code: 200,
    message: "Success",
  },
  Created: {
    code: 201,
    message: "Row created successfully",
  },
  BadRequest: {
    code: 400,
    message: "There was some issue on the server",
  },
  Unauthorized: {
    code: 401,
    message: "You should be authenticated to perform this action",
  },
  Forbidden: {
    code: 403,
    message: "You don't have permission to perform this action",
  },
  NotFound: {
    code: 404,
    message: "Row not found",
  },
  Deleted: {
    code: 204,
    message: "Row deleted successfully",
  },
};

export const defaultChatPhoto = "https://placehold.co/600x600?text=Chat";

export const freeChatMembersLimit = 5;
