import User from "../models/User";

export const authWS = async (token: string) => {
  try {
    const user = await User.findOne({ token });
    return user;
  } catch (e) {
    console.error(e);
  }
};
