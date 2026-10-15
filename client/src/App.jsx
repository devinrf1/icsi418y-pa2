import Login from "./components/Login";
import Signup from "./components/Signup";
import Projects from "./components/Projects";
import "./App.css";

export default function App() {
  return (
    <main className="account-page">
      <h1>Account and Project System</h1>

      <div className="login-area">
        <Login />
      </div>

      <div className="signup-area">
        <Signup />
      </div>
      <Projects />
    </main>

  );
}