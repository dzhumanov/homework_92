import mongoose, { Model } from "mongoose";
import { WebSocket } from "ws";

export interface UserFields {
  username: string;
  password: string;
  role: string;
  token: string;
  displayName: string;
  isActive: boolean;
}

interface UserMethods {
  checkPassword(password: string): Promise<boolean>;
  generateToken(): void;
}

type UserModel = Model<UserFields, {}, UserMethods>;

export interface ActiveConnections {
  [id: string]: WebSocket;
}

export interface IncomingMessage {
  type: string;
  payload: {
    _id: string;
    user: UserType;
    message: string;
    date: Date;
  };
}

export interface OnlineUser {
  _id: mongoose.Types.ObjectId;
  displayName: string;
  token: string;
  isActive: boolean;
}

export interface OnlineUsers {
  [id: string]: OnlineUser;
}
