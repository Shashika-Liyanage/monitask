import React, { useRef, useState } from "react";
import EmployeeLayout from "../../../Layout/Employee_Layout/EmployeeL";
import Person3SharpIcon from '@mui/icons-material/Person3Sharp';
import EditSharpIcon from '@mui/icons-material/EditSharp';
import "./empProfile.css";

function EmployeeProfile() {
  const fileInputRef = useRef(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");


  const handleEditClick = () => {
    fileInputRef.current.click();
  };
   const handlePasswordClick = (e) => {
    e.preventDefault();
    setShowPasswordModal(true);
  };

    const handlePasswordSubmit = () => {
    // Here you could validate and send new passwords to backend
    console.log("New:", newPassword, "Confirm:", confirmPassword);
    setShowPasswordModal(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <EmployeeLayout>
      <div className="employee-profile">
        <form className="profile-form">
          {/* Upload Photo */}
          <div className="upload-section">
            <div className="photo-box">
              <Person3SharpIcon className="person-icon" />
            </div>
            <div className="upload-controls">
              <label>
                Upload Photo<span>*</span>
              </label>
              <button
                type="button"
                className="upload-btn"
                onClick={handleEditClick}
              >
                <EditSharpIcon className="edit-icon" /> Choose File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Personal Details */}
          <div className="details-section">
            <fieldset>
              <legend>Personal Details</legend>

              <div className="form-row">
                <label>Employee ID<span>*</span></label>
                <input type="text" />
              </div>

              <div className="form-row">
                <label>Full Name<span>*</span></label>
                <input type="text" />
              </div>

              <div className="form-row">
                <label>Address<span>*</span></label>
                <input type="text" />
              </div>

              <div className="form-row">
                <label>Tel<span>*</span></label>
                <input type="tel" />
              </div>

              <div className="form-row">
                <label>Email<span>*</span></label>
                <input type="email" />
              </div>

               <div className="form-row">
                <label>Change Password</label>
                <input
                  type="password"
                  placeholder="Click to change"
                  readOnly
                  onClick={handlePasswordClick}
                />
              </div>
            </fieldset>
          </div>

          {/* Company Details */}
          <div className="details-section">
            <fieldset>
              <legend>Company Details</legend>

              <div className="form-row">
                <label>Department<span>*</span></label>
                <input type="text" />
              </div>

              <div className="form-row">
                <label>Designation<span>*</span></label>
                <input type="text" />
              </div>

              <div className="form-row">
                <label>Joining Date<span>*</span></label>
                <input type="date" />
              </div>
            </fieldset>
          </div>

          {/* Submit Button */}
          <div className="submit-btn">
            <button type="submit">OK</button>
          </div>
        </form>
          {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <h3>Change Password</h3>

              <label>New Password<span>*</span></label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <label>Confirm Password<span>*</span></label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <div className="modal-actions">
                <button onClick={handlePasswordSubmit}>OK</button>
                <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

export default EmployeeProfile;
