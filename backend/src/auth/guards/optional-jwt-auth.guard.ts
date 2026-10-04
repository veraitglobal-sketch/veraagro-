import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Public files remain public; a verified identity enables private file access. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(_err: unknown, user: TUser): TUser {
    return user || null;
  }
}
