import express from "express";
import auth from "../middleware/auth";
import Message from "../models/Message";

const messagesRouter = express.Router();

messagesRouter.get("/", async (req, res, next) => {
  try {
    const messages = await Message.find()
      .sort({ date: -1 })
      .limit(30)
      .populate("user", "username");
    return res.send(messages);
  } catch (e) {
    next(e);
  }
});

export default messagesRouter;
