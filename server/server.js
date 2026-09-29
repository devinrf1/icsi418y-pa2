require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");

const app = express();

app.use(express.json());
app.use(cors());

let users;

app.get("/", (req, res) => {
  res.json({ message: "Server is running" });
});

app.post("/signup", async (req, res) => {
  const { f_name, l_name, username, password } = req.body ?? {};

  const missingField = [f_name, l_name, username, password].some(
    (value) => typeof value !== "string" || value.trim() === ""
  );

  if (missingField) {
    return res.status(400).json({
      message: "First name, last name, username, and password are required."
    });
  }

  const cleanUsername = username.trim();

  try {
    const existingUser = await users.findOne({
      username: cleanUsername
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await users.insertOne({
      f_name: f_name.trim(),
      l_name: l_name.trim(),
      username: cleanUsername,
      password: passwordHash
    });

    return res.status(201).json({
      message: "User created successfully."
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username already exists."
      });
    }

    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Server error. Please try again."
    });
  }
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing from server/.env");
    return;
  }

  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();

    const db = client.db("pa2");
    users = db.collection("users");
    await users.createIndex({ username: 1 }, { unique: true });

    console.log("Connected to MongoDB");

    app.listen(9000, () => {
      console.log("Server running on port 9000");
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error);
  }
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password) {
    return res.status(400).json({
      message: "Username and password are required.",
    });
  }

  try {
    const user = await users.findOne({ username: username.trim() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid username or password.",
      });
    }

    return res.status(200).json({
      message: "Login successful.",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error. Please try again.",
    });
  }
});

startServer();