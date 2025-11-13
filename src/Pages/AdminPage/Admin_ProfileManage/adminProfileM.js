import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import Person3SharpIcon from "@mui/icons-material/Person3Sharp";
import EditSharpIcon from "@mui/icons-material/EditSharp";
import "./adminProfileM.css";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getDatabase, ref, get, remove, set } from "firebase/database";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import app from "../../../Service/FirebaseConfig";

const AdminProfileManage = () => {
  const { firebaseId } = useParams();
  const fileInputRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState({});
  const [formData, setFormData] = useState({});
  const [isModified, setIsModified] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  // fetch the data and show via the table
  const [employees, setEmployees] = useState([]);
  const db = getDatabase(app);
  const auth = getAuth(app);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const dbRef = ref(db, "createEmployee/newEmployee");
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        // data keys are user UIDs (because MemberAdd stores under uid)
        const formattedData = Object.entries(data).map(([key, value]) => ({
          firebaseId: key, // UID
          ...value,
        }));
        setEmployees(formattedData);
      } else {
        setEmployees([]);
        console.error("No data available");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const updateRecord = async (firebaseId) => {
    try {
      if (!firebaseId) throw new Error("Invalid firebaseId");

      const { memberID, fullname, dOJ, department, rols, phoneNumber, address, email } = formData;
      if (!memberID || !fullname || !dOJ || !department || !rols || !phoneNumber) {
        toast.error("Please fill required fields before update");
        return;
      }

      const recordRef = ref(db, `createEmployee/newEmployee/${firebaseId}`);
      // Note: this updates DB only. Updating Firebase Auth email/password requires admin privileges.
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

      toast.success("Record updated (database). Auth account not modified here.");
      fetchData();
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    }
  };

  const deleteRecord = async (firebaseId) => {
    try {
      if (!firebaseId) {
        throw new Error("Invalid firebaseId");
      }

      const recordRef = ref(db, `createEmployee/newEmployee/${firebaseId}`);
      await remove(recordRef);
      toast.success("Database record deleted. To delete Auth user, use Admin SDK/Cloud Function.");
      fetchData();
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleAddEmployeeClick = () => {
    navigate("/adminProfileadd");
  };

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

  // state declarations for confirm-delete UI
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // handler
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

    // some inputs use different name keys in your JSX; handle legacy "id" vs "memberID"
    const fieldName = name === "id" ? "memberID" : name;

    const updated = { ...formData, [fieldName]: value };
    setFormData(updated);

    const modified = Object.keys(updated).some(
      (key) => updated[key] !== (selectedEmployee[key] ?? "")
    );
    setIsModified(modified);
  };

  const handleEditClick = () => {
    fileInputRef.current.click();
  };

  // sends password reset email to employee so they can set their own password
  const handleSendPasswordReset = async (email) => {
    if (!email) {
      toast.error("Employee email not available");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent to employee");
    } catch (err) {
      console.error("Error sending password reset:", err);
      toast.error("Failed to send password reset email");
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
    // If you want to update both DB and optionally trigger reset email:
    updateRecord(formData.firebaseId);
    setShowModal(false);
    setIsModified(false);
  };

  return (
    <AdminLayout>
      <Toaster />
      <div className="admin-employee-container">
        <div className="profile-header">
          <h2>All Employees</h2>
          <button className="add-employee-button" onClick={handleAddEmployeeClick}>
            + Add New Employee
          </button>
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
                      <SystemUpdateAltRoundedIcon style={{ fontSize: 12, marginRight: 5 }} />
                      Update
                    </button>
                    <button className="action-btn delete" onClick={() => handleDeleteClick(emp)}>
                      <DeleteRoundedIcon style={{ fontSize: 12, marginRight: 5 }} />
                      Delete
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

              {/* Upload Photo */}
              <div className="upload-photo-section">
                <div className="admin-photo-box">
                  <Person3SharpIcon className="admin-person-icon" />
                </div>
                <div className="admin-upload-controls">
                  <label>
                    Upload Photo<span>*</span>
                  </label>
                  <button type="button" className="admin-upload-btn" onClick={handleEditClick}>
                    <EditSharpIcon className="admin-edit-icon" /> Choose File
                  </button>
                  <input type="file" ref={fileInputRef} style={{ display: "none" }} />
                </div>
              </div>

              <form className="admin-member-form two-column-form" onSubmit={handleUpdateSubmit}>
                <div className="form-columns">
                  {/* Left Column: Member Details */}
                  <div className="admin-details-section">
                    <fieldset>
                      <legend>Member Details</legend>
                      <div className="admin-form-row">
                        <label>
                          Member ID<span>*</span>
                        </label>
                        <input
                          type="text"
                          name="id"
                          value={formData.memberID || ""}
                          onChange={handleInputChange}
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="admin-form-row">
                        <label>
                          Full Name<span>*</span>
                        </label>
                        <input
                          type="text"
                          name="fullname"
                          value={formData.fullname || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="admin-form-row">
                        <label>
                          Address<span>*</span>
                        </label>
                        <input
                          type="text"
                          name="address"
                          value={formData.address || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="admin-form-row">
                        <label>
                          Phone<span>*</span>
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="admin-form-row">
                        <label>
                          Email<span>*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email || ""}
                          onChange={handleInputChange}
                          disabled
                        />
                      </div>
                      <div className="admin-form-row">
                        <label>Change Password</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className="admin-upload-btn"
                            onClick={() => handleSendPasswordReset(formData.email)}
                          >
                            Send Password Reset Email
                          </button>
                          <small style={{ alignSelf: "center" }}>
                            Sends reset link to the employee's email.
                          </small>
                        </div>
                      </div>
                    </fieldset>
                  </div>

                  {/* Right Column: Role Details */}
                  <div className="admin-details-section">
                    <fieldset>
                      <legend>Role Details</legend>
                      <div className="admin-form-row">
                        <label>
                          Role<span>*</span>
                        </label>
                        <input
                          type="text"
                          name="rols"
                          value={formData.rols || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="admin-form-row">
                        <label>
                          Department<span>*</span>
                        </label>
                        <input
                          type="text"
                          name="department"
                          value={formData.department || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="admin-form-row">
                        <label>
                          Join Date<span>*</span>
                        </label>
                        <input
                          type="date"
                          name="dOJ"
                          value={formData.dOJ || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    </fieldset>
                  </div>
                </div>

                {/* Buttons Below */}
                <div className="admin-button-group">
                  {isModified && (
                    <button
                      onClick={() => updateRecord(formData.firebaseId)}
                      type="submit"
                      className="admin-submit-btn"
                    >
                      Update
                    </button>
                  )}
                  <button type="button" className="admin-cancel-btn" onClick={handleModalClose}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="edit-modal">
            <div className="modal-content">
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete <strong>{employeeToDelete?.fullname}</strong>?
              </p>
              <div className="admin-button-group" style={{ justifyContent: "center" }}>
                <button
                  className="action-btn delete"
                  onClick={confirmDelete}
                  style={{ marginRight: 10 }}
                >
                  Yes
                </button>
                <button className="action-btn" onClick={cancelDelete}>
                  No
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProfileManage;
