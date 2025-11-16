import React, { useRef, useState, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import "./ManageMem.css";
import { getDatabase, ref, set, get } from "firebase/database";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import app from "../../../Service/FirebaseConfig";

const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const t = setTimeout(() => onClose(), 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === "error" ? "#d32f2f" : "#2e7d32";
  const border = type === "error" ? "1px solid #b71c1c" : "1px solid #145a2a";

  const wrapper = {
    position: "fixed",
    bottom: 30,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const messageStyle = {
    minWidth: 280,
    maxWidth: 720,
    padding: "12px 20px",
    color: "#fff",
    fontWeight: 600,
    textAlign: "center",
    borderRadius: 10,
    background: bg,
    border,
    boxShadow: "0 8px 24px rgba(12,40,82,0.12)",
  };

  return (
    <div style={wrapper}>
      <div style={messageStyle}>{message}</div>
    </div>
  );
};

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhone = (phone) => /^0\d{9}$/.test(phone);
const validatePassword = (password) => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

function MemberAdd() {
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
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const auth = getAuth(app);
  const db = getDatabase(app);

  const showToast = (message, type = "success") => setToast({ show: true, message, type });
  const hideToast = () => setToast({ show: false, message: "", type: "success" });

  const handlePasswordClick = (e) => {
    e.preventDefault();
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = () => {
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (!validatePassword(newPassword)) {
      showToast("Password must be 8+ characters, include number & special character", "error");
      return;
    }
    showToast("Password ready for creation", "success");
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
      showToast("Failed to generate Member ID", "error");
    }
  };

  useEffect(() => {
    generateMemberID();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addRecord = async (e) => {
    e.preventDefault();

    if (
      !inputFullName ||
      !inputAddress ||
      !inputPhoneNumber ||
      !inputEmail ||
      !newPassword ||
      !inputRole ||
      !inputDepartment ||
      !inputDoj
    ) {
      showToast("Please fill in all required fields and set a password", "error");
      return;
    }

    if (!validateEmail(inputEmail)) {
      showToast("Invalid email format", "error");
      return;
    }

    if (!validatePhone(inputPhoneNumber)) {
      showToast("Invalid phone number (10 digits, starting with 0)", "error");
      return;
    }

    if (!validatePassword(newPassword)) {
      showToast("Password must be 8+ characters, include number & special character", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, inputEmail, newPassword);
      const uid = userCredential.user.uid;

      const userRef = ref(db, `createEmployee/newEmployee/${uid}`);
      await set(userRef, {
        firebaseId: uid,
        memberID: memberID,
        fullname: inputFullName,
        address: inputAddress,
        phoneNumber: inputPhoneNumber,
        email: inputEmail,
        rols: inputRole,
        department: inputDepartment,
        dOJ: inputDoj,
        createdAt: new Date().toISOString(),
      });

      showToast("Employee created successfully", "success");
      resetForm();
    } catch (error) {
      console.error("Error adding record:", error);
      showToast(error?.message || "Failed to create employee", "error");
    }
  };

  return (
    <AdminLayout>
      <div className="admin-member-profile">
        <form className="admin-member-form" onSubmit={addRecord}>
          <div className="admin-details-section">
            <fieldset>
              <legend>Member Details</legend>

              <div className="admin-form-row">
                <label>Member ID<span>*</span></label>
                <input required type="text" value={memberID} disabled />
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
                <label>Password<span>*</span></label>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="admin-upload-btn" onClick={handlePasswordClick}>
                    Set Password
                  </button>
                  <small style={{ alignSelf: "center" }}>Click to set password for new user</small>
                </div>
              </div>
            </fieldset>
          </div>

          <div className="admin-details-section">
            <fieldset>
              <legend>Role Details</legend>

              <div className="admin-form-row">
                <label>Role<span>*</span></label>
                <select value={inputRole} onChange={(e) => setInputRole(e.target.value)} required>
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div className="admin-form-row">
                <label>Department<span>*</span></label>
                <select value={inputDepartment} onChange={(e) => setInputDepartment(e.target.value)} required>
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

          <div className="admin-button-group">
            <button type="submit" className="admin-submit-btn">Add</button>
            <button type="button" className="admin-cancel-btn" onClick={resetForm}>Cancel</button>
          </div>
        </form>

        {showPasswordModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-box">
              <h3>Set Password for New User</h3>
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

        {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </AdminLayout>
  );
}

export default MemberAdd;
