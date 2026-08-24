/** Mirrors pictionary-be's ApiResponse envelope — every backend response is shaped like this. */
export interface ApiResponse<T = unknown> {
  status: number;
  data: T | null;
  error: string | null;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}
