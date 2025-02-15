import { Module } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { SocketAuthMiddlewareService } from './middlewares/socket.middleware';

@Module({
  exports: [SocketAuthMiddlewareService],
  imports: [UserService],
  controllers: [],
  providers: [SocketAuthMiddlewareService],
})
export class GlobalModule {}
