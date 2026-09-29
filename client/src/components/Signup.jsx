import { useState } from "react";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !username.trim() || !password) {
      setMessage("First name, last name, username, and password are required.");
      return;
    }

    try {
      const response = await fetch("http://localhost:9000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          f_name: firstName.trim(),
          l_name: lastName.trim(),
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();
      setMessage(data.message || data.error || "The request could not be completed.");

      if (response.ok) {
        setFirstName("");
        setLastName("");
        setUsername("");
        setPassword("");
      }
    } catch (error) {
      console.error("Signup request failed:", error);
      setMessage("Could not reach the server. Please try again.");
    }
  }

  return (
    <section>
      <h2>Sign up</h2>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="signup-first-name">First name</label>
          <input
            id="signup-first-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="signup-last-name">Last name</label>
          <input
            id="signup-last-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <button type="submit">Sign up</button>
      </form>

      {message && <p role="status">{message}</p>}
    </section>
  );
}