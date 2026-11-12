import { useState } from "react";

export default function StoryForm({ story, members, busy, onSave, onCancel }) {
  const [title, setTitle] = useState(story?.title ?? "");
  const [description, setDescription] = useState(story?.description ?? "");
  const [priority, setPriority] = useState(story?.priority ?? "");
  const [status, setStatus] = useState(story?.status ?? "To Do");
  const [assignedId, setAssignedId] = useState(story?.assigned_user_id ?? "");
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !priority) {
      setMessage("Enter a title, description, and priority.");
      return;
    }
    setMessage("");
    const fields = { title, description, priority, assigned_user_id: assignedId || null };
    if (story) fields.status = status;
    onSave(fields);
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>{story ? "Edit story" : "Create story"}</h3>
      <label>
        Title
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        Description
        <textarea rows="3" placeholder="As a [user], I want [goal], so that [benefit]."
          value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Priority
        <select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="">Select a priority</option>
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
      </label>
      {story && (
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option>To Do</option>
            <option>In Progress</option>
            <option>Done</option>
          </select>
        </label>
      )}
      <label>
        Assigned member
        <select value={assignedId} onChange={(event) => setAssignedId(event.target.value)}>
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member._id} value={member._id}>{member.username}</option>
          ))}
        </select>
      </label>
      {message && <p role="status">{message}</p>}
      <button type="submit" disabled={busy}>{story ? "Save changes" : "Create story"}</button>
      <button type="button" disabled={busy} onClick={onCancel}>Cancel</button>
    </form>
  );
}
