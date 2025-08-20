import React from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';
import { signOut } from "firebase/auth";
import { auth } from "../Service/FirebaseConfig";
import { useNavigate } from "react-router-dom";
function EmployeeHeaderView({ onToggleSidebar }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);          // Sign out from Firebase
      navigate("/");                // Redirect to login page
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };
  return (
    <div className="employee-header-container">
      {/* Hamburger (mobile only) */}
      <button className="hamburger-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar">
        &#9776;
      </button>

      <h1 className="header-title">Monitask</h1>

      {/* Icons on the right */}
      <div className="header-icons-row">
        <LogoutIcon onClick={handleLogout} titleAccess='Log Out' className="header-icon" />
        <Person4RoundedIcon className="header-icon" />
      </div>
    </div>
  );
}

export default EmployeeHeaderView;
