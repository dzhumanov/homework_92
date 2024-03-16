import { Grid, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectMessages } from "./messagesSlice";
import { IncomingMessage, Message } from "../../types";
import { useEffect, useRef, useState } from "react";
import { selectUser } from "../users/usersSlice";

const Messages = () => {
  //   const dispatch = useAppDispatch();
  //   const messages = useAppSelector(selectMessages);
  const user = useAppSelector(selectUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000/chat");

    ws.current.addEventListener("close", () => console.log("ws closed"));

    ws.current.addEventListener("message", (event) => {
      const decodedMessage = JSON.parse(event.data) as IncomingMessage;

      if (decodedMessage.type === "NEW_MESSAGE") {
        setMessages((prev) => [...prev, decodedMessage.payload]);
      }

      if (decodedMessage.type === "WELCOME") {
        console.log(decodedMessage.payload);
      }
    });

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const onMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ws.current) return;

    ws.current.send(
      JSON.stringify({
        type: "SEND_MESSAGE",
        payload: {
          username: user?.username,
          message: messageText,
        },
      })
    );
  };

  return (
    <>
      <div>
        {messages.map((message) => (
          <Grid container direction="column" key={message._id}>
            <Typography variant="h4">{message.username}</Typography>
            <Typography variant="h4">{message.message}</Typography>
          </Grid>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          name="messageText"
          value={messageText}
          onChange={onMessage}
        />
        <input type="submit" value="send" />
      </form>
    </>
  );
};

export default Messages;
