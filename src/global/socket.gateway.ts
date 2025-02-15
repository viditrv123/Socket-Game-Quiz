import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketUser } from './types';
import { SocketAuthMiddlewareService } from './middlewares/socket.middleware';

@WebSocketGateway({
  path: '/socket.io',
  cors: {
    origin: '*',
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  },
})
export class SocketGateway {
  constructor(
    private readonly socketAuthMiddlewareService: SocketAuthMiddlewareService,
  ) {}

  @WebSocketServer()
  private server: any;

  afterInit() {
    this.socketAuthMiddlewareService.use =
      this.socketAuthMiddlewareService.use.bind(
        this.socketAuthMiddlewareService,
      );

    this.server.use((socket: Socket, next) =>
      this.socketAuthMiddlewareService.use(socket, next),
    );
    this.server.on('connection', (client: Socket) => {
      console.log(`Client connected: ${client.id}`);
    });
  }

  @SubscribeMessage('GET_CURRENT_USER')
  async getCurrentUser(client: Socket) {
    const user = (client.data.user as SocketUser) || {};
    return user;
  }
}
