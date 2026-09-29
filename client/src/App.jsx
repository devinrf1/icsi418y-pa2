import Login from "./components/Login";
import Signup from "./components/Signup";
import "./App.css";

export default function App() {
  return (
    <main className="account-page">
      <h1>Account System</h1>

      <div className="login-area">
        <Login />
      </div>

      <div className="signup-area">
        <Signup />
      </div>
    </main>
  );
}