import React, { useState, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import "./adminPerform.css";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { ref, update, remove, onValue, push, get } from "firebase/database";
import { database } from "../../../Service/FirebaseConfig";

// Toast Component (bottom-center, 5s duration)
const Toast = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === "error" ? "#f44336" : "#4CAF50";
  const border = type === "error" ? "1px solid #d7372d" : "1px solid #3b9440";

  return (
    <div className="toast-container">
      <div
        className="toast-message"
        style={{
          background: bg,
          border: border,
        }}
      >
        {message}
      </div>
    </div>
  );
};

function AdminPerformance() {
  const [filterEmpId, setFilterEmpId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const initialFormState = {
    empId: "",
    name: "",
    date: "",
    rating: 0,
    score: "",
    engagement: "",
    comments: "",
  };

  const [newPerformance, setNewPerformance] = useState(initialFormState);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [originalPerformance, setOriginalPerformance] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // keep both DB key and the employee id (memberID) for the delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState(null); // database key (perf.id)
  const [deleteTargetEmpId, setDeleteTargetEmpId] = useState(null); // perf.empId (employee ID shown in popup)

  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to show toast with type 'success' | 'error'
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  // Function to hide toast
  const hideToast = () => {
    setToast({ show: false, message: "", type: "success" });
  };

  // Fetch performance data (unchanged)
  useEffect(() => {
    setLoading(true);
    const collectionRef = ref(database, "performanceReviews");
    const unsubscribe = onValue(
      collectionRef,
      (snapshot) => {
        const data = snapshot.val();
        const reviewsList = [];
        if (data) {
          for (let id in data) {
            reviewsList.push({ id, ...data[id] });
          }
        }
        setPerformances(reviewsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching performance data: ", error);
        showToast("Could not fetch performance data.", "error");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Helper: lookup employee by memberID (empId) in RTDB and autofill name only
  const lookupEmployeeById = async (empId) => {
    const id = String(empId || "").trim();
    if (!id) {
      // Clear autofill fields if empId empty
      setNewPerformance((prev) => ({ ...prev, name: "" }));
      return;
    }

    try {
      const empRef = ref(database, "createEmployee/newEmployee");
      const snapshot = await get(empRef);
      if (!snapshot.exists()) {
        setNewPerformance((prev) => ({ ...prev, name: "" }));
        showToast("No employee records in database.", "error");
        return;
      }

      const data = snapshot.val();
      let found = null;
      // data keys are UIDs, record contains memberID property
      for (const key of Object.keys(data)) {
        const rec = data[key];
        if (String(rec.memberID || "").trim() === id) {
          found = rec;
          break;
        }
      }

      if (found) {
        setNewPerformance((prev) => ({
          ...prev,
          name: found.fullname || "",
        }));
        showToast(`Employee found: ${found.fullname || ""}`, "success");
      } else {
        setNewPerformance((prev) => ({ ...prev, name: "" }));
        showToast("No employee found with that ID.", "error");
      }
    } catch (err) {
      console.error("Employee lookup error:", err);
      showToast("Failed to lookup employee. See console.", "error");
    }
  };

  // Handle Add New Performance
  const handleAddPerformance = async () => {
    if (!newPerformance.empId || !newPerformance.name) {
      showToast("Please fill in Employee ID and Name.", "error");
      return;
    }

    try {
      const collectionRef = ref(database, "performanceReviews");
      await push(collectionRef, newPerformance);
      showToast("Performance review added successfully!", "success");
      setNewPerformance(initialFormState);
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      showToast("Failed to add performance review.", "error");
    }
  };

  // Handle Update
  const handleUpdatePerformance = async () => {
    if (!selectedPerformance || !selectedPerformance.id) {
      showToast("No performance review selected.", "error");
      return;
    }

    try {
      const docId = selectedPerformance.id;
      const docRef = ref(database, "performanceReviews/" + docId);
      const { id, ...dataToUpdate } = selectedPerformance;
      await update(docRef, dataToUpdate);
      showToast("Performance review updated successfully!", "success");
      setShowUpdateForm(false);
      setSelectedPerformance(null);
      setOriginalPerformance(null);
    } catch (error) {
      console.error("Error updating document: ", error);
      showToast("Failed to update performance review.", "error");
    }
  };

  // Handle Delete
  const handleDeletePerformance = async () => {
    if (!deleteTargetId) {
      showToast("No performance ID specified for deletion.", "error");
      return;
    }

    try {
      const docRef = ref(database, "performanceReviews/" + deleteTargetId);
      await remove(docRef);
      showToast("Performance review deleted successfully!", "success");
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
      setDeleteTargetEmpId(null);
    } catch (error) {
      console.error("Error deleting document: ", error);
      showToast("Failed to delete performance review.", "error");
    }
  };

  // Filtering logic (only by empId)
  const filteredData = performances.filter((item) => {
    return (filterEmpId === "" || (item.empId || "").includes(filterEmpId));
  });

  return (
    <AdminLayout>
      <div className="performance-container">
        <div className="performance-header">
          <h2>Employee Performance</h2>
          <button
            className="add-performance-btn"
            onClick={() => setShowAddForm(true)}
          >
            Add New Performance
          </button>
        </div>

        <div className="performance-filters">
          <input
            type="text"
            placeholder="Search by Employee ID"
            value={filterEmpId}
            onChange={(e) => setFilterEmpId(e.target.value)}
          />
        </div>

        <div className="performance-table-wrapper">
          {loading ? (
            <div>Loading...</div>
          ) : filteredData.length > 0 ? (
            <table className="performance-table">
              <thead>
                <tr>
                  <th>EMP ID</th>
                  <th>Employee Name</th>
                  <th>Rating</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((perf) => (
                  <tr key={perf.id}>
                    <td>{perf.empId}</td>
                    <td>{perf.name}</td>
                    <td>
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarRoundedIcon
                          key={i}
                          style={{
                            color: perf.rating >= i + 1 ? "#f1c40f" : "#ccc",
                            fontSize: "20px",
                          }}
                        />
                      ))}
                    </td>
                    <td>
                      <button
                        className="action-btn update"
                        onClick={() => {
                          setSelectedPerformance(perf);
                          setOriginalPerformance(perf);
                          setShowUpdateForm(true);
                        }}
                      >
                        <IosShareRoundedIcon />
                        Update
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => {
                          // set both DB key and visible employee ID for the popup
                          setDeleteTargetId(perf.id);
                          setDeleteTargetEmpId(perf.empId || "");
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <DeleteRoundedIcon />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-data-row">No matching records found.</div>
          )}
        </div>

        {/* ADD MODAL */}
        {showAddForm && (
          <div className="performance-popup-overlay">
            <div className="performance-popup-content">
              <button
                className="popup-close"
                onClick={() => {
                  setShowAddForm(false);
                  setNewPerformance(initialFormState);
                }}
              >
                ×
              </button>
              <h3>Add New Performance</h3>

              <div className="input-inline">
                <label>Employee ID*</label>
                <input
                  type="text"
                  value={newPerformance.empId}
                  onChange={(e) =>
                    setNewPerformance({ ...newPerformance, empId: e.target.value })
                  }
                  onBlur={() => lookupEmployeeById(newPerformance.empId)} // lookup when leaving field
                />
              </div>

              <div className="input-inline">
                <label>Employee Name*</label>
                <input
                  type="text"
                  value={newPerformance.name}
                  onChange={(e) =>
                    setNewPerformance({ ...newPerformance, name: e.target.value })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Date*</label>
                <input
                  type="date"
                  value={newPerformance.date}
                  onChange={(e) =>
                    setNewPerformance({ ...newPerformance, date: e.target.value })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Score*</label>
                <input
                  type="text"
                  value={newPerformance.score}
                  onChange={(e) =>
                    setNewPerformance({ ...newPerformance, score: e.target.value })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Engagement Level*</label>
                <select
                  value={newPerformance.engagement}
                  onChange={(e) =>
                    setNewPerformance({ ...newPerformance, engagement: e.target.value })
                  }
                >
                  <option value="">Select</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="input-inline">
                <label>Comments*</label>
                <textarea
                  value={newPerformance.comments}
                  onChange={(e) =>
                    setNewPerformance({ ...newPerformance, comments: e.target.value })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Ratings*</label>
                <div className="star-select">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarRoundedIcon
                      key={i}
                      onClick={() =>
                        setNewPerformance({ ...newPerformance, rating: i + 1 })
                      }
                      style={{
                        color: newPerformance.rating >= i + 1 ? "#f1c40f" : "#ccc",
                        fontSize: "24px",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="popup-btn-container">
                <button className="popup-ok-btn" onClick={handleAddPerformance}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* UPDATE MODAL */}
        {showUpdateForm && selectedPerformance && (
          <div className="performance-popup-overlay">
            <div className="performance-popup-content">
              <button
                className="popup-close"
                onClick={() => {
                  setShowUpdateForm(false);
                  setSelectedPerformance(null);
                  setOriginalPerformance(null);
                }}
              >
                ×
              </button>
              <h3>Update Performance</h3>

              <div className="input-inline">
                <label>Employee ID*</label>
                <input
                  type="text"
                  value={selectedPerformance.empId}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      empId: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Employee Name*</label>
                <input
                  type="text"
                  value={selectedPerformance.name}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Date*</label>
                <input
                  type="date"
                  value={selectedPerformance.date}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Score*</label>
                <input
                  type="text"
                  value={selectedPerformance.score}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      score: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Engagement Level*</label>
                <select
                  value={selectedPerformance.engagement}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      engagement: e.target.value,
                    })
                  }
                >
                  <option value="">Select</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="input-inline">
                <label>Comments*</label>
                <textarea
                  value={selectedPerformance.comments}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      comments: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Ratings*</label>
                <div className="star-select">
                  {Array.from({ length: 5 }, (_, i) => (
                    <StarRoundedIcon
                      key={i}
                      onClick={() =>
                        setSelectedPerformance({
                          ...selectedPerformance,
                          rating: i + 1,
                        })
                      }
                      style={{
                        color: selectedPerformance.rating >= i + 1 ? "#f1c40f" : "#ccc",
                        fontSize: "24px",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="popup-btn-container">
                <button
                  className="popup-ok-btn"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedPerformance(null);
                    setOriginalPerformance(null);
                  }}
                >
                  Cancel
                </button>
                {JSON.stringify(selectedPerformance) !==
                  JSON.stringify(originalPerformance) && (
                  <button className="popup-ok-btn" onClick={handleUpdatePerformance}>
                    Update
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* DELETE MODAL (shows employee ID in the message) */}
        {showDeleteConfirm && (
          <div className="performance-popup-overlay">
            <div className="performance-popup-content">
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete performance record for Employee ID:{" "}
                <strong>{deleteTargetEmpId || deleteTargetId}</strong>?
              </p>
              <div className="popup-btn-container">
                <button className="popup-ok-btn" onClick={handleDeletePerformance}>
                  Yes, Delete
                </button>
                <button
                  className="popup-ok-btn"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteTargetId(null);
                    setDeleteTargetEmpId(null);
                  }}
                  style={{ marginLeft: "10px" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminPerformance;
