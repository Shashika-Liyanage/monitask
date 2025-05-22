import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Logins/login";
import Register from "./Register/Register";
import Header from "./Header/Header";
import "./App.css";
//             return;

function App() {
  return (
    <Router>

      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<div>About</div>} />
        <Route path="/contact" element={<div>Contact</div>} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<div>Forgot Password</div>} />
      </Routes>
    </Router>
  );
}

export default App;
