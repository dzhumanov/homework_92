import User from "../models/User";

export const authWS = async (token: string) => {
  const user = await User.findOne({ token });
  return user;
};
