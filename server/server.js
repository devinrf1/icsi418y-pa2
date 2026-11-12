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
let userStories;

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
    userStories = db.collection("UserStories");
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
    const assignedStory = await userStories.findOne({
      project_id: projectId, assigned_user_id: userId
    });
    if (assignedStory) {
      return res.status(409).json({
        message: "Reassign, unassign, or delete this member's stories in this project before removing them."
      });
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

async function findStoryProject(id, res) {
  if (!ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid project ID." });
    return null;
  }
  const project = await projects.findOne({ _id: new ObjectId(id) });
  if (!project) res.status(404).json({ message: "Project does not exist." });
  return project;
}

async function storyFields(body, projectId, creating, res) {
  const { title, description, priority, status, assigned_user_id } = body;
  if (typeof title !== "string" || !title.trim() ||
      typeof description !== "string" || !description.trim()) {
    res.status(400).json({ message: "Title and description are required." });
    return null;
  }
  if (!/^As an? .+, I want .+, so that .+/is.test(description.trim())) {
    res.status(400).json({ message: "Use: As a [user], I want [goal], so that [benefit]." });
    return null;
  }
  if (!["High", "Medium", "Low"].includes(priority)) {
    res.status(400).json({ message: "Select a valid priority." });
    return null;
  }
  if (creating ? status !== undefined && status !== "To Do" :
      !["To Do", "In Progress", "Done"].includes(status)) {
    res.status(400).json({ message: creating ? "New stories must start in To Do." : "Select a valid status." });
    return null;
  }
  if (body.project_id !== undefined && body.project_id !== projectId.toString()) {
    res.status(400).json({ message: "A story cannot change projects." });
    return null;
  }

  if (!creating && assigned_user_id === undefined) {
    res.status(400).json({ message: "Include an assigned member or null for Unassigned." });
    return null;
  }
  let assignedId = null;
  if (assigned_user_id !== null && assigned_user_id !== undefined) {
    if (typeof assigned_user_id !== "string" || !ObjectId.isValid(assigned_user_id)) {
      res.status(400).json({ message: "Invalid assigned user ID." });
      return null;
    }
    assignedId = new ObjectId(assigned_user_id);
    const user = await users.findOne({ _id: assignedId });
    if (!user) {
      res.status(404).json({ message: "Assigned user does not exist." });
      return null;
    }
    const membership = await projectMemberships.findOne({ project_id: projectId, user_id: assignedId });
    if (!membership) {
      res.status(400).json({ message: "Select a member of this project or Unassigned." });
      return null;
    }
  }

  return {
    title: title.trim(), description: description.trim(), priority,
    status: creating ? "To Do" : status, assigned_user_id: assignedId
  };
}

app.get("/projects/:projectId/stories", async (req, res) => {
  try {
    const project = await findStoryProject(req.params.projectId, res);
    if (!project) return;
    const stories = await userStories.find({ project_id: project._id }).toArray();
    return res.json(stories);
  } catch (error) {
    console.error("Backlog error:", error);
    return res.status(500).json({ message: "Could not load the backlog." });
  }
});

app.post("/projects/:projectId/stories", async (req, res) => {
  try {
    const project = await findStoryProject(req.params.projectId, res);
    if (!project) return;
    const fields = await storyFields(req.body ?? {}, project._id, true, res);
    if (!fields) return;
    await userStories.insertOne({ project_id: project._id, ...fields });
    return res.status(201).json({ message: "Story created." });
  } catch (error) {
    console.error("Create story error:", error);
    return res.status(500).json({ message: "Could not create story." });
  }
});

app.put("/projects/:projectId/stories/:storyId", async (req, res) => {
  try {
    const project = await findStoryProject(req.params.projectId, res);
    if (!project) return;
    if (!ObjectId.isValid(req.params.storyId)) {
      return res.status(400).json({ message: "Invalid story ID." });
    }
    const fields = await storyFields(req.body ?? {}, project._id, false, res);
    if (!fields) return;
    const result = await userStories.updateOne(
      { _id: new ObjectId(req.params.storyId), project_id: project._id },
      { $set: fields }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Story not found in this project." });
    }
    return res.json({ message: "Story updated." });
  } catch (error) {
    console.error("Update story error:", error);
    return res.status(500).json({ message: "Could not update story." });
  }
});

app.delete("/projects/:projectId/stories/:storyId", async (req, res) => {
  try {
    const project = await findStoryProject(req.params.projectId, res);
    if (!project) return;
    if (!ObjectId.isValid(req.params.storyId)) {
      return res.status(400).json({ message: "Invalid story ID." });
    }
    const result = await userStories.deleteOne({
      _id: new ObjectId(req.params.storyId), project_id: project._id
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Story not found in this project." });
    }
    return res.json({ message: "Story deleted." });
  } catch (error) {
    console.error("Delete story error:", error);
    return res.status(500).json({ message: "Could not delete story." });
  }
});

startServer();
