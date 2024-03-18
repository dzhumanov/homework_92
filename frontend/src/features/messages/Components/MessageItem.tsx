import { Grid, Typography } from "@mui/material";
import dayjs from "dayjs";
import { Message } from "../../../types";

interface Props {
  message: Message;
}

const MessageItem: React.FC<Props> = ({ message }) => {
  return (
    <Grid container direction="column">
      <Typography variant="h4">{message.user.displayName}</Typography>
      <Typography variant="h4">{message.message}</Typography>
      <Typography variant="h4">
        At: {dayjs(message.date).format("HH:mm:ss")}
      </Typography>
    </Grid>
  );
};

export default MessageItem;
