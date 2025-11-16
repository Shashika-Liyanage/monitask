// AdminProfileManage.jsx
import React, { useRef, useState, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import "./adminProfileM.css";
import { useNavigate, useParams } from "react-router-dom";
import { getDatabase, ref, get, remove, set } from "firebase/database";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import app from "../../../Service/FirebaseConfig";

const Toast = ({ message, type = "success", onClose }) => {
  React.useEffect(() => {
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

  // Validate email format
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate phone number (Sri Lanka: 10 digits starting with 0)
const validatePhone = (phone) => {
  const regex = /^0\d{9}$/;
  return regex.test(phone);
};

// Validate password (at least 8 characters, 1 letter, 1 number, 1 special char)
const validatePassword = (password) => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};


  return (
    <div style={wrapper}>
      <div style={messageStyle}>{message}</div>
    </div>
  );
};

const AdminProfileManage = () => {
  const { firebaseId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState({});
  const [formData, setFormData] = useState({});
  const [isModified, setIsModified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const db = getDatabase(app);
  const auth = getAuth(app);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const showToast = (message, type = "success") => setToast({ show: true, message, type });
  const hideToast = () => setToast({ show: false, message: "", type: "success" });

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const dbRef = ref(db, "createEmployee/newEmployee");
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.entries(data).map(([key, value]) => ({
          firebaseId: key,
          ...value,
        }));
        setEmployees(formattedData);
      } else {
        setEmployees([]);
        console.error("No data available");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      showToast("Failed to fetch employee data", "error");
    }
  };

  const updateRecord = async (firebaseId) => {
    try {
      if (!firebaseId) throw new Error("Invalid firebaseId");

      const { memberID, fullname, dOJ, department, rols, phoneNumber, address, email } = formData;
      if (!memberID || !fullname || !dOJ || !department || !rols || !phoneNumber) {
        showToast("Please fill required fields before update", "error");
        return;
      }

      const recordRef = ref(db, `createEmployee/newEmployee/${firebaseId}`);
      await set(recordRef, {
        memberID,
        fullname,
        dOJ,
        department,
        rols,
        phoneNumber,
        address: address || "",
        email: email || "",
        firebaseId,
        updatedAt: new Date().toISOString(),
      });

      showToast("Record updated Successfully");
      fetchData();
    } catch (error) {
      console.error("Error updating record:", error);
      showToast("Failed to update record", "error");
    }
  };

  const deleteRecord = async (firebaseId) => {
    try {
      if (!firebaseId) throw new Error("Invalid firebaseId");

      const recordRef = ref(db, `createEmployee/newEmployee/${firebaseId}`);
      await remove(recordRef);
      showToast("Employee Deleted Successfully", "success");
      fetchData();
    } catch (error) {
      console.error("Error deleting record:", error);
      showToast("Failed to delete record", "error");
    }
  };

  const handleAddEmployeeClick = () => navigate("/adminProfileadd");

  const openUpdateModal = (employee, idx) => {
    const empObj = {
      ...employee,
      key: idx,
      firebaseId: employee.firebaseId,
      memberID: employee.memberID,
      fullname: employee.fullname,
      department: employee.department,
      rols: employee.rols,
      phoneNumber: employee.phoneNumber,
      dOJ: employee.dOJ,
      address: employee.address,
      email: employee.email,
    };
    setSelectedEmployee(empObj);
    setFormData(empObj);
    setIsModified(false);
    setShowModal(true);
  };

  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      deleteRecord(employeeToDelete.firebaseId);
    }
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const fieldName = name === "id" ? "memberID" : name;
    const updated = { ...formData, [fieldName]: value };
    setFormData(updated);
    const modified = Object.keys(updated).some((key) => updated[key] !== (selectedEmployee[key] ?? ""));
    setIsModified(modified);
  };

  const handleSendPasswordReset = async (email) => {
    if (!email) {
      showToast("Employee email not available", "error");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent to employee", "success");
    } catch (err) {
      console.error("Error sending password reset:", err);
      showToast("Failed to send password reset email", "error");
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedEmployee({});
    setFormData({});
    setIsModified(false);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    updateRecord(formData.firebaseId);
    setShowModal(false);
    setIsModified(false);
  };

  return (
    <AdminLayout>
      <div className="admin-employee-container">
        <div className="profile-header">
          <h2>All Employees</h2>
          <button className="add-employee-button" onClick={handleAddEmployeeClick}>+ Add New Employee</button>
        </div>

        <div className="filters">
          <select className="department-filter">
            <option value="">Department</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Finance">Finance</option>
          </select>
          <input type="text" placeholder="Search" className="search-input" />
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, idx) => (
                <tr key={emp.firebaseId || idx}>
                  <td>{emp.memberID}</td>
                  <td>{emp.fullname}</td>
                  <td>{emp.department}</td>
                  <td>{emp.rols}</td>
                  <td>
                    <button className="action-btn" onClick={() => openUpdateModal(emp, idx)}>
                      <SystemUpdateAltRoundedIcon style={{ fontSize: 12, marginRight: 5 }} /> Update
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteClick(emp)}>
                      <DeleteRoundedIcon style={{ fontSize: 12, marginRight: 5 }} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* UPDATE MODAL */}
        {showModal && (
          <div className="edit-modal scrollable-modal">
            <div className="modal-content large">
              <h3>Update Employee</h3>

              <form className="admin-member-form two-column-form" onSubmit={handleUpdateSubmit}>
                <div className="form-columns">
                  {/* Left Column: Member Details */}
                  <div className="admin-details-section">
                    <fieldset>
                      <legend>Member Details</legend>
                      <div className="admin-form-row">
                        <label>Member ID<span>*</span></label>
                        <input type="text" name="id" value={formData.memberID || ""} onChange={handleInputChange} readOnly disabled />
                      </div>
                      <div className="admin-form-row">
                        <label>Full Name<span>*</span></label>
                        <input type="text" name="fullname" value={formData.fullname || ""} onChange={handleInputChange} />
                      </div>
                      <div className="admin-form-row">
                        <label>Address<span>*</span></label>
                        <input type="text" name="address" value={formData.address || ""} onChange={handleInputChange} />
                      </div>
                      <div className="admin-form-row">
                        <label>Phone<span>*</span></label>
                        <input type="tel" name="phoneNumber" value={formData.phoneNumber || ""} onChange={handleInputChange} />
                      </div>
                      <div className="admin-form-row">
                        <label>Email<span>*</span></label>
                        <input type="email" name="email" value={formData.email || ""} onChange={handleInputChange} disabled />
                      </div>
                      <div className="admin-form-row">
                        <label>Change Password</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button type="button" className="admin-upload-btn" onClick={() => handleSendPasswordReset(formData.email)}>
                            Send Password Reset Email
                          </button>
                          <small style={{ alignSelf: "center" }}>Sends reset link to the employee's email.</small>
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  {/* Right Column: Role Details */}
                  <div className="admin-details-section">
                    <fieldset>
                      <legend>Role Details</legend>
                      <div className="admin-form-row">
                        <label>Role<span>*</span></label>
                        <input type="text" name="rols" value={formData.rols || ""} onChange={handleInputChange} />
                      </div>
                      <div className="admin-form-row">
                        <label>Department<span>*</span></label>
                        <input type="text" name="department" value={formData.department || ""} onChange={handleInputChange} />
                      </div>
                      <div className="admin-form-row">
                        <label>Join Date<span>*</span></label>
                        <input type="date" name="dOJ" value={formData.dOJ || ""} onChange={handleInputChange} />
                      </div>
                    </fieldset>
                  </div>
                </div>

                {/* Buttons Below */}
                <div className="admin-button-group">
                  {isModified && (
                    <button onClick={() => updateRecord(formData.firebaseId)} type="submit" className="admin-submit-btn">Update</button>
                  )}
                  <button type="button" className="admin-cancel-btn" onClick={handleModalClose}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRM */}
        {showDeleteConfirm && employeeToDelete && (
          <div className="edit-modal">
            <div className="modal-content">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete <strong>{employeeToDelete.fullname} ({employeeToDelete.memberID})</strong>?</p>
              <div className="admin-button-group" style={{ justifyContent: "center" }}>
                <button className="action-btn delete" onClick={confirmDelete} style={{ marginRight: 10 }}>Yes</button>
                <button className="action-btn" onClick={cancelDelete}>No</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast.show && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      </div>
    </AdminLayout>
  );
};

export default AdminProfileManage;
