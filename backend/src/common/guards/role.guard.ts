import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { Role } from '../../generated/prisma/enums';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly roles: Role[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request?.['user'] as unknown as {
      id: string;
      role: Role;
    };

    if (!user?.role && !this.roles.includes(user?.role)) {
      throw new ForbiddenException(`You don't have access to this resource`);
    }

    return true;
  }
}
