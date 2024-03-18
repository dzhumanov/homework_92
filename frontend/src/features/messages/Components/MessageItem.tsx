import { Button, Grid, Typography } from "@mui/material";
import dayjs from "dayjs";
import { Message } from "../../../types";
import { useAppSelector } from "../../../app/hooks";
import { selectUser } from "../../users/usersSlice";

interface Props {
  message: Message;
  onDelete: () => void;
}

const MessageItem: React.FC<Props> = ({ message, onDelete }) => {
  const user = useAppSelector(selectUser);

  return (
    <Grid
      item
      container
      direction="column"
      sx={{ borderTop: "1px solid black" }}
    >
      <Grid item container justifyContent="space-between">
        <Typography variant="h4">{message.user.displayName}</Typography>
        {user?.role === "admin" && (
          <Button
            onClick={onDelete}
            color="primary"
            variant="contained"
            sx={{
              ml: "auto",
              mr: "20px",
              fontSize: "20px",
              bgcolor: "red",
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
            Delete
          </Button>
        )}
        <Typography variant="h4">
          {dayjs(message.date).format("HH:mm:ss")}
        </Typography>
      </Grid>
      <Typography variant="h4">{message.message}</Typography>
    </Grid>
  );
};

export default MessageItem;
