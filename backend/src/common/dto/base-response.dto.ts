export class BaseResponseDto<T = unknown> {
  success: boolean;
  requestId: string;
  timestamp: string;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;

  static of<T>(
    data: T,
    message = 'Success',
    meta?: Record<string, unknown>,
    requestId = 'unknown',
  ): BaseResponseDto<T> {
    return {
      success: true,
      requestId,
      timestamp: new Date().toISOString(),
      message,
      data,
      meta,
    };
  }
}
