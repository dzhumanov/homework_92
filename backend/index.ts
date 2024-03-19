import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import config from "./config";
import userRouter from "./routers/users";
import expressWs from "express-ws";
import {
  ActiveConnections,
  IncomingMessage,
  OnlineUsers,
  messageMutation,
} from "./types";
import Message from "./models/Message";
import User from "./models/User";
import {
  Welcome,
  WelcomeMessages,
  findUsersInConnections,
  sendMessageToActive,
  sendMessagesToAll,
  sendOnlineUsers,
} from "./functions/functions";
import { authWS } from "./middleware/auth";
import { WebSocket } from "ws";

const app = express();
expressWs(app);

const port = 8000;

app.use(express.json());
app.use(cors());

app.use("/users", userRouter);

const webSocketRouter = express.Router();

const activeConnections: ActiveConnections = {};
const users: OnlineUsers = {};
webSocketRouter.ws("/chat", (ws, req) => {
  const id = crypto.randomUUID();
  console.log("Client connected id=", id);
  activeConnections[id] = ws;

  ws.on("message", async (message) => {
    const parsedMessage = JSON.parse(message.toString()) as IncomingMessage;

    if (parsedMessage.type === "LOGIN") {
      const user = await authWS(parsedMessage.payload.user.token);

      if (user) {
        user.isActive = true;
        await user.save();
        console.log("Authentication successful");

        Welcome(ws);
        WelcomeMessages(ws);

        await sendOnlineUsers(activeConnections);
        users[id] = user;
        console.log(users);
      } else {
        ws.close();
      }
    }

    if (parsedMessage.type === "SEND_MESSAGE") {
      const newMessage = new Message({
        user: parsedMessage.payload.user._id,
        message: parsedMessage.payload.message,
      });
      newMessage.save();

      const payload: messageMutation = {
        user: parsedMessage.payload.user,
        message: parsedMessage.payload.message,
        date: new Date(),
        _id: newMessage._id,
      };

      sendMessageToActive(payload, activeConnections);
    }

    if (parsedMessage.type === "PERSONAL_MESSAGE") {
      const payload: messageMutation = {
        user: parsedMessage.payload.user,
        message: parsedMessage.payload.message,
        date: new Date(),
        _id: crypto.randomUUID(),
      };

      const senderUsername = parsedMessage.payload.user.username;
      const receiverUsername = parsedMessage.payload.receiver.username;

      const userIds = findUsersInConnections(
        [senderUsername, receiverUsername],
        users
      );

      userIds.forEach((userId) => {
        activeConnections[userId].send(
          JSON.stringify({
            type: "NEW_PERSONAL_MESSAGE",
            payload: payload,
          })
        );
      });
    }

    if (parsedMessage.type === "DELETE") {
      try {
        await Message.findByIdAndDelete(parsedMessage.payload);
        sendMessagesToAll(activeConnections);
      } catch (e) {
        console.error(e);
      }
    }
  });

  ws.on("close", async () => {
    console.log("Client disconnected", id);
    const user = users[id];
    if (user) {
      const userDB = await User.findById(user._id);
      if (userDB) {
        userDB.isActive = false;
        await userDB.save();
        console.log("Client disconnected:", id);
        sendOnlineUsers(activeConnections);
      }
      delete users[id];
    }
    delete activeConnections[id];
  });
});

app.use(webSocketRouter);

const run = async () => {
  await mongoose.connect(config.mongoose.db);

  app.listen(port, () => {
    console.log(`Server started on ${port} port!`);
  });

  process.on("exit", () => {
    mongoose.disconnect();
  });
};

void run();
