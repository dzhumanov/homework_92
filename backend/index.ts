import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import config from "./config";

import userRouter from "./routers/users";
import expressWs from "express-ws";
import { ActiveConnections, IncomingMessage } from "./types";
import Message from "./models/Message";
import messagesRouter from "./routers/messages";
import User from "./models/User";

const app = express();
expressWs(app);

const port = 8000;

app.use(express.json());
app.use(cors());

app.use("/users", userRouter);
app.use("/messages", messagesRouter);

const webSocketRouter = express.Router();

const activeConnections: ActiveConnections = {};

const authWS = async (token: string) => {
  const user = await User.findOne({ token });
  return !!user;
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
      Object.values(activeConnections).forEach((connection) => {
        const outgoingMsg = {
          type: "NEW_MESSAGE",
          payload: {
            user: parsedMessage.payload.user,
            message: parsedMessage.payload.message,
          },
        };
        connection.send(JSON.stringify(outgoingMsg));
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected", id);
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
