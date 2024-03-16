import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import config from "./config";

const app = express();
const port = 8000;

app.use(cors());

const run = async () => {
  await mongoose.connect(config.mongoose.db);

  app.listen(port, () => {
    console.log(`Server started on ${port} port!`);
  });

  process.on("exit", () => {
    mongoose.disconnect();
  });
};

void run();
