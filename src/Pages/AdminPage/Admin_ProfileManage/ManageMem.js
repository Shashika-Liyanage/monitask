import React, { useRef, useState, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import Person3SharpIcon from '@mui/icons-material/Person3Sharp';
import EditSharpIcon from '@mui/icons-material/EditSharp';
import "./ManageMem.css";
import bcrypt from "bcryptjs";
import toast, { Toaster } from "react-hot-toast";
import {
  getDatabase,
  ref,
  push,
  set,
  get
} from "firebase/database";
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
  const [inputPassword, setInputPassword] = useState("");
  const [inputRole, setInputRole] = useState("");
  const [inputDepartment, setInputDepartment] = useState("");
  const [inputDoj, setInputDoj] = useState("");

  const [memberID, setMemberID] = useState("Generating...");

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
    setInputPassword(newPassword);
    toast.success("Password updated");
    setShowPasswordModal(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const resetForm = () => {
    setInputFullName("");
    setInputAddress("");
    setInputPhoneNumber("");
    setInputEmail("");
    setInputPassword("");
    generateMemberID();
    setInputDepartment("");
    setInputRole("");
    setInputDoj("");
  };

  // ✅ Generate a unique member ID like MEM001
  const generateMemberID = async () => {
    const db = getDatabase(app);
    const dbRef = ref(db, "createEmployee/newEmployee");
    try {
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
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
if (!inputFullName ||
    !inputAddress ||
    !inputPhoneNumber ||
    !inputEmail ||
    !inputPassword ||
    !inputRole ||
    !inputDepartment||
    !inputDoj
  ) 
    
    {
      toast.error("Please fill in all required fields");
      return;
  
}
    const db = getDatabase(app);
    const recordsRef = ref(db, "createEmployee/newEmployee/");
    try {
      const newRecordRef = push(recordsRef);
      const hashedPassword = await bcrypt.hash(inputPassword, 10);
      await set(newRecordRef, {
        memberID: memberID,
        fullname: inputFullName,
        address: inputAddress,
        phoneNumber: inputPhoneNumber,
        email: inputEmail,
        password: hashedPassword,
        rols:inputRole,
        department:inputDepartment,
        dOJ:inputDoj
      });

      toast.success("Record saved successfully!");
      setTimeout(() => resetForm(), 1000);
    } catch (error) {
      console.error("Error adding record:", error);
      toast.error("Failed to save record");
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
              <label>Upload Photo<span>*</span></label>
              <button type="button" className="admin-upload-btn" onClick={handleEditClick}>
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
                <label>Member ID<span>*</span></label>
                <input required  type="text" value={memberID} disabled />
              </div>

              <div className="admin-form-row">
                <label>Full Name<span>*</span></label>
                <input required value={inputFullName} onChange={(e) => setInputFullName(e.target.value)} type="text" />
              </div>

              <div className="admin-form-row">
                <label>Address<span>*</span></label>
                <input required value={inputAddress} onChange={(e) => setInputAddress(e.target.value)} type="text" />
              </div>

              <div className="admin-form-row">
                <label>Phone<span>*</span></label>
                <input required value={inputPhoneNumber} onChange={(e) => setInputPhoneNumber(e.target.value)} type="tel" />
              </div>

              <div className="admin-form-row">
                <label>Email<span>*</span></label>
                <input required value={inputEmail} onChange={(e) => setInputEmail(e.target.value)} type="email" />
              </div>

              <div className="admin-form-row">
                <label>Password</label>
                <input required
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
       <select
            value={inputRole}
            onChange={(e) => setInputRole(e.target.value)}
            required
          >
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Employee">Employee</option>
            <option value="Intern">Intern</option>
          </select>
              </div>

              <div className="admin-form-row">
                <label>Department<span>*</span></label>
           <select
            value={inputDepartment}
            onChange={(e) => setInputDepartment(e.target.value)}
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
                <label>Join Date<span>*</span></label>
                <input required value={inputDoj} onChange={(e) => setInputDoj(e.target.value)} type="date" />
              </div>
            </fieldset>
          </div>

          {/* Buttons */}
          <div className="admin-button-group">
            <button type="button" className="admin-submit-btn" onClick={addRecord}>Add</button>
            <button type="button" className="admin-cancel-btn" onClick={resetForm}>Cancel</button>
          </div>
        </form>

        {/* Password Modal */}
        {showPasswordModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-box">
              <h3>Change Password</h3>

              <label>New Password<span>*</span></label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

              <label>Confirm Password<span>*</span></label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />

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
