import { Socket as _Socket } from 'socket.io';

export type typeSocketUser = {
  id: string;
  userName: string;
};

export type Socket = _Socket;

export type JoinRoom = {
  id: string;
  identity: string;
  url: string;
  host: string;
  pathName: string;
};
