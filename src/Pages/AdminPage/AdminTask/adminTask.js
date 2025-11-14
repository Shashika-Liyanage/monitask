// AdminTaskManage.js
import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SystemUpdateAltRoundedIcon from '@mui/icons-material/SystemUpdateAltRounded';
import './admintask.css';



// Firebase imports (uses your existing config like other components)
import { database } from '../../../Service/FirebaseConfig';
import { ref, onValue, push, get, child, update, remove } from 'firebase/database';

function AdminTaskManage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [empIdSearch, setEmpIdSearch] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showUpdateTaskModal, setShowUpdateTaskModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Tasks from DB
  const [tasks, setTasks] = useState([]);
  const tasksRefPath = 'tasks'; // DB node for tasks

  // New task form
  const [newTask, setNewTask] = useState({
    id: '',
    empId: '',
    name: '',
    startDate: '',
    endDate: '',
    status: '',
    description: '',
  });

  // Update task
  const [updateTask, setUpdateTask] = useState(null);
  const [isUpdateChanged, setIsUpdateChanged] = useState(false);

  // Delete target
  const [taskToDelete, setTaskToDelete] = useState(null);

  // helper ref to avoid multiple lookups while typing
  const lookupTimeout = useRef(null);

  // ----- Toast helpers -----
