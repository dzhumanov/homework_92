import { Model } from "mongoose";
import { WebSocket } from "ws";

export interface UserFields {
  username: string;
  password: string;
  role: string;
  token: string;
  displayName: string;
  avatar: string | null;
  googleID?: string;
}

interface UserMethods {
  checkPassword(password: string): Promise<boolean>;
  generateToken(): void;
}

type UserModel = Model<UserFields, {}, UserMethods>;

export interface ActiveConnections {
  [id: string]: WebSocket;
}

export interface User {
  _id: string;
  username: string;
  displayName: string;
  role: string;
  token: string;
}

export interface IncomingMessage {
  type: string;
  payload: {
    user: User;
    message: string;
  };
}

export interface OnlineUser {
  _id: string;
  displayName: string;
  token: string;
}

export interface OnlineUsers {
  [id: string]: OnlineUser;
}
