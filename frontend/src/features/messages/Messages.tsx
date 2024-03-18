import { Grid, Typography } from "@mui/material";
import { useAppSelector } from "../../app/hooks";
import { IncomingMessage, Message } from "../../types";
import { useEffect, useRef, useState } from "react";
import { selectUser } from "../users/usersSlice";
import { useNavigate } from "react-router-dom";
import MessageItem from "./Components/MessageItem";

const Messages = () => {
  const navigate = useNavigate();
  const user = useAppSelector(selectUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [online, setOnline] = useState<string[]>([]);
  const [messageText, setMessageText] = useState("");
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
    ws.current = new WebSocket("ws://localhost:8000/chat");

    ws.current.addEventListener("open", () => {
      if (ws.current) {
        ws.current.send(
          JSON.stringify({
            type: "LOGIN",
            payload: {
              user: {
                _id: user?._id,
                username: user?.username,
                displayName: user?.displayName,
                token: user?.token,
              },
            },
          })
        );
      }
    });

    ws.current.addEventListener("close", () => console.log("ws closed"));

    ws.current.addEventListener("message", (event) => {
      const decodedMessage = JSON.parse(event.data) as IncomingMessage;

      if (decodedMessage.type === "MESSAGES") {
        setMessages(decodedMessage.payload);
      }

      if (decodedMessage.type === "NEW_MESSAGE") {
        setMessages((prev) => [...prev, decodedMessage.payload]);
      }

      if (decodedMessage.type === "ONLINE") {
        setOnline(decodedMessage.users);
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
  }, [user]);

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
    <Grid
      container
      sx={{
        background: "#fff",
        border: "3px solid black",
        borderRadius: "15px",
      }}
    >
      <Grid item container xs={8} direction="column">
        <div>
          {messages.map((message) => (
            <MessageItem message={message} key={message._id} />
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
      </Grid>
      <Grid item container xs={3} direction="column">
        <Typography variant="h4">Online:</Typography>
        <Grid item container direction="column">
          {online.length > 0 &&
            online.map((onlineItem) => (
              <Typography key={onlineItem} variant="h4">
                {onlineItem}
              </Typography>
            ))}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Messages;
