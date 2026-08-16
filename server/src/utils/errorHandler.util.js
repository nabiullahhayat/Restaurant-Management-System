import { toMessageCode } from "./localization.util.js";

class ErrorHandler extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Human-readable message
   * @param {string} errorCode - Optional machine-readable code
   */
  constructor(statusCode, message = "Something went wrong", errorCode = null) {
    super(message);
    this.success = false;
    this.statusCode = statusCode;
    // Derive a machine-readable error code from the message if not provided
    this.errorCode = errorCode || toMessageCode(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;

