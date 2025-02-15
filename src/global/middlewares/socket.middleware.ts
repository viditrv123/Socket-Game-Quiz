import { Injectable } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { Socket } from '../types';

@Injectable()
export class SocketAuthMiddlewareService {
  constructor(private readonly userService: UserService) {}

  async use(client: Socket, next: (err?: any) => void): Promise<void> {
    try {
      const { authorization } = client.handshake.headers;
      const auth = client.handshake.auth;
      const token: string = auth.token || authorization || '';
      const user: any = await this.userService.verifyUserToken({ token });
      client.data.user = {
        id: user.user.id,
        username: user.user.username,
      };
      next();
    } catch (err) {
      console.error(err);
      next(err);
    }
  }
}
