import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { SocketGateway } from './global/socket.gateway';
import { SocketAuthMiddlewareService } from './global/middlewares/socket.middleware';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({ isGlobal: true }),
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.DATABASE_URI as string),
    UserModule,
  ],
  controllers: [AppController],
  providers: [SocketAuthMiddlewareService, AppService, SocketGateway],
})
export class AppModule {}
