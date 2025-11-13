import React, { useEffect, useState } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { signOut } from "firebase/auth";
import { auth, database } from "../Service/FirebaseConfig";
import { useNavigate } from "react-router-dom";
import { ref, get } from "firebase/database";
import "./Header.css";

function EmployeeHeaderView({ onToggleSidebar }) {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState("");
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  // Fetch logged-in employee name
  useEffect(() => {
    const fetchEmployeeName = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const dbRef = ref(database, `createEmployee/newEmployee/${user.uid}`);
          const snapshot = await get(dbRef);
          if (snapshot.exists()) {
            setEmployeeName(snapshot.val().fullname || "");
          }
        } catch (err) {
          console.error("Error fetching employee name:", err);
        }
      }
    };
    fetchEmployeeName();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);          
      navigate("/");                
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="main-header">
      <div className="header-left">
        {/* Hamburger (mobile only) */}
        <button className="menu-button" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          &#9776;
        </button>
        <span className="logo-text">Monitask</span>
      </div>

      <div className="header-right">
        {/* Logged-in employee name with profile icon */}
        {employeeName && (
          <div className="employee-info">
            <Person4RoundedIcon className="header-icon" />
            <span className="employee-name">{employeeName}</span>
          </div>
        )}

        {/* Notification bell */}
        <NotificationsIcon className="header-icon" titleAccess="Notifications" />

        {/* Existing logout icon */}
        <LogoutIcon
          onClick={() => setShowLogoutPopup(true)}
          titleAccess="Log Out"
          className="header-icon"
        />

        {/* Logout confirmation popup */}
        {showLogoutPopup && (
          <div className="logout-popup">
            <p>Do you want to logout?</p>
            <div className="popup-buttons">
              <button onClick={handleLogout}>Yes</button>
              <button onClick={() => setShowLogoutPopup(false)}>No</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeHeaderView;
