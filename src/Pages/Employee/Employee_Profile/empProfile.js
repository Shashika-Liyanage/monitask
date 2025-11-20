import React, { useRef, useState, useEffect, useCallback } from "react";
import EmployeeLayout from "../../../Layout/Employee_Layout/EmployeeL";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import app from "../../../Service/FirebaseConfig";
import "./empProfile.css";

function EmployeeProfile() {
  const fileInputRef = useRef(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const auth = getAuth(app);
  const db = getDatabase(app);

  // Show Toast - Wrapped in useCallback for dependency array stability
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 5000);
  }, []);

  // Fetch logged-in employee data
  useEffect(() => {
    const fetchEmployeeData = async (user) => {
      try {
        const employeeRef = ref(db, `createEmployee/newEmployee/${user.uid}`);
        const snapshot = await get(employeeRef);

        if (snapshot.exists()) {
          setEmployeeData(snapshot.val());
        } else {
          showToast("Employee data not found in database", "error");
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
        showToast("Failed to fetch employee data", "error");
      }
    };

    // Only fetch after user is authenticated
    // The listener correctly handles initial state and state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchEmployeeData(user);
      } else {
        setEmployeeData(null); // Clear data if user logs out
        // Optional: showToast("No logged-in user found", "error");
      }
    });

    // Cleanup: unsubscribe when the component unmounts
    return () => unsubscribe();
  }, [auth, db, showToast]); // Added 'db' and 'showToast' to dependencies

  // Handle File Upload (Profile Picture)
  const handleEditClick = () => {
    fileInputRef.current.click();
  };

  // Handle Password Reset Email
  const handlePasswordReset = async () => {
    if (!employeeData?.email) {
      showToast("Email not available", "error");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, employeeData.email);
      showToast("Password reset email sent to your email", "success");
    } catch (err) {
      console.error("Error sending password reset:", err);
      // Firebase errors often have a code like 'auth/user-not-found'. You might check 'err.code'
      showToast("Failed to send password reset email", "error");
    }
  };

  if (!employeeData) return <p>Loading profile...</p>;

  return (
    <EmployeeLayout>
      <div className="employee-profile">
        {/* Placeholder for Profile Picture logic (can be added here) */}
        {/*
        <div className="profile-picture-container">
          <img src={employeeData.profilePictureUrl || 'default_url'} alt={`${employeeData.fullname}'s profile picture`} />
          <button type="button" onClick={handleEditClick}>Edit</button>
        </div>
        */}
        <form className="profile-form">
          {/* Personal Details */}
          <div className="details-section">
            <fieldset>
              <legend>Personal Details</legend>

              <div className="form-row">
                <label>Employee ID<span>*</span></label>
                <input type="text" value={employeeData.memberID || ''} readOnly />
              </div>

              <div className="form-row">
                <label>Full Name<span>*</span></label>
                <input type="text" value={employeeData.fullname || ''} readOnly />
              </div>

              <div className="form-row">
                <label>Address<span>*</span></label>
                <input type="text" value={employeeData.address || ''} readOnly />
              </div>

              <div className="form-row">
                <label>Telephone Number<span>*</span></label>
                <input type="tel" value={employeeData.phoneNumber || ''} readOnly />
              </div>

              <div className="form-row">
                <label>Email<span>*</span></label>
                <input type="email" value={employeeData.email || ''} readOnly />
              </div>

              {/* Password Reset */}
              <div className="form-row">
                <label>Password</label>
                <button type="button" className="admin-upload-btn" onClick={handlePasswordReset}>
                  Change / Reset Password
                </button>
                <small style={{ marginLeft: 10 }}>
                  A reset link will be sent to your registered email.
                </small>
              </div>
            </fieldset>
          </div>

          {/* Company Details */}
          <div className="details-section">
            <fieldset>
              <legend>Company Details</legend>

              <div className="form-row">
                <label>Department<span>*</span></label>
                <input type="text" value={employeeData.department || ''} readOnly />
              </div>

              <div className="form-row">
                <label>Designation<span>*</span></label>
                <input type="text" value={employeeData.rols || ''} readOnly />
              </div>

              {/* FIX: Ensure dOJ is in YYYY-MM-DD format for type="date" input */}
              <div className="form-row">
                <label>Joining Date<span>*</span></label>
                <input 
                  type="date" 
                  value={employeeData.dOJ || ''} 
                  readOnly 
                />
              </div>
            </fieldset>
          </div>

          <div className="submit-btn">
            <button type="button" onClick={() => showToast("Profile OK clicked")}>
              OK
            </button>
          </div>
        </form>

        <input type="file" ref={fileInputRef} style={{ display: "none" }} />

        {toast.show && (
          <div
            style={{
              position: "fixed",
              bottom: 30,
              left: "50%",
              transform: "translateX(-50%)",
              padding: "12px 20px",
              background: toast.type === "error" ? "#d32f2f" : "#2e7d32",
              color: "#fff",
              borderRadius: 10,
              fontWeight: 600,
              zIndex: 9999,
            }}
          >
            {toast.message}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

export default EmployeeProfile;