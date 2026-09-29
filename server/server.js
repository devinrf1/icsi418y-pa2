require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing from server/.env");
    return;
  }

  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    app.listen(9000, () => {
      console.log("Server running on port 9000");
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
  }
}

startServer();