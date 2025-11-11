import React, { useState } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import "./adminPerform.css";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

function AdminPerformance() {
  const [filterDept, setFilterDept] = useState("");
  const [filterEmpId, setFilterEmpId] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPerformance, setNewPerformance] = useState({
    feedbackId: "",
    empId: "",
    name: "",
    department: "",
    date: "",
    rating: 0,
    score: "",
    engagement: "",
    comments: "",
  });
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState(null);
  const [originalPerformance, setOriginalPerformance] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const [performances] = useState([
    {
      id: "PERF001",
      empId: "EMP001",
      name: "John Doe",
      department: "IT",
      rating: 4,
    },
    {
      id: "PERF002",
      empId: "EMP002",
      name: "Jane Smith",
      department: "HR",
      rating: 5,
    },
    {
      id: "PERF003",
      empId: "EMP003",
      name: "Ann Perera",
      department: "Finance",
      rating: 3,
    },
  ]);

  const filteredData = performances.filter((item) => {
    return (
      (filterDept === "" || item.department === filterDept) &&
      (filterEmpId === "" || item.empId.includes(filterEmpId))
    );
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
                <th>Feedback ID</th>
                <th>EMP ID</th>
                <th>Employee Name</th>
                <th>Department</th>
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((perf) => (
                  <tr key={perf.id}>
                    <td>{perf.id}</td>
                    <td>{perf.empId}</td>
                    <td>{perf.name}</td>
                    <td>{perf.department}</td>
                    <td>
                      {Array.from({ length: perf.rating }, (_, i) => (
                        <StarRoundedIcon
                          key={i}
                          style={{ color: "#f1c40f", fontSize: "20px" }}
                        />
                      ))}
                    </td>
                    <td>
                      <button
                        className="action-btn update"
                        onClick={() => {
                          setSelectedPerformance(perf);
                          setOriginalPerformance(perf); // store original for comparison
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

      {showAddForm && (
        <div className="performance-popup-overlay">
          <div className="performance-popup-content">
            <button
              className="popup-close"
              onClick={() => setShowAddForm(false)}
            >
              &times;
            </button>
            <h3>Add New Performance</h3>

            <div className="popup-form">
              <div className="input-inline">
                <label>Feedback ID*</label>
                <input
                  type="text"
                  value={newPerformance.feedbackId}
                  onChange={(e) =>
                    setNewPerformance({
                      ...newPerformance,
                      feedbackId: e.target.value,
                    })
                  }
                />
              </div>

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
                  {/* Add more departments as needed */}
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

              <button
                className="popup-ok-btn"
                onClick={() => setShowAddForm(false)}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateForm && selectedPerformance && (
        <div className="performance-popup-overlay">
          <div className="performance-popup-content">
            <button
              className="popup-close"
              onClick={() => setShowUpdateForm(false)}
            >
              &times;
            </button>
            <h3>Update Performance</h3>

            <div className="popup-form">
              <div className="input-inline">
                <label>Feedback ID*</label>
                <input
                  type="text"
                  value={selectedPerformance.id}
                  onChange={(e) =>
                    setSelectedPerformance({
                      ...selectedPerformance,
                      id: e.target.value,
                    })
                  }
                />
              </div>

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
                  onClick={() => setShowUpdateForm(false)}
                >
                  Cancel
                </button>

                {JSON.stringify(selectedPerformance) !==
                  JSON.stringify(originalPerformance) && (
                  <button
                    className="popup-ok-btn"
                    onClick={() => {
                      // UPDATE LOGIC GOES HERE
                      console.log("Updated Performance:", selectedPerformance);
                      setShowUpdateForm(false);
                    }}
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
                onClick={() => {
                  // Here you can implement the actual delete logic
                  console.log("Deleting ID:", deleteTargetId);
                  setShowDeleteConfirm(false);
                  setDeleteTargetId(null);
                }}
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
