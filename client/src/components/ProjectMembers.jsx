import { useState } from "react";

export default function ProjectMembers({ projects, users }) {
  const [projectId, setProjectId] = useState("");
  const [userId, setUserId] = useState("");
  const [members, setMembers] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const project = projects.find((item) => item._id === projectId);

  async function loadMembers(id) {
    setLoaded(false);
    const response = await fetch(`http://localhost:9000/projects/${id}/members`);
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message);
      setMembers([]);
      return false;
    }
    setMembers(data);
    setLoaded(true);
    return true;
  }

  async function selectProject(event) {
    const id = event.target.value;
    setProjectId(id);
    setUserId("");
    setMembers([]);
    setLoaded(false);
    setMessage("");
    if (!id) return;
    setBusy(true);
    try {
      if (await loadMembers(id)) setMessage("Members loaded.");
    } catch (error) {
      console.error("Load members error:", error);
      setMessage("Could not reach the server. Select the project again to retry.");
    } finally {
      setBusy(false);
    }
  }

  async function addMember(event) {
    event.preventDefault();
    if (!projectId || !userId) {
      setMessage("Select a project and a user.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`http://localhost:9000/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId })
      });
      const data = await response.json();
      setMessage(data.message);
      if (response.ok) await loadMembers(projectId);
    } catch (error) {
      console.error("Add member request failed:", error);
      setLoaded(false);
      setMessage("Request or refresh failed. Select the project again to check its members.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(id) {
    setBusy(true);
    try {
      const response = await fetch(
        `http://localhost:9000/projects/${projectId}/members/${id}`,
        { method: "DELETE" }
      );
      const data = await response.json();
      setMessage(data.message);
      if (response.ok) await loadMembers(projectId);
    } catch (error) {
      console.error("Remove member request failed:", error);
      setLoaded(false);
      setMessage("Request or refresh failed. Select the project again to check its members.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Project members</h2>
      <label>
        Project
        <select value={projectId} onChange={selectProject} disabled={busy}>
          <option value="">Select a project</option>
          {projects.map((item) => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
        </select>
      </label>
      {busy && <p>Working...</p>}
      {project && loaded && (
        <>
          <h3>Members of {project.name}</h3>
          <ul>
            {members.map((member) => (
              <li key={member._id}>
                {member.username}{" "}
                {member._id === project.project_lead_id ? (
                  <span>(Project Lead - cannot be removed)</span>
                ) : (
                  <button type="button" disabled={busy}
                    onClick={() => removeMember(member._id)}>Remove {member.username}</button>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={addMember}>
            <label>
              User to add
              <select value={userId} onChange={(event) => setUserId(event.target.value)}
                disabled={busy}>
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>{user.username}</option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={busy}>Add member</button>
          </form>
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