// --- Toast Function (5 seconds auto hide)
const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast-root toast-${type}`;
  toast.innerHTML = `
      <div class="toast-message">${message}</div>
  `;
  document.body.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add("toast-hide");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
};


  // ----- Load tasks from DB realtime -----
  useEffect(() => {
    const nodeRef = ref(database, tasksRefPath);
    const unsubscribe = onValue(
      nodeRef,
      (snapshot) => {
        const val = snapshot.val();
        const arr = [];
        if (val) {
          for (const key of Object.keys(val)) {
            arr.push({ dbKey: key, ...val[key] });
          }
        }
        // sort descending by createdAt if present or by id
        arr.sort((a, b) => {
          if (a.createdAt && b.createdAt) return b.createdAt - a.createdAt;
          return (b.id || '').localeCompare(a.id || '');
        });
        setTasks(arr);
      },
      (err) => {
        console.error('Error reading tasks:', err);
        showToast('Failed to load tasks from DB', 'error');
      }
    );
    return () => unsubscribe();
  }, []);

  // ----- Utility: generate next Task ID (T001...) based on existing tasks -----
  const generateNextTaskId = (existingTasks = tasks) => {
    let maxN = 0;
    for (const t of existingTasks) {
      const m = (t.id || '').match(/^T0*([0-9]+)$/i);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > maxN) maxN = n;
      }
    }
    const next = maxN + 1;
    return 'T' + String(next).padStart(3, '0');
  };

  // ----- Lookup employee name by empId in your existing createEmployee/newEmployee node -----
  const lookupEmployeeById = async (empId, opts = { setOnFind: true }) => {
    const idTrim = String(empId || '').trim();
    if (!idTrim) {
      if (opts.setOnFind) setNewTask((p) => ({ ...p, name: '' }));
      return null;
    }

    try {
      const employeesRef = ref(database, 'createEmployee/newEmployee');
      const snapshot = await get(employeesRef);
      if (!snapshot.exists()) {
        if (opts.setOnFind) setNewTask((p) => ({ ...p, name: '' }));
        showToast('No employees found in DB', 'error');
        return null;
      }
      const data = snapshot.val();
      for (const uid of Object.keys(data)) {
        const rec = data[uid];
        if (String(rec.memberID || '').trim() === idTrim) {
          if (opts.setOnFind) {
            setNewTask((p) => ({ ...p, name: rec.fullname || '' }));
          }
          return rec;
        }
      }
      if (opts.setOnFind) setNewTask((p) => ({ ...p, name: '' }));
      return null;
    } catch (err) {
      console.error('Employee lookup failed:', err);
      if (opts.setOnFind) setNewTask((p) => ({ ...p, name: '' }));
      showToast('Failed to lookup employee (see console)', 'error');
      return null;
    }
  };

  // ----- Handlers for Add Modal -----
  const openAddModal = () => {
    const nextId = generateNextTaskId();
    setNewTask({
      id: nextId,
      empId: '',
      name: '',
      startDate: '',
      endDate: '',
      status: '',
      description: '',
    });
    setShowAddTaskModal(true);
  };

  // when empId input changes (Add form) - debounce lookup and autofill name
  const handleNewTaskEmpIdChange = (val) => {
    setNewTask((p) => ({ ...p, empId: val }));
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    lookupTimeout.current = setTimeout(() => {
      lookupEmployeeById(val, { setOnFind: true }).then((found) => {
        if (!found) {
          if (val.trim()) showToast('No employee found with that ID', 'error');
        } else {
          showToast(`Employee found: ${found.fullname}`, 'success');
        }
      });
    }, 450); // debounce lookup
  };

  const handleAddTask = async () => {
    // basic validation
    if (!newTask.empId || !newTask.name || !newTask.startDate || !newTask.endDate || !newTask.status) {
      showToast('Please fill required fields', 'error');
      return;
    }
    // date validation: end >= start
    try {
      const s = new Date(newTask.startDate + 'T00:00:00');
      const e = new Date(newTask.endDate + 'T00:00:00');
      if (e < s) {
        showToast('End date cannot be earlier than start date', 'error');
        return;
      }
    } catch (err) {
      showToast('Invalid dates', 'error');
      return;
    }

    try {
      const nodeRef = ref(database, tasksRefPath);
      const payload = {
        id: newTask.id,
        empId: newTask.empId,
        name: newTask.name,
        startDate: newTask.startDate,
        endDate: newTask.endDate,
        status: newTask.status,
        description: newTask.description || '',
        createdAt: Date.now(),
      };
      await push(nodeRef, payload);
      showToast('Task added successfully', 'success');
      setShowAddTaskModal(false);
    } catch (err) {
      console.error('Add task error', err);
      showToast('Failed to add task', 'error');
    }
  };

  // ----- Handlers for Update Modal -----
  const openUpdateModal = (task) => {
    // task is an object with dbKey and fields
    setUpdateTask({ ...task }); // clone
    setIsUpdateChanged(false);
    setShowUpdateTaskModal(true);
  };

  const handleUpdateField = (field, value) => {
    setUpdateTask((p) => ({ ...p, [field]: value }));
    setIsUpdateChanged(true);
  };

  const handleSaveUpdate = async () => {
    if (!updateTask) return;
    if (!updateTask.empId || !updateTask.name || !updateTask.startDate || !updateTask.endDate || !updateTask.status) {
      showToast('Please fill required fields', 'error');
      return;
    }
    try {
      const dbKey = updateTask.dbKey;
      const docRef = ref(database, `${tasksRefPath}/${dbKey}`);
      // create update payload (do not include dbKey)
      const { dbKey: _, ...payload } = updateTask;
      await update(docRef, payload);
      showToast('Task updated successfully', 'success');
      setShowUpdateTaskModal(false);
      setUpdateTask(null);
      setIsUpdateChanged(false);
    } catch (err) {
      console.error('Update error', err);
      showToast('Failed to update task', 'error');
    }
  };

  // ----- Delete flow -----
  const openDeleteModal = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      const dbKey = taskToDelete.dbKey;
      const docRef = ref(database, `${tasksRefPath}/${dbKey}`);
      await remove(docRef);
      showToast(`Task ${taskToDelete.id} deleted`, 'success');
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error('Delete error', err);
      showToast('Failed to delete task', 'error');
    }
  };

  // ----- Filtered tasks for table (client-side) -----
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = statusFilter ? (t.status || '').toLowerCase() === statusFilter.toLowerCase() : true;
    const matchesEmpId = empIdSearch ? (t.empId || '').toLowerCase().includes(empIdSearch.toLowerCase()) : true;
    return matchesStatus && matchesEmpId;
  });

  return (
    <AdminLayout>
      <div className="task-container">
        {/* Title */}
        <div className="task-header">
          <h2 className="task-tittle">Employee Task Manage</h2>
          <button className="add-task-btn" onClick={openAddModal}>
            <CloudUploadIcon style={{ marginRight: '6px' }} />
            Add Task
          </button>
        </div>

        {/* Filters */}
        <div className="task-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">-- Filter by Status --</option>
            <option value="Complete">Complete</option>
            <option value="Incomplete">Incomplete</option>
            <option value="Pending">Pending</option>
          </select>

          <input
            type="text"
            placeholder="Search by Employee ID"
            value={empIdSearch}
            onChange={(e) => setEmpIdSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <table className="task-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Emp ID</th>
              <th>Employee Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <tr key={task.dbKey}>
                  <td>{task.id}</td>
                  <td>{task.empId}</td>
                  <td>{task.name}</td>
                  <td>{task.status}</td>
                  <td className="action-buttons">
                    <button
                      title="Update"
                      className="update-icon-btn"
                      onClick={() => openUpdateModal(task)}
                    >
                      <SystemUpdateAltRoundedIcon className="icon" style={{ marginRight: '6px' }} />
                      Update
                    </button>

                    <button
                      title="Delete"
                      className="delete-icon-btn"
                      onClick={() => openDeleteModal(task)}
                    >
                      <DeleteRoundedIcon className="icon" style={{ marginRight: '6px' }} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>No matching tasks found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddTaskModal && (
        <div className="task-popup-overlay">
          <div className="task-popup-content">
            <button
              className="task-popup-close"
              onClick={() => setShowAddTaskModal(false)}
              aria-label="Close popup"
            >
              &times;
            </button>

            <h3>Add New Task</h3>

            <div className="task-popup-form">
              <div className="task-input-inline-row">
                <div>
                  <label>Task ID*</label>
                  <input
                    type="text"
                    value={newTask.id}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label>Employee ID*</label>
                  <input
                    type="text"
                    value={newTask.empId}
                    onChange={(e) => handleNewTaskEmpIdChange(e.target.value)}
                    placeholder="Enter Employee ID"
                  />
                </div>
              </div>

              <div className="task-input-inline-row">
                <div>
                  <label>Employee Name*</label>
                  <input
                    type="text"
                    value={newTask.name}
                    onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                    placeholder="Employee Name (autofill)"
                  />
                </div>
                <div>
                  <label>Start Date*</label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="task-input-inline-row">
                <div>
                  <label>End Date*</label>
                  <input
                    type="date"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  />
                </div>
                <div>
                  {/* removed department field as requested */}
                  <label>Status*</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                    <option value="Incomplete">Incomplete</option>
                  </select>
                </div>
              </div>

              <div className="task-input-inline">
                <label>Task Description*</label>
                <textarea
                  rows="3"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                ></textarea>
              </div>

              <div className="task-popup-actions">
                <button
                  className="task-popup-add-btn"
                  onClick={handleAddTask}
                >
                  Add Task
                </button>
                <button
                  className="task-popup-cancel-btn"
                  onClick={() => setShowAddTaskModal(false)}
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateTaskModal && updateTask && (
        <div className="task-popup-overlay">
          <div className="task-popup-content">
            <button
              className="task-popup-close"
              onClick={() => {
                setShowUpdateTaskModal(false);
                setIsUpdateChanged(false);
                setUpdateTask(null);
              }}
              aria-label="Close popup"
            >
              &times;
            </button>

            <h3>Update Task</h3>

            <div className="task-popup-form">
              <div className="task-input-inline-row">
                <div>
                  <label>Task ID*</label>
                  <input type="text" value={updateTask.id} readOnly disabled />
                </div>
                <div>
                  <label>Employee ID*</label>
                  <input
                    type="text"
                    value={updateTask.empId || ''}
                    onChange={(e) => handleUpdateField('empId', e.target.value)}
                    onBlur={() => {
                      // try autofill name when editing empId in update modal
                      lookupEmployeeById(updateTask.empId, { setOnFind: true }).then((found) => {
                        if (!found && updateTask.empId) showToast('No employee found with that ID', 'error');
                      });
                    }}
                  />
                </div>
              </div>

              <div className="task-input-inline-row">
                <div>
                  <label>Employee Name*</label>
                  <input
                    type="text"
                    value={updateTask.name || ''}
                    onChange={(e) => handleUpdateField('name', e.target.value)}
                  />
                </div>
                <div>
                  <label>Start Date*</label>
                  <input
                    type="date"
                    value={updateTask.startDate || ''}
                    onChange={(e) => handleUpdateField('startDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="task-input-inline-row">
                <div>
                  <label>End Date*</label>
                  <input
                    type="date"
                    value={updateTask.endDate || ''}
                    onChange={(e) => handleUpdateField('endDate', e.target.value)}
                  />
                </div>
                <div>
                  <label>Status*</label>
                  <select
                    value={updateTask.status || ''}
                    onChange={(e) => handleUpdateField('status', e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Complete">Complete</option>
                    <option value="Incomplete">Incomplete</option>
                  </select>
                </div>
              </div>

              <div className="task-input-inline">
                <label>Task Description*</label>
                <textarea
                  rows="3"
                  value={updateTask.description || ''}
                  onChange={(e) => handleUpdateField('description', e.target.value)}
                ></textarea>
              </div>

              <div className="task-popup-actions">
                {isUpdateChanged && (
                  <button
                    className="task-popup-add-btn"
                    onClick={handleSaveUpdate}
                  >
                    Update
                  </button>
                )}
                <button
                  className="task-popup-cancel-btn"
                  onClick={() => {
                    setShowUpdateTaskModal(false);
                    setIsUpdateChanged(false);
                    setUpdateTask(null);
                  }}
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <div className="task-popup-overlay">
          <div className="task-popup-content delete-confirmation-popup">
            <button
              className="task-popup-close"
              onClick={() => {
                setShowDeleteModal(false);
                setTaskToDelete(null);
              }}
            >
              &times;
            </button>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete the task <strong>{taskToDelete.id}</strong> for Employee <strong>{taskToDelete.empId}</strong>?</p>
            <div className="task-popup-actions">
              <button
                className="task-popup-add-btn"
                onClick={handleConfirmDelete}
              >
                Yes, Delete
              </button>
              <button
                className="task-popup-cancel-btn"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTaskToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`toast-root ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          <div className="toast-message">{toast.message}</div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminTaskManage;
