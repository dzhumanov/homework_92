import mongoose from "mongoose";
import config from "./config";
import User from "./models/User";
import Message from "./models/Message";

const dropCollection = async (
  db: mongoose.Connection,
  collectionName: string
) => {
  try {
    await db.dropCollection(collectionName);
  } catch (e) {
    console.log(`Collection ${collectionName} was missing, skipping drop...`);
  }
};

const run = async () => {
  await mongoose.connect(config.mongoose.db);
  const db = mongoose.connection;

  const collections = ["users", "messages"];

  for (const collectionName of collections) {
    await dropCollection(db, collectionName);
  }

  const [admin, user] = await User.create(
    {
      username: "admin",
      password: "123",
      role: "admin",
      token: crypto.randomUUID(),
      displayName: "Admin",
    },
    {
      username: "user",
      password: "123",
      token: crypto.randomUUID(),
      displayName: "User",
    }
  );

  await Message.create(
    {
      user: admin,
      message: "Hey there!",
    },
    {
      user: admin,
      message: "howdy?",
    },
    {
      user: user,
      message: "im good!",
    }
  );
  await db.close();
};

void run();
