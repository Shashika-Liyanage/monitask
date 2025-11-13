import React, { useRef, useState, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import Person3SharpIcon from "@mui/icons-material/Person3Sharp";
import EditSharpIcon from "@mui/icons-material/EditSharp";
import "./ManageMem.css";
import toast, { Toaster } from "react-hot-toast";
import {
  getDatabase,
  ref,
  set,
  get
} from "firebase/database";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import app from "../../../Service/FirebaseConfig";

function MemberAdd() {
  const fileInputRef = useRef(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inputFullName, setInputFullName] = useState("");
  const [inputAddress, setInputAddress] = useState("");
  const [inputPhoneNumber, setInputPhoneNumber] = useState("");
  const [inputEmail, setInputEmail] = useState("");
  const [inputRole, setInputRole] = useState("");
  const [inputDepartment, setInputDepartment] = useState("");
  const [inputDoj, setInputDoj] = useState("");

  const [memberID, setMemberID] = useState("Generating...");

  const auth = getAuth(app);
  const db = getDatabase(app);

  const handleEditClick = () => fileInputRef.current.click();
  const handlePasswordClick = (e) => {
    e.preventDefault();
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    // Just set the password locally so admin can submit; we don't store it in DB
    // It will be used on create user
    toast.success("Password ready for creation");
    setShowPasswordModal(false);
  };

  const resetForm = () => {
    setInputFullName("");
    setInputAddress("");
    setInputPhoneNumber("");
    setInputEmail("");
    setNewPassword("");
    setConfirmPassword("");
    generateMemberID();
    setInputDepartment("");
    setInputRole("");
    setInputDoj("");
  };

  // Generate a unique member ID like EMP001
  const generateMemberID = async () => {
    const dbRef = ref(db, "createEmployee/newEmployee");
    try {
      const snapshot = await get(dbRef);
      if (snapshot.exists() && typeof snapshot.val() === "object") {
        const count = Object.keys(snapshot.val()).length + 1;
        const newID = `EMP${count.toString().padStart(3, "0")}`;
        setMemberID(newID);
      } else {
        setMemberID("EMP001");
      }
    } catch (error) {
      console.error("Error generating Member ID:", error);
      setMemberID("EMP_ERR");
      toast.error("Failed to generate Member ID");
    }
  };

  useEffect(() => {
    generateMemberID();
  }, []);

  const addRecord = async (e) => {
    e.preventDefault();

    if (
      !inputFullName ||
      !inputAddress ||
      !inputPhoneNumber ||
      !inputEmail ||
      !newPassword || // use the modal password
      !inputRole ||
      !inputDepartment ||
      !inputDoj
    ) {
      toast.error("Please fill in all required fields and set a password");
      return;
    }

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        inputEmail,
        newPassword
      );
      const uid = userCredential.user.uid;

      // Save record in RTDB at /createEmployee/newEmployee/{uid}
      const userRef = ref(db, `createEmployee/newEmployee/${uid}`);
      await set(userRef, {
        firebaseId: uid,
        memberID: memberID,
        fullname: inputFullName,
        address: inputAddress,
        phoneNumber: inputPhoneNumber,
        email: inputEmail,
        // password intentionally not saved in DB (Auth stores it)
        rols: inputRole,
        department: inputDepartment,
        dOJ: inputDoj,
        createdAt: new Date().toISOString(),
      });

      toast.success("Employee created successfully (Auth + DB).");
      resetForm();
    } catch (error) {
      console.error("Error adding record:", error);
      // Firebase Auth errors are useful to show to admin
      toast.error(error.message || "Failed to create employee");
    }
  };

  return (
    <AdminLayout>
      <Toaster />
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
              <input type="file" ref={fileInputRef} style={{ display: "none" }} />
            </div>
          </div>

          {/* Member Details */}
          <div className="admin-details-section">
            <fieldset>
              <legend>Member Details</legend>

              <div className="admin-form-row">
                <label>
                  Member ID<span>*</span>
                </label>
                <input required type="text" value={memberID} disabled />
              </div>

              <div className="admin-form-row">
                <label>
                  Full Name<span>*</span>
                </label>
                <input
                  required
                  value={inputFullName}
                  onChange={(e) => setInputFullName(e.target.value)}
                  type="text"
                />
              </div>

              <div className="admin-form-row">
                <label>
                  Address<span>*</span>
                </label>
                <input
                  required
                  value={inputAddress}
                  onChange={(e) => setInputAddress(e.target.value)}
                  type="text"
                />
              </div>

              <div className="admin-form-row">
                <label>
                  Phone<span>*</span>
                </label>
                <input
                  required
                  value={inputPhoneNumber}
                  onChange={(e) => setInputPhoneNumber(e.target.value)}
                  type="tel"
                />
              </div>

              <div className="admin-form-row">
                <label>
                  Email<span>*</span>
                </label>
                <input
                  required
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  type="email"
                />
              </div>

              <div className="admin-form-row">
                <label>Password<span>*</span></label>
                <input required
                  type="password"            
                />
              </div>
                   <div className="admin-form-row">
                <label>Re-Type Password<span>*</span></label>
                <input required
                  type="password"            
                />
              </div>
            </fieldset>
          </div>

          {/* Role Details */}
          <div className="admin-details-section">
            <fieldset>
              <legend>Role Details</legend>

              <div className="admin-form-row">
                <label>
                  Role<span>*</span>
                </label>
                <select
                  value={inputRole}
                  onChange={(e) => setInputRole(e.target.value)}
                  required
                >
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div className="admin-form-row">
                <label>
                  Department<span>*</span>
                </label>
                <select
                  value={inputDepartment}
                  onChange={(e) => setInputDepartment(e.target.value)}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Front Office">Front Office</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Kitchen">Kitchen</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div className="admin-form-row">
                <label>
                  Join Date<span>*</span>
                </label>
                <input
                  required
                  value={inputDoj}
                  onChange={(e) => setInputDoj(e.target.value)}
                  type="date"
                />
              </div>
            </fieldset>
          </div>

          {/* Buttons */}
          <div className="admin-button-group">
            <button type="button" className="admin-submit-btn" onClick={addRecord}>
              Add
            </button>
            <button type="button" className="admin-cancel-btn" onClick={resetForm}>
              Cancel
            </button>
          </div>
        </form>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-box">
              <h3>Set Password for New User</h3>
              <label>
                New Password<span>*</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <label>
                Confirm Password<span>*</span>
              </label>
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
