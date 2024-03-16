import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import config from "./config";

import userRouter from "./routers/users";
import expressWs from "express-ws";
import { ActiveConnections, IncomingMessage } from "./types";

const app = express();
expressWs(app);

const port = 8000;

app.use(express.json());
app.use(cors());

app.use("/users", userRouter);

const webSocketRouter = express.Router();

const activeConnections: ActiveConnections = {};

webSocketRouter.ws("/chat", (ws, req) => {
  const id = crypto.randomUUID();
  console.log("Client connected id=", id);
  activeConnections[id] = ws;

  ws.send(
    JSON.stringify({
      type: "WELCOME",
      payload: "Hello, you have connected to the chat!",
    })
  );

  ws.on("message", (message) => {
    console.log(message.toString());
    const parsedMessage = JSON.parse(message.toString()) as IncomingMessage;
    if (parsedMessage.type === "SEND_MESSAGE") {
      Object.values(activeConnections).forEach((connection) => {
        const outgoingMsg = {
          type: "NEW_MESSAGE",
          payload: {
            username: parsedMessage.payload.username,
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
