import { useState } from "react";

export default function CreateProject({ users, onCreated }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [leadId, setLeadId] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim() || !description.trim() || !leadId) {
      setMessage("All project fields are required.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("http://localhost:9000/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
          project_lead_id: leadId
        })
      });
      const data = await response.json();
      setMessage(data.message);
      if (response.ok) {
        setName("");
        setDescription("");
        setStatus("Planning");
        setLeadId("");
        await onCreated();
      }
    } catch (error) {
      console.error("Create project request failed:", error);
      setMessage("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <h2>Create project</h2>
      {users.length === 0 && <p>Sign up a user, then load users and projects again.</p>}
      <form onSubmit={handleSubmit}>
        <label>
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          Description
          <textarea rows="3" value={description}
            onChange={(event) => setDescription(event.target.value)} />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>
        </label>
        <label>
          Project Lead
          <select value={leadId} onChange={(event) => setLeadId(event.target.value)}>
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>{user.username}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy}>Create project</button>
      </form>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
