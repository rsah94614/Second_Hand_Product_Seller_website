/**
 * Centralized utility to parse and format API errors into user-friendly messages.
 * Extracts messages, codes, and validation error arrays.
 */

export const parseApiError = (error, fallbackMessage = "An unexpected error occurred") => {
  const responseData = error?.response?.data;
  
  if (!responseData) {
    return {
      message: error?.message || fallbackMessage,
      raw: error
    };
  }

  const code = responseData.code;
  let message = responseData.message || error.message || fallbackMessage;
  let details = "";

  // Handle Mongoose/Validation error arrays
  if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
    details = responseData.errors.join("\n");
  }

  // Handle specific backend custom error codes gracefully
  if (code === "PROFILE_INCOMPLETE" && responseData.missing?.length) {
    details = `Missing: ${responseData.missing.join(", ")}`;
  }

  return {
    message,
    code,
    details,
    raw: responseData,
  };
};

export const formatErrorForDisplay = (parsedError) => {
  if (parsedError.details) {
    return `${parsedError.message}\n\n${parsedError.details}`;
  }
  return parsedError.message;
};
