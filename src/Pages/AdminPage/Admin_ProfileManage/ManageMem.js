import React, { useRef, useState } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import Person3SharpIcon from '@mui/icons-material/Person3Sharp';
import EditSharpIcon from '@mui/icons-material/EditSharp';
import "./ManageMem.css";

function MemberAdd() {
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
    console.log("New:", newPassword, "Confirm:", confirmPassword);
    setShowPasswordModal(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <AdminLayout>
      <div className="admin-member-profile">
        <form className="admin-member-form">
          {/* Upload Photo */}
          <div className="admin-upload-section">
            <div className="admin-photo-box">
              <Person3SharpIcon className="admin-person-icon" />
            </div>
            <div className="admin-upload-controls">
              <label>
                Upload Photo<span>*</span>
              </label>
              <button
                type="button"
                className="admin-upload-btn"
                onClick={handleEditClick}
              >
                <EditSharpIcon className="admin-edit-icon" /> Choose File
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Member Details */}
          <div className="admin-details-section">
            <fieldset>
              <legend>Member Details</legend>

              <div className="admin-form-row">
                <label>Member ID<span>*</span></label>
                <input type="text" />
              </div>

              <div className="admin-form-row">
                <label>Full Name<span>*</span></label>
                <input type="text" />
              </div>

              <div className="admin-form-row">
                <label>Address<span>*</span></label>
                <input type="text" />
              </div>

              <div className="admin-form-row">
                <label>Phone<span>*</span></label>
                <input type="tel" />
              </div>

              <div className="admin-form-row">
                <label>Email<span>*</span></label>
                <input type="email" />
              </div>

              <div className="admin-form-row">
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

          {/* Role Details */}
          <div className="admin-details-section">
            <fieldset>
              <legend>Role Details</legend>

              <div className="admin-form-row">
                <label>Role<span>*</span></label>
                <input type="text" />
              </div>

              <div className="admin-form-row">
                <label>Department<span>*</span></label>
                <input type="text" />
              </div>

              <div className="admin-form-row">
                <label>Join Date<span>*</span></label>
                <input type="date" />
              </div>
            </fieldset>
          </div>

          {/* Submit Button */}
          {/* Action Buttons */}
<div className="admin-button-group">
  <button type="submit" className="admin-submit-btn">Add</button>
  <button type="button" className="admin-cancel-btn">Cancel</button>
</div>

        </form>

        {showPasswordModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-box">
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

              <div className="admin-modal-actions">
                <button onClick={handlePasswordSubmit}>OK</button>
                <button onClick={() => setShowPasswordModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default MemberAdd;
