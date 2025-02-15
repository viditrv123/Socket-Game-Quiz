import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';

@Injectable()
export class AppGaurd implements CanActivate {
  constructor(private userService: UserService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();

    // Check if authorization header exists
    const authorization = request.headers.authorization;
    console.log(authorization);
    if (!authorization) {
      return false; // No authorization header, unauthorized
    }

    try {
      // Split the token from the Authorization header
      const [bearer, token] = authorization.split(' ');

      // Ensure the token is provided and is a bearer token
      if (bearer !== 'Bearer' || !token) {
        return false; // Invalid token format
      }

      // Verify the token using the UserService
      const res = await this.userService.verifyUserToken({ token });

      if (res && res.user && Object.keys(res.user || {}).length) {
        return true; // User is authenticated
      } else {
        return false; // Invalid or expired token
      }
    } catch (err) {
      // If any error occurs during verification, return false
      return false;
    }
  }
}
