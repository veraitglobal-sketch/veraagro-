import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Observable, map } from 'rxjs';

/** Columns that must never leave the API, whatever relation a query happened to include. */
const SECRET_KEYS = new Set(['passwordHash', 'email_verification_token']);

function strip(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date || Buffer.isBuffer(value) || value instanceof StreamableFile) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = strip(value[i], seen);
    return value;
  }
  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) return value; // Decimal, class instances, etc.
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (SECRET_KEYS.has(key)) delete obj[key];
    else obj[key] = strip(obj[key], seen);
  }
  return obj;
}

export function stripSecrets<T>(value: T): T {
  return strip(value, new WeakSet()) as T;
}

@Injectable()
export class StripSecretsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((body) => stripSecrets(body)));
  }
}
