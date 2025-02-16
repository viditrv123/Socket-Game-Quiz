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
      client.on('disconnect', async() => {
        let queue = await this.cacheManager.get('queue')
        if(queue.)
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

      queue.push(clientId);

      await this.cacheManager.set('queue', queue);
    } else {
      const secondClientId = queue.shift();
      if (secondClientId) {
        await this.cacheManager.set('queue', queue);
        if(clientId !==secondClientId)
        {
          const secondClient = this.server.sockets.sockets.get(secondClientId);
          if (secondClient) {
            const roomName = `game-room-${clientId}-${secondClientId}`;
            client.join(roomName);
            secondClient.join(roomName);

            console.log(
              `Client ${clientId} and ${secondClientId} joined room ${roomName}`,
            );

            this.server.to(roomName).emit('GAME_STARTED', { room: roomName });

            this.startQuestions(roomName);
          }
        }
      }
    }

    // Log the updated queue
    console.log(queue);

    // Return the user info (as before)
    return user;
  }

  async startQuestions(roomName: string) {
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

    questions = await this.getRandomizedQuestions(questions);

    let index = 0;
    let timeOut;
    timeOut = setInterval(() => {
      console.log('TimeoutSTarted');
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

  async getRandomizedQuestions(questions: object[]): Promise<object[]> {
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
