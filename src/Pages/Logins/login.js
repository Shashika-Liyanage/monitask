import React, { useState } from "react";
import "./Login.css"; // Your CSS for login
import { Eye, EyeOff } from "lucide-react";
import { auth } from "../../Service/FirebaseConfig"; 
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

 const handleLogin = async (e) => {
  e.preventDefault();
  try {
    // Firebase login
    await signInWithEmailAndPassword(auth, email, password);

    // Success toast
    toast.success("Login Successful!");

    // Redirect after short delay
    setTimeout(() => {
      navigate("/employeeDash");
    }, 500);

  } catch (err) {
    console.error(err);

    // Show friendly error messages
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

        <div className="form-group relative">
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="toggle-password-btn"
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
