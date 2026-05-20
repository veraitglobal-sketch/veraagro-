import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { shouldLogThrottled } from '../utils/log-throttle';

/**
 * Global exception filter for consistent error responses
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (!(exception instanceof HttpException)) {
      const err = exception as Error;
      const msg = err?.message || String(exception);
      const throttleKey = `${err?.name || 'Error'}:${msg.slice(0, 120)}`;
      if (shouldLogThrottled(throttleKey)) {
        const isProd = process.env.NODE_ENV === 'production';
        const line = `${request.method} ${request.url} — ${err?.name || 'Error'}: ${msg}`;
        if (isProd) {
          this.logger.error(line);
        } else {
          this.logger.error(line, err?.stack);
        }
      }
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Internal server error';

    const error =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).error || 'Error'
        : 'Error';

    const isProd = process.env.NODE_ENV === 'production';
    /** In dev: surface real unhandled error message; never send stack/DB details in production body. */
    const debugUnwrapped =
      !isProd &&
      !(exception instanceof HttpException) &&
      exception != null
        ? {
            name: (exception as Error)?.name,
            message: (exception as Error)?.message || String(exception),
          }
        : undefined;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      ...(typeof exceptionResponse === 'object' &&
      (exceptionResponse as any).errors
        ? { errors: (exceptionResponse as any).errors }
        : {}),
      ...(debugUnwrapped ? { debug: debugUnwrapped } : {}),
    });
  }
}
