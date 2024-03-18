import { Button, Container, Grid, TextField, Typography } from "@mui/material";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
            displayName: user?.displayName,
          },
          message: messageText,
        },
      })
    );
    setMessageText("");
  };

  const deleteMessage = (id: string) => {
    if (!ws.current) return;

    ws.current.send(
      JSON.stringify({
        type: "DELETE",
        payload: id,
      })
    );
  };

  return (
    <>
      <Grid container justifyContent="space-between">
        <Grid
          item
          container
          xs={8}
          sx={{
            background: "#fff",
            border: "3px solid black",
            borderRadius: "15px",
            height: "70vh",
            overflow: "auto",
          }}
        >
          {messages.map((message) => (
            <MessageItem
              message={message}
              key={message._id}
              onDelete={() => deleteMessage(message._id)}
            />
          ))}
          <div ref={messagesEndRef} />
        </Grid>

        <Grid
          item
          container
          xs={3}
          direction="column"
          sx={{
            background: "#fff",
            border: "3px solid black",
            borderRadius: "15px",
            height: "70vh",
            px: "10px",
          }}
        >
          <Typography variant="h3" sx={{ textAlign: "center" }}>
            Online:
          </Typography>
          {online.length > 0 &&
            online.map((onlineItem) => (
              <Typography key={onlineItem} variant="h4">
                {onlineItem}
              </Typography>
            ))}
        </Grid>
      </Grid>

      <form onSubmit={sendMessage}>
        <Grid
          container
          sx={{
            mt: "20px",
            alignItems: "center",
          }}
        >
          <Grid item xs={6}>
            <TextField
              multiline
              rows={3}
              id="messageText"
              label="Message"
              value={messageText}
              onChange={onMessage}
              name="info"
              required
              sx={{
                bgcolor: "#fff",
                border: "3px solid black",
                borderRadius: "15px",
              }}
            />
          </Grid>
          <Grid item xs={2} sx={{ textAlign: "right" }}>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              sx={{
                mr: "20px",
                fontSize: "32px",
                bgcolor: "#000",
                color: "#fff",
                "&:hover": {
                  bgcolor: "#fff",
                  color: "#000",
                },
                "&:active": {
                  bgcolor: "#000",
                  color: "#fff",
                },
              }}
            >
              Create
            </Button>
          </Grid>
        </Grid>
      </form>
    </>
  );
};

export default Messages;
