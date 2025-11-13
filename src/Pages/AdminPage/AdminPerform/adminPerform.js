import React, { useState, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import "./adminPerform.css";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

// --- Firebase Imports ---
import {
  ref,
  set,
  update,
  remove,
  onValue,
  push, // --- ADDED: Import push for auto-IDs ---
} from "firebase/database";
import { database } from "../../../Service/FirebaseConfig";

function AdminPerformance() {
  const [filterDept, setFilterDept] = useState("");
  const [filterEmpId, setFilterEmpId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // --- UPDATED: Removed feedbackId ---
  const initialFormState = {
    empId: "",
    name: "",
    department: "",
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
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Fetch data (No changes needed) ---
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
        alert("Could not fetch performance data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- UPDATED: 2. Handle Add New Performance ---
  const handleAddPerformance = async () => {
    // --- UPDATED: Removed feedbackId from validation ---
    if (!newPerformance.empId || !newPerformance.name) {
      alert("Please fill in Employee ID and Name.");
      return;
    }

    try {
      // --- UPDATED: Reference the collection, not a specific doc ---
      const collectionRef = ref(database, "performanceReviews");

      // --- UPDATED: Use push() to auto-generate the ID ---
      await push(collectionRef, newPerformance); // Saves the whole newPerformance state

      alert("Performance review added successfully!");
      setNewPerformance(initialFormState); 
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to add performance review.");
    }
  };

  // --- Handle Update (No changes needed) ---
  const handleUpdatePerformance = async () => {
    if (!selectedPerformance || !selectedPerformance.id) {
      alert("No performance review selected.");
      return;
    }

    try {
      const docId = selectedPerformance.id;
      const docRef = ref(database, "performanceReviews/" + docId);
      const { id, ...dataToUpdate } = selectedPerformance;
      await update(docRef, dataToUpdate);

      alert("Performance review updated successfully!");
      setShowUpdateForm(false);
      setSelectedPerformance(null);
      setOriginalPerformance(null);
    } catch (error) {
      console.error("Error updating document: ", error);
      alert("Failed to update performance review.");
    }
  };

  // --- Handle Delete (No changes needed) ---
  const handleDeletePerformance = async () => {
    if (!deleteTargetId) {
      alert("No performance ID specified for deletion.");
      return;
    }

    try {
      const docRef = ref(database, "performanceReviews/" + deleteTargetId);
      await remove(docRef);

      alert("Performance review deleted successfully!");
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("Failed to delete performance review.");
    }
  };

  // --- Filtering logic (no change needed) ---
  const filteredData = performances.filter((item) => {
    return (
      (filterDept === "" || item.department === filterDept) &&
      (filterEmpId === "" || item.empId.includes(filterEmpId))
    );
  });

  return (
    <AdminLayout>
      <div className="performance-container">
        {/* ... (Header and filters are correct) ... */}
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
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="IT">IT</option>
            <option value="HR">HR</option>
            <option value="Finance">Finance</option>
            <option value="Marketing">Marketing</option>
          </select>
          <input
            type="text"
            placeholder="Enter EMP ID"
            value={filterEmpId}
            onChange={(e) => setFilterEmpId(e.target.value)}
          />
        </div>
        
        <div className="performance-table-wrapper">
          <table className="performance-table">
            <thead>
              <tr>
                {/* <th>Feedback ID</th> */}
                <th>EMP ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="no-data-row">
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((perf) => (
                  <tr key={perf.id}>
                    {/* The ID is now the long unique key from push() */}
                    {/* <td title={perf.id}>{perf.id.substring(0, 8)}...</td>  */}
                    <td>{perf.empId}</td>
                    <td>{perf.name}</td>
                    <td>{perf.department}</td>
                    <td>
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarRoundedIcon
                          key={i}
                          style={{
                            color: i < perf.rating ? "#f1c40f" : "#ccc",
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
                        <IosShareRoundedIcon /> Update
                      </button>

                      <button
                        className="action-btn delete"
                        onClick={() => {
                          setDeleteTargetId(perf.id);
                          setShowDeleteConfirm(true);
                        }}
                      >
                        <DeleteRoundedIcon /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data-row">
                    No matching records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD MODAL --- */}
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
              &times;
            </button>
            <h3>Add New Performance</h3>
            <div className="popup-form">
              
              {/* --- UPDATED: Removed Feedback ID input field --- */}
              
              <div className="input-inline">
                <label>Employee ID*</label>
                <input
                  type="text"
                  value={newPerformance.empId}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      empId: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Employee Name*</label>
                <input
                  type="text"
                  value={newPerformance.name}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Department*</label>
                <select
                  value={newPerformance.department}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      department: e.target.value,
                    })
                  }
                >
                  <option value="">Select Department</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="IT">IT</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="input-inline">
                <label>Date*</label>
                <input
                  type="date"
                  value={newPerformance.date}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      date: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Score*</label>
                <input
                  type="text"
                  value={newPerformance.score}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      score: e.target.value,
                    })
                  }
                />
              </div>

              <div className="input-inline">
                <label>Engagement Level*</label>
                <select
                  value={newPerformance.engagement}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
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
                  rows="3"
                  value={newPerformance.comments}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      comments: e.target.value,
                    })
                  }
                ></textarea>
              </div>

              <label>Ratings*</label>
              <div className="star-select">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarRoundedIcon
                    key={i}
                    onClick={() =>
                      setNewPerformance({ ...newPerformance, rating: i + 1 })
                    }
                    style={{
                      color:
                        newPerformance.rating >= i + 1 ? "#f1c40f" : "#ccc",
                      fontSize: "24px",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
              
              <button className="popup-ok-btn" onClick={handleAddPerformance}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- UPDATE MODAL --- */}
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
              &times;
            </button>
            <h3>Update Performance</h3>
            <div className="popup-form">
              {/* <div className="input-inline">
                <label>Feedback ID*</label>
                <input
                  type="text"
                  value={selectedPerformance.id}
                  disabled 
                />
              </div> */}

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
                <label>Department*</label>
                <select
                  value={selectedPerformance.department}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      department: e.target.value,
                    })
                  }
                >
                  <option value="">Select Department</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                  <option value="IT">IT</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>

              <div className="input-inline">
                <label>Date*</label>
                <input
                  type="date"
                  value={selectedPerformance.date || ""}
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
                  value={selectedPerformance.score || ""}
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
                  value={selectedPerformance.engagement || ""}
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
                  rows="3"
                  value={selectedPerformance.comments || ""}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      comments: e.target.value,
                    })
                  }
                ></textarea>
              </div>
              
              <div
                className="input-inline"
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <label style={{ minWidth: "70px" }}>Ratings*</label>
                <div className="star-select" style={{ display: "flex" }}>
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
                        color:
                          selectedPerformance.rating >= i + 1
                            ? "#f1c40f"
                            : "#ccc",
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
                  <button
                    className="popup-ok-btn"
                    onClick={handleUpdatePerformance} 
                    style={{ marginLeft: "10px" }}
                  >
                    Update
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE MODAL --- */}
      {showDeleteConfirm && (
        <div className="performance-popup-overlay">
          <div className="performance-popup-content">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete performance ID{" "}
              <strong>{deleteTargetId}</strong>?
            </p>

            <div className="popup-btn-container">
              <button
                className="popup-ok-btn"
                onClick={handleDeletePerformance} 
              >
                Yes, Delete
              </button>
              <button
                className="popup-ok-btn"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
                style={{ marginLeft: "10px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminPerformance;