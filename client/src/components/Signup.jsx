import { useState } from "react";

const emptyForm = {
  f_name: "",
  l_name: "",
  username: "",
  password: ""
};

export default function Signup() {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      const response = await fetch("http://localhost:9000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();
      setIsError(!response.ok);
      setMessage(data.message);

      if (response.ok) {
        setForm(emptyForm);
      }
    } catch (error) {
      setIsError(true);
      setMessage("Could not connect to the server.");
    }
  }

  return (
    <section>
      <h2>Sign up</h2>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="signup-first">First name</label>
        <input
          id="signup-first"
          name="f_name"
          value={form.f_name}
          onChange={handleChange}
        />

        <label htmlFor="signup-last">Last name</label>
        <input
          id="signup-last"
          name="l_name"
          value={form.l_name}
          onChange={handleChange}
        />

        <label htmlFor="signup-username">Username</label>
        <input
          id="signup-username"
          name="username"
          value={form.username}
          onChange={handleChange}
        />

        <label htmlFor="signup-password">Password</label>
        <input
          id="signup-password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
        />

        <button type="submit">Sign up</button>
      </form>

      {message && (
        <p role="status" style={{ color: isError ? "crimson" : "green" }}>
          {message}
        </p>
      )}
    </section>
  );
}