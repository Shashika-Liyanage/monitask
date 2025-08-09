import React, { useState, useRef, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import SystemUpdateAltRoundedIcon from "@mui/icons-material/SystemUpdateAltRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import Person3SharpIcon from "@mui/icons-material/Person3Sharp";
import EditSharpIcon from "@mui/icons-material/EditSharp";
import "./adminProfileM.css";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { getDatabase, ref, get, remove } from "firebase/database";

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

  //fethc the data and show via the table
  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      const db = getDatabase();
      const dbRef = ref(db, "createEmployee/newEmployee");
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const formattedData = Object.entries(data).map(([key, value]) => ({
          firebaseId: key, // capture Firebase key
          ...value, // include the rest of the employee data
        }));
        setEmployees(formattedData);
      } else {
        console.error("No data available");
      }
    };

    fetchData();
  }, []);

  const deleteRecord = async (firebaseId) => {
    try {
      console.log("Attempting to delete record with Firebase ID:", firebaseId);

      const db = getDatabase();
      const recordRef = ref(db, `createEmployee/newEmployee/${firebaseId}`);

      // Check if firebaseId is null or undefined
      if (!firebaseId) {
        throw new Error("Invalid firebaseId");
      }

      // Delete the record from the database
      await remove(recordRef);
      console.log("Record deleted successfully");
      toast.success("Record deleted successfully");
      //fetchData(); // Refresh data
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };
  const handleAddEmployeeClick = () => {
    navigate("/adminProfileadd");
  };

  const openUpdateModal = (employee) => {
    const fullDetails = {
      ...employee,
      address: "123 Example St",
      phone: "0771234567",
      email: "john@example.com",
      joinDate: "2023-05-15",
    };
    setSelectedEmployee(fullDetails);
    setFormData(fullDetails);
    setIsModified(false);
    setShowModal(true);
  };
  // state declarations
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // handler
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    console.log("Delete confirmed:", employeeToDelete);
    // TODO: delete logic
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setEmployeeToDelete(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // Check if any changes are made compared to original selectedEmployee
    const modified = Object.keys(updated).some(
      (key) => updated[key] !== selectedEmployee[key]
    );
    setIsModified(modified);
  };

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

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedEmployee({});
    setFormData({});
    setIsModified(false);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    console.log("Updated Data:", formData);
    setShowModal(false);
    setIsModified(false);
  };

  return (
    <AdminLayout>
      .
      <Toaster />
      <div className="admin-employee-container">
        <div className="profile-header">
          <h2>All Employees</h2>
          <button
            className="add-employee-button"
            onClick={handleAddEmployeeClick}
          >
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
                <tr key={idx}>
                  <td>{emp.memberID}</td>
                  <td>{emp.fullname}</td>
                  <td>{emp.department}</td>
                  <td>{emp.rols}</td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => openUpdateModal(emp)}
                    >
                      <SystemUpdateAltRoundedIcon
                        style={{ fontSize: 12, marginRight: 5 }}
                      />
                      Update
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => deleteRecord(emp.firebaseId)}
                    >
                      <DeleteRoundedIcon
                        style={{ fontSize: 12, marginRight: 5 }}
                      />
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

              <form
                className="admin-member-form two-column-form"
                onSubmit={handleUpdateSubmit}
              >
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
                          value={formData.id || ""}
                          onChange={handleInputChange}
                          readOnly
                        />
                      </div>
                      <div className="admin-form-row">
                        <label>
                          Full Name<span>*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name || ""}
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
                          name="phone"
                          value={formData.phone || ""}
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
                        />
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
                          name="role"
                          value={formData.role || ""}
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
                          name="joinDate"
                          value={formData.joinDate || ""}
                          onChange={handleInputChange}
                        />
                      </div>
                    </fieldset>
                  </div>
                </div>

                {/* Buttons Below */}
                <div className="admin-button-group">
                  {isModified && (
                    <button type="submit" className="admin-submit-btn">
                      Update
                    </button>
                  )}
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    onClick={handleModalClose}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal-box">
              <h3>Change Password</h3>
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
                <button onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteConfirm && (
          <div className="edit-modal">
            <div className="modal-content">
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete{" "}
                <strong>{employeeToDelete?.name}</strong>?
              </p>
              <div
                className="admin-button-group"
                style={{ justifyContent: "center" }}
              >
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
