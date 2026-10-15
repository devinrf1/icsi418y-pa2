import { useState } from "react";
import CreateProject from "./CreateProject";
import ProjectList from "./ProjectList";
import ProjectMembers from "./ProjectMembers";

export default function Projects() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setBusy(true);
    setMessage("Loading users and projects...");
    try {
      const userResponse = await fetch("http://localhost:9000/users");
      const userData = await userResponse.json();
      if (!userResponse.ok) {
        setMessage(userData.message);
        return;
      }
      const projectResponse = await fetch("http://localhost:9000/projects");
      const projectData = await projectResponse.json();
      if (!projectResponse.ok) {
        setMessage(projectData.message);
        return;
      }
      setUsers(userData);
      setProjects(projectData);
      setLoaded(true);
      setMessage("Users and projects loaded.");
    } catch (error) {
      console.error("Load data error:", error);
      setMessage("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="project-area">
      <h2>Projects</h2>
      <p>Load users and projects to begin. Reload after signing up a new user.</p>
      <button type="button" onClick={loadData} disabled={busy}>
        Load users and projects
      </button>
      {message && <p role="status">{message}</p>}
      {loaded && (
        <>
          <CreateProject users={users} onCreated={loadData} />
          <ProjectList projects={projects} />
          <ProjectMembers projects={projects} users={users} />
        </>
      )}
    </div>
  );
}
