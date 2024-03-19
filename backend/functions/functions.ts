import Message from "../models/Message";
import User from "../models/User";
import { ActiveConnections, OnlineUsers, messageMutation } from "../types";
import { WebSocket } from "ws";

export const sendMessageToActive = (
  payload: messageMutation,
  activeConnections: ActiveConnections
) => {
  Object.values(activeConnections).forEach((connection) => {
    const outgoingMsg = {
      type: "NEW_MESSAGE",
      payload,
    };
    connection.send(JSON.stringify(outgoingMsg));
  });
};

export const sendOnlineUsers = async (activeConnections: ActiveConnections) => {
  const onlineUsers = await User.find({ isActive: true });

  const outgoingMsg = {
    type: "ONLINE",
    users: onlineUsers,
  };

  Object.values(activeConnections).forEach((connection) => {
    connection.send(JSON.stringify(outgoingMsg));
  });
};

export const sendMessagesToAll = async (
  activeConnections: ActiveConnections
) => {
  const outgoingMsg = {
    type: "MESSAGES",
    payload: await FindMessages(),
  };

  Object.values(activeConnections).forEach((connection) => {
    connection.send(JSON.stringify(outgoingMsg));
  });
};

export const FindMessages = async () => {
  try {
    const messages = await Message.find()
      .sort({ date: -1 })
      .limit(30)
      .populate("user", "username displayName");

    const reversedMessages = messages.reverse();
    return reversedMessages;
  } catch (e) {
    console.error(e);
  }
};

export const Welcome = (ws: WebSocket) => {
  ws.send(
    JSON.stringify({
      type: "WELCOME",
      payload: "Hello, you have connected to the chat!",
    })
  );
};

export const WelcomeMessages = async (ws: WebSocket) => {
  ws.send(
    JSON.stringify({
      type: "MESSAGES",
      payload: await FindMessages(),
    })
  );
};

export const findUsersInConnections = (usernames: string[], users: OnlineUsers) => {
  const userIds: string[] = [];

  usernames.forEach((username) => {
    const userId = Object.keys(users).find(
      (id) => users[id].username === username
    );
    if (userId) {
      userIds.push(userId);
    }
  });

  return userIds;
};
