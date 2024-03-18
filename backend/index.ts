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
  payloadMutation,
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

const authWS = async (token: string) => {
  const user = await User.findOne({ token });
  return user;
};

const sendMessageToActive = (payload: payloadMutation) => {
  Object.values(activeConnections).forEach((connection) => {
    const outgoingMsg = {
      type: "NEW_MESSAGE",
      payload,
    };
    connection.send(JSON.stringify(outgoingMsg));
  });
};

const sendOnlineUsers = async () => {
  const onlineUsers = await User.find({ isActive: true });
  const onlinedisplayNames = onlineUsers.map((user) => user.displayName);

  const outgoingMsg = {
    type: "ONLINE",
    users: onlinedisplayNames,
  };

  Object.values(activeConnections).forEach((connection) => {
    connection.send(JSON.stringify(outgoingMsg));
  });
};

webSocketRouter.ws("/chat", (ws, req) => {
  const id = crypto.randomUUID();
  console.log("Client connected id=", id);
  activeConnections[id] = ws;

  const users: OnlineUsers = {};

  ws.on("message", async (message) => {
    const parsedMessage = JSON.parse(message.toString()) as IncomingMessage;

    if (parsedMessage.type === "LOGIN") {
      const user = await authWS(parsedMessage.payload.user.token);

      if (user) {
        user.isActive = true;
        await user.save();
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
          .populate("user", "username displayName");

        const reversedMessages = messages.reverse();
        ws.send(
          JSON.stringify({
            type: "MESSAGES",
            payload: reversedMessages,
          })
        );

        await sendOnlineUsers();

        users[id] = user;
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

      const payload: payloadMutation = {
        user: parsedMessage.payload.user,
        message: parsedMessage.payload.message,
        date: new Date(),
        _id: newMessage._id,
      };

      sendMessageToActive(payload);
    }

    if (parsedMessage.type === "DELETE") {
      try {
        await Message.findByIdAndDelete(parsedMessage.payload);
        const messages = await Message.find()
          .sort({ date: -1 })
          .limit(30)
          .populate("user", "username displayName");

        const reversedMessages = messages.reverse();
        ws.send(
          JSON.stringify({
            type: "MESSAGES",
            payload: reversedMessages,
          })
        );
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
        sendOnlineUsers();
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
