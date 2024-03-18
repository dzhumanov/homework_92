import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import config from "./config";

import userRouter from "./routers/users";
import expressWs from "express-ws";
import {
  ActiveConnections,
  IncomingMessage,
  OnlineUser,
  OnlineUsers,
} from "./types";
import Message from "./models/Message";
import User from "./models/User";

const app = express();
expressWs(app);

const port = 8000;

app.use(express.json());
app.use(cors());

app.use("/users", userRouter);

const webSocketRouter = express.Router();

const activeConnections: ActiveConnections = {};
let onlineUsers: OnlineUser[] = [];
let LoggedUsers: OnlineUsers = {};

const authWS = async (token: string) => {
  const user = await User.findOne({ token });
  return !!user;
};

const sendMessageToActive = (payload: any) => {
  Object.values(activeConnections).forEach((connection) => {
    const outgoingMsg = {
      type: "NEW_MESSAGE",
      payload,
    };
    connection.send(JSON.stringify(outgoingMsg));
  });
};

const sendOnlineToActive = () => {
  Object.values(activeConnections).forEach((connection) => {
    const outgoingMsg = {
      type: "ONLINE",
      payload: onlineUsers,
    };
    connection.send(JSON.stringify(outgoingMsg));
  });
};

webSocketRouter.ws("/chat", (ws, req) => {
  const id = crypto.randomUUID();
  console.log("Client connected id=", id);
  activeConnections[id] = ws;

  ws.on("message", async (message) => {
    const parsedMessage = JSON.parse(message.toString()) as IncomingMessage;

    if (parsedMessage.type === "LOGIN") {
      const isAuthenticated = await authWS(parsedMessage.payload.user.token);

      if (isAuthenticated) {
        console.log("Authentication successful");
        ws.send(
          JSON.stringify({
            type: "WELCOME",
            payload: "Hello, you have connected to the chat!",
          })
        );

        const messages = await Message.find()
          .sort({ date: -1 })
          .limit(30)
          .populate("user", "username");

        ws.send(
          JSON.stringify({
            type: "MESSAGES",
            payload: messages,
          })
        );

        if (LoggedUsers[id]) {
          LoggedUsers[id] = parsedMessage.payload.user;
        }
        const existingUser = onlineUsers.find(
          (user) => user.token === parsedMessage.payload.user.token
        );
        if (!existingUser) {
          onlineUsers.push(parsedMessage.payload.user);
          console.log(parsedMessage.payload.user);
        }

        sendOnlineToActive();
      } else {
        ws.close();
      }
    }
    if (parsedMessage.type === "SEND_MESSAGE") {
      const newMessage = new Message({
        user: parsedMessage.payload.user,
        message: parsedMessage.payload.message,
      });
      newMessage.save();
      sendMessageToActive(parsedMessage.payload);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected", id);
    // const userLog = LoggedUsers[id];
    // onlineUsers = onlineUsers.filter((user) => user.token !== userLog.token);
    // console.log(onlineUsers);
    // if (userLog) {
    //   delete LoggedUsers[id];
    //   sendOnlineToActive();
    // }
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
