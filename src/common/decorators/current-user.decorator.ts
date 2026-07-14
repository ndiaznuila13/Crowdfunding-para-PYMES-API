import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user && request.headers['x-user-id']) {
      request.user = {
        id: parseInt(request.headers['x-user-id'] as string, 10),
        role: request.headers['x-user-role'],
      };
    }
    return request.user;
  },
);
