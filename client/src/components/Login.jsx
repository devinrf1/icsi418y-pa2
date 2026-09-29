import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!username.trim() || !password) {
      setSuccess(false);
      setMessage("Username and password are required.");
      return;
    }

    try {
      const response = await fetch("http://localhost:9000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();
      setSuccess(response.ok);
      setMessage(data.message);

      if (response.ok) {
        setPassword("");
      }
    } catch (error) {
      console.error("Login request failed:", error);
      setSuccess(false);
      setMessage("Could not reach the server. Please try again.");
    }
  }

  return (
    <section>
      <h2>Log in</h2>

      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="submit">Log in</button>
      </form>

      {message && (
        <p role="status" style={{ color: success ? "green" : "red" }}>
          {message}
        </p>
      )}
    </section>
  );
}