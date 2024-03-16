import React from "react";
import { Button, Grid, Typography } from "@mui/material";
import { User } from "../../../types";
import { useAppDispatch } from "../../../app/hooks";
import { logout } from "../../../features/users/usersThunk";

interface Props {
  user: User;
}

const UserMenu: React.FC<Props> = ({ user }) => {
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <Grid item container alignItems="center" gap="10px">
      <Typography color="inherit" sx={{ fontSize: "32px" }}>
        Hello, {user.displayName}
      </Typography>
      <Button onClick={handleLogout} color="inherit" sx={{ fontSize: "20px" }}>
        Logout
      </Button>
    </Grid>
  );
};

export default UserMenu;
