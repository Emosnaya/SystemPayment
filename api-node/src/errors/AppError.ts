export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "BAD_GATEWAY"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

export interface AppErrorOptions {
  code?: AppErrorCode;
  details?: unknown;
  isOperational?: boolean;
}

/**
 * Error de dominio HTTP. Los errores operacionales se exponen al cliente;
 * el resto se ocultan detrás de un 500 genérico.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: AppErrorCode;
  readonly details?: unknown;
  readonly isOperational: boolean;

  constructor(statusCode: number, message: string, options: AppErrorOptions = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = options.code ?? AppError.defaultCode(statusCode);
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  private static defaultCode(statusCode: number): AppErrorCode {
    switch (statusCode) {
      case 400:
        return "BAD_REQUEST";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 502:
        return "BAD_GATEWAY";
      case 503:
        return "SERVICE_UNAVAILABLE";
      default:
        return "INTERNAL_ERROR";
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      error: this.message,
      code: this.code,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}
