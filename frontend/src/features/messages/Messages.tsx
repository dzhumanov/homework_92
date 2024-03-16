import { Grid, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { IncomingMessage, Message } from "../../types";
import { useEffect, useRef, useState } from "react";
import { selectUser } from "../users/usersSlice";
import { fetchMessages } from "./messagesThunk";
import dayjs from "dayjs";

const Messages = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    dispatch(fetchMessages())
      .then((result) => {
        if (fetchMessages.fulfilled.match(result)) {
          setMessages(result.payload);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, [dispatch]);

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
          user: {
            _id: user?._id,
            username: user?.username,
          },
          message: messageText,
        },
      })
    );
  };

  return (
    <>
      <div>
        {messages.map((message) => (
          <Grid container direction="column" key={Math.random()}>
            <Typography variant="h4">{message.user.username}</Typography>
            <Typography variant="h4">{message.message}</Typography>
            <Typography variant="h4">
              At: {dayjs(message.date).format("HH:mm:ss")}
            </Typography>
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
