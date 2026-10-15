require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

const app = express();

app.use(express.json());
app.use(cors());

let users;
let projects;
let projectMemberships;

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
    users = db.collection("Users");
    projects = db.collection("Projects");
    projectMemberships = db.collection("ProjectMemberships");
    await projectMemberships.createIndex(
      { project_id: 1, user_id: 1 },
      { unique: true }
    );
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

app.get("/users", async (req, res) => {
  try {
    const result = await users.find({}, { projection: { password: 0 } }).toArray();
    return res.json(result);
  } catch (error) {
    console.error("Users error:", error);
    return res.status(500).json({ message: "Could not load users." });
  }
});

app.post("/projects", async (req, res) => {
  const { name, description, status, project_lead_id } = req.body ?? {};
  const missingField = [name, description, status, project_lead_id].some(
    (value) => typeof value !== "string" || value.trim() === ""
  );

  if (missingField) {
    return res.status(400).json({ message: "All project fields are required." });
  }

  if (!["Planning", "Active", "Completed"].includes(status)) {
    return res.status(400).json({ message: "Select a valid project status." });
  }

  if (!ObjectId.isValid(project_lead_id)) {
    return res.status(400).json({ message: "Invalid Project Lead ID." });
  }

  try {
    const leadId = new ObjectId(project_lead_id);
    const lead = await users.findOne({ _id: leadId });
    if (!lead) {
      return res.status(404).json({ message: "Project Lead does not exist." });
    }

    const result = await projects.insertOne({
      name: name.trim(),
      description: description.trim(),
      status,
      project_lead_id: leadId
    });

    try {
      await projectMemberships.insertOne({
        project_id: result.insertedId,
        user_id: leadId
      });
    } catch (error) {
      await projects.deleteOne({ _id: result.insertedId });
      throw error;
    }

    return res.status(201).json({ message: "Project created successfully." });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({ message: "Could not create project." });
  }
});

app.get("/projects", async (req, res) => {
  try {
    const result = await projects.find({}).toArray();
    for (const project of result) {
      const lead = await users.findOne({ _id: project.project_lead_id });
      project.project_lead_username = lead ? lead.username : "User not found";
    }
    return res.json(result);
  } catch (error) {
    console.error("Projects error:", error);
    return res.status(500).json({ message: "Could not load projects." });
  }
});

app.get("/projects/:projectId/members", async (req, res) => {
  if (!ObjectId.isValid(req.params.projectId)) {
    return res.status(400).json({ message: "Invalid project ID." });
  }

  try {
    const projectId = new ObjectId(req.params.projectId);
    const project = await projects.findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ message: "Project does not exist." });
    }

    const memberships = await projectMemberships.find({ project_id: projectId }).toArray();
    const members = [];
    for (const membership of memberships) {
      const user = await users.findOne({ _id: membership.user_id });
      if (user) {
        members.push({ _id: user._id, username: user.username });
      }
    }
    return res.json(members);
  } catch (error) {
    console.error("Members error:", error);
    return res.status(500).json({ message: "Could not load members." });
  }
});

app.post("/projects/:projectId/members", async (req, res) => {
  const { user_id } = req.body ?? {};
  if (!ObjectId.isValid(req.params.projectId) ||
      typeof user_id !== "string" || !ObjectId.isValid(user_id)) {
    return res.status(400).json({ message: "Valid project and user IDs are required." });
  }

  try {
    const projectId = new ObjectId(req.params.projectId);
    const userId = new ObjectId(user_id);
    const project = await projects.findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ message: "Project does not exist." });
    }
    const user = await users.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }
    const existingMembership = await projectMemberships.findOne({
      project_id: projectId, user_id: userId
    });
    if (existingMembership) {
      return res.status(409).json({ message: "User is already a member of this project." });
    }
    await projectMemberships.insertOne({ project_id: projectId, user_id: userId });
    return res.status(201).json({ message: "Member added successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "User is already a member of this project." });
    }
    console.error("Add member error:", error);
    return res.status(500).json({ message: "Could not add member." });
  }
});

app.delete("/projects/:projectId/members/:userId", async (req, res) => {
  if (!ObjectId.isValid(req.params.projectId) || !ObjectId.isValid(req.params.userId)) {
    return res.status(400).json({ message: "Valid project and user IDs are required." });
  }

  try {
    const projectId = new ObjectId(req.params.projectId);
    const userId = new ObjectId(req.params.userId);
    const project = await projects.findOne({ _id: projectId });
    if (!project) {
      return res.status(404).json({ message: "Project does not exist." });
    }
    const user = await users.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User does not exist." });
    }
    if (project.project_lead_id.equals(userId)) {
      return res.status(400).json({ message: "The Project Lead cannot be removed." });
    }
    const result = await projectMemberships.deleteOne({
      project_id: projectId, user_id: userId
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "User is not a member of this project." });
    }
    return res.json({ message: "Member removed successfully." });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({ message: "Could not remove member." });
  }
});

startServer();
