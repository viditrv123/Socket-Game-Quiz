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
    private timeOut,
    private roomName,
  ) {}

  @WebSocketServer()
  private server: any;

  afterInit() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.socketAuthMiddlewareService.use =
      this.socketAuthMiddlewareService.use.bind(
        this.socketAuthMiddlewareService,
      );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.server.use((socket: Socket, next) =>
      this.socketAuthMiddlewareService.use(socket, next),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    this.server.on('connection', (client: Socket) => {
      console.log(`Client connected: ${client.id}`);
      client.on('disconnect', async () => {
        const queue: string[] = (await this.cacheManager.get('queue')) || [];
        if (queue.includes(client.id)) {
          await this.cacheManager.set(
            'queue',
            queue.filter((q) => q !== client.id),
          );
        }
        console.log(`Client disconnected: ${client.id}`);
      });
    });
  }

  @SubscribeMessage('GET_CURRENT_USER')
  getCurrentUser(client: Socket) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = (client.data.user as SocketUser) || {};
    return user;
  }

  @SubscribeMessage('QUIT_GAME')
  quitGame(client: Socket) {
    console.log('timeout clearing');
    clearInterval(this.timeOut);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    this.server.to(this.roomName).emit('EXIT_GAME', {});
  }

  @SubscribeMessage('FIND_GAME')
  async findGame(client: Socket) {
    const user = this.getCurrentUser(client);
    // Fetch the current queue from Redis
    const queue: string[] = (await this.cacheManager.get('queue')) || [];
    console.log('queue', queue);
    // If the queue doesn't exist, initialize it as an empty array
    const clientId: string = client.id;
    if (queue.length === 0) {
      await this.cacheManager.set('queue', []);

      queue.push(clientId);

      await this.cacheManager.set('queue', queue);
    } else {
      const secondClientId = queue.shift();
      if (secondClientId) {
        await this.cacheManager.set('queue', queue);
        if (clientId !== secondClientId) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          const secondClient = this.server.sockets.sockets.get(secondClientId);
          if (secondClient) {
            this.roomName = `game-room-${clientId}-${secondClientId}`;
            await client.join(this.roomName);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            secondClient.join(this.roomName);

            console.log(
              `Client ${clientId} and ${secondClientId} joined room ${this.roomName}`,
            );

            const roomMapping = (await this.cacheManager.get('room')) || {};
            const obj = {};
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            obj[clientId] = secondClient;
            obj[secondClientId] = clientId;
            await this.cacheManager.set('room', { ...roomMapping, ...obj });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            this.server
              .to(this.roomName)
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              .emit('GAME_STARTED', { room: this.roomName });

            this.startQuestions();
          }
        }
      }
    }

    return user;
  }

  startQuestions() {
    console.log('eNTERed');
    let questions: object[] = [
      {
        question: 'What is the square root of 144?',
        options: ['10', '12', '14', '16'],
        correct: 1,
      },
      {
        question: 'What is 15% of 200?',
        options: ['30', '40', '50', '60'],
        correct: 0,
      },
      {
        question: 'What is 25 times 16?',
        options: ['400', '375', '500', '425'],
        correct: 0,
      },
      {
        question: 'What is the result of 80 divided by 4?',
        options: ['16', '18', '20', '22'],
        correct: 2,
      },
      {
        question: 'If x = 3, what is the value of 4x + 5?',
        options: ['17', '15', '13', '11'],
        correct: 0,
      },
      {
        question: 'What is the value of 9^2?',
        options: ['81', '72', '90', '100'],
        correct: 0,
      },
      {
        question: 'What is the product of 7 and 13?',
        options: ['84', '78', '91', '98'],
        correct: 2,
      },
      {
        question:
          'If a train travels 60 miles in 1 hour, how far will it travel in 3.5 hours?',
        options: ['210 miles', '200 miles', '220 miles', '240 miles'],
        correct: 0,
      },
      {
        question:
          'What is the area of a triangle with a base of 10 units and a height of 5 units?',
        options: ['25', '30', '40', '50'],
        correct: 0,
      },
      {
        question: 'What is the sum of 132 and 768?',
        options: ['900', '950', '910', '850'],
        correct: 0,
      },
    ];

    questions = this.getRandomizedQuestions(questions);

    let index = 0;

    this.timeOut = setInterval(() => {
      console.log('TimeoutSTarted');
      if (index >= questions.length) {
        clearInterval(this.timeOut);
        console.log('All questions have been sent');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        this.server
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .to(this.roomName)
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          .emit('QUESTIONS', { question: questions[index] });
        index += 1;
      }
    }, 10000);
  }

  getRandomizedQuestions(questions: object[]): object[] {
    const shuffledQuestions = [...questions];

    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [
        shuffledQuestions[j],
        shuffledQuestions[i],
      ];
    }

    return shuffledQuestions.slice(0, 4);
  }
}
