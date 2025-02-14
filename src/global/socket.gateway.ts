import {WebSocketGateway, WebSocketServer} from "@nestjs/websockets";
import {Socket} from "socket.io";

@WebSocketGateway({
    path: '/socket.io',
    cors:{
        origin: '*',
        method:['GET','POST','PUT','DELETE','OPTIONS'],
    }
})

export class SocketGateway{
    constructor() {}

    @WebSocketServer()
    private server: any;

    afterInit() {
        this.server.on('connection', (client: Socket) => {
            console.log(`Client connected: ${client.id}`);
        })
    }
}