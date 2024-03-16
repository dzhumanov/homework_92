import express from "express";
import User from "../models/User";
import mongoose from "mongoose";

const userRouter = express.Router();

userRouter.post("/", async (req, res, next) => {
  try {
    const user = new User({
      username: req.body.username,
      password: req.body.password,
      displayName: req.body.displayName,
    });
    user.generateToken();
    await user.save();
    res.send(user);
  } catch (e) {
    if (e instanceof mongoose.Error.ValidationError) {
      return res.status(422).send(e);
    }
    next(e);
  }
});

userRouter.post("/sessions", async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (!user) {
      return res.status(422).send({ error: "username or password is wrong!!" });
    }

    const isMatch = await user.checkPassword(req.body.password);

    if (!isMatch) {
      return res.status(422).send({ error: "username or password is wrong!!" });
    }
    user.generateToken();
    await user.save();

    return res.send({ message: "username and password are correct!", user });
  } catch (e) {
    next(e);
  }
});

userRouter.delete("/sessions", async (req, res, next) => {
  try {
    const headerValue = req.get("Authorization");
    const successMessage = { message: "Success!" };

    if (!headerValue) {
      return res.send({ ...successMessage, stage: "No header" });
    }

    const [_bearer, token] = headerValue.split(" ");

    if (!token) {
      return res.send({ ...successMessage, stage: "No token" });
    }

    const user = await User.findOne({ token });

    if (!user) {
      return res.send({ ...successMessage, stage: "No user" });
    }

    user.generateToken();
    await user.save();

    return res.send({ ...successMessage, stage: "Success" });
  } catch (e) {
    return next(e);
  }
});

export default userRouter;
