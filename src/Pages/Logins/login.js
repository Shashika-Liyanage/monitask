import React, { useState } from "react";
import "./Login.css";
import { Eye, EyeOff } from "lucide-react";
import { auth } from "../../Service/FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

function Login() {
  const [userType, setUserType] = useState("employee"); // admin or employee
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Firebase login
      await signInWithEmailAndPassword(auth, email, password);

      toast.success("Login Successful!");

      // Redirect based on user type
      setTimeout(() => {
        if (userType === "admin") navigate("/adminDash");
        else navigate("/employeeDash");
      }, 500);

    } catch (err) {
      console.error(err);

      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        toast.error("Invalid username or password");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email format");
      } else {
        toast.error("Login failed. Invalid User Name or Password");
      }
    }
  };

  return (
    <div className="login-container">
      <Toaster position="top-center" reverseOrder={false} />
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login</h2>

        {/* User Type Selection */}
        <div className="user-type">
          {/* <label>
            <input
              type="radio"
              name="userType"
              value="admin"
              checked={userType === "admin"}
              onChange={() => setUserType("admin")}
            />
            Admin
          </label> */}
          <label>
            <input
              type="radio"
              name="userType"
              value="employee"
              checked={userType === "employee"}
              onChange={() => setUserType("employee")}
            />
            Employee
          </label>
        </div>

        {/* Email */}
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Password */}
        <div className="form-group relative">
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            className="toggle-password-btn"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <button type="submit" className="login-button">
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;
