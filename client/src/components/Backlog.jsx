import { useState } from "react";
import StoryForm from "./StoryForm";

async function readStories(url) {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}

export default function Backlog({ project, members, initialStories }) {
  const url = `http://localhost:9000/projects/${project._id}/stories`;
  const [stories, setStories] = useState(initialStories);
  const [ready, setReady] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  function openForm(story) {
    setMessage("");
    setEditing(story);
    setFormOpen(true);
  }

  async function changeStory(method, id, fields) {
    setBusy(true);
    setMessage("");
    try {
      const options = { method };
      if (fields) {
        options.headers = { "Content-Type": "application/json" };
        options.body = JSON.stringify(fields);
      }
      const response = await fetch(id ? url + "/" + id : url, options);
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.message);
        return;
      }
      setFormOpen(false);
      setEditing(null);
      setReady(false);
      setMessage(data.message);
      setStories(await readStories(url));
      setReady(true);
    } catch (error) {
      setMessage("Request or refresh failed. Reselect the project to check its backlog. " + error.message);
    } finally {
      setBusy(false);
    }
  }

  function deleteStory(story) {
    if (window.confirm('Delete "' + story.title + '"?')) {
      changeStory("DELETE", story._id);
    }
  }

  return (
    <section>
      <h2>Backlog: {project.name}</h2>
      {!ready && !message && <p>Loading stories...</p>}
      {message && <p role="status">{message}</p>}
      {ready && (
        <>
          {!formOpen && <button disabled={busy} onClick={() => openForm(null)}>New story</button>}
          {formOpen && (
            <StoryForm key={editing ? editing._id : "new"} story={editing} members={members}
              busy={busy} onCancel={() => setFormOpen(false)}
              onSave={(fields) => changeStory(editing ? "PUT" : "POST", editing?._id, fields)} />
          )}
          {stories.length === 0 && <p>No stories in this project yet.</p>}
          {stories.map((story) => {
            const member = members.find((item) => item._id === story.assigned_user_id);
            return (
              <article key={story._id}>
                <h3>{story.title}</h3>
                <p>{story.description}</p>
                <p>Priority: {story.priority} | Status: {story.status}</p>
                <p>Assigned member: {member ? member.username : "Unassigned"}</p>
                <button disabled={busy} onClick={() => openForm(story)}>Edit</button>{" "}
                <button disabled={busy} onClick={() => deleteStory(story)}>Delete</button>
              </article>
            );
          })}
        </>
      )}
    </section>
  );
}
