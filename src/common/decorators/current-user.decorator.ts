import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  sub: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | 'id' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserPayload;

    if (data === 'id') {
      return user?.sub; // 'id' is an alias for 'sub'
    }

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
