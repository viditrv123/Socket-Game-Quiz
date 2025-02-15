import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { SocketUser } from './types';
import { SocketAuthMiddlewareService } from './middlewares/socket.middleware';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

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
    @Inject('CACHE_MANAGER') private readonly cacheManager: Cache,
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
      client.on('disconnect', () => {
        console.log(`Client disconnected: ${client.id}`);
      });
    });
  }

  @SubscribeMessage('GET_CURRENT_USER')
  async getCurrentUser(client: Socket) {
    const user = (client.data.user as SocketUser) || {};
    return user;
  }

  @SubscribeMessage('FIND_GAME')
  async findGame(client: Socket) {
    const questions = [1, 2, 3, 4];
    const user = await this.getCurrentUser(client);
    // Fetch the current queue from Redis
    const queue: string[] = (await this.cacheManager.get('queue')) || [];
    console.log('queue', queue);
    // If the queue doesn't exist, initialize it as an empty array
    const clientId: string = client.id;
    if (queue.length === 0) {
      await this.cacheManager.set('queue', []);

      // Add the client ID to the queue
      queue.push(clientId); // Now adding client.id to the queue

      // Save the updated queue back to Redis
      await this.cacheManager.set('queue', queue);
    } else {
      const secondClientId = queue.shift();
      if (secondClientId) {
        // Emit that the second client has been found (you can emit an event if you want)
        const secondClient = this.server.sockets.sockets.get(secondClientId);
        if (secondClient) {
          // Both clients join the same room, using the room name as a unique identifier (like 'game-room')
          const roomName = `game-room-${clientId}-${secondClientId}`;
          client.join(roomName); // The current client joins the room
          secondClient.join(roomName); // The second client joins the same room

          console.log(
            `Client ${clientId} and ${secondClientId} joined room ${roomName}`,
          );

          // You can send a message to both clients that they're now in the same game room
          this.server.to(roomName).emit('GAME_STARTED', { room: roomName });

          this.startQuestions(roomName)
        }
      }
    }

    // Log the updated queue
    console.log(queue);

    // Return the user info (as before)
    return user;
  }

  async startQuestions( roomName: string) {
    const questions = [1, 2, 3, 4];
    let index = 0;
    let timeOut;
    timeOut = setInterval(() => {
      if (index >= questions.length) {
        clearInterval(timeOut);
        console.log('All questions have been sent');
      } else {
        this.server
          .to(roomName)
          .emit('QUESTIONS', { question: questions[index] });
        index += 1;
      }
    }, 10000);
  }
}
