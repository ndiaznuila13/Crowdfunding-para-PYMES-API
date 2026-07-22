import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    let user = request.user;

    if (!user && request.headers['x-user-id']) {
      user = {
        id: parseInt(request.headers['x-user-id'] as string, 10),
        role: request.headers['x-user-role'] as Role,
      };
      request.user = user;
    }

    if (!user) {
      return false;
    }
    return requiredRoles.includes(user.role);
  }
}
