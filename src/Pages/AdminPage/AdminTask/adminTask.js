import React, { useState } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SystemUpdateAltRoundedIcon from '@mui/icons-material/SystemUpdateAltRounded';
import './admintask.css';

const mockTasks = [
  { id: 'T001', empId: 'E101', name: 'John Doe', status: 'Pending' },
  { id: 'T002', empId: 'E102', name: 'Jane Smith', status: 'Complete' },
  { id: 'T003', empId: 'E103', name: 'Alice Brown', status: 'Incomplete' },
  { id: 'T004', empId: 'E104', name: 'Bob Johnson', status: 'Pending' },
];

function AdminTaskManage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [empIdSearch, setEmpIdSearch] = useState('');
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    department: '',
    status: '',
    description: '',
  });

  const filteredTasks = mockTasks.filter(task => {
    const matchesStatus = statusFilter ? task.status.toLowerCase() === statusFilter.toLowerCase() : true;
    const matchesEmpId = empIdSearch ? task.empId.toLowerCase().includes(empIdSearch.toLowerCase()) : true;
    
    return matchesStatus && matchesEmpId;
  });
  const [showUpdateTaskModal, setShowUpdateTaskModal] = useState(false);
  const [isUpdateChanged, setIsUpdateChanged] = useState(false);
const [updateTask, setUpdateTask] = useState(null);  // Holds the task being updated
const openUpdateModal = (task) => {
  setUpdateTask(task);
  setShowUpdateTaskModal(true);
};
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [taskToDelete, setTaskToDelete] = useState(null);


  return (
    <AdminLayout>
      <div className="task-container">
        {/* Title */}
        <div className="task-header">
          <h2 className="task-tittle">Employee Task Manage</h2>
          <button className="add-task-btn" onClick={() => setShowAddTaskModal(true)}>
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
              filteredTasks.map(task => (
                <tr key={task.id}>
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
  onClick={() => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  }}
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

      {/* Popup Modal */}
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
              value={newTask.id || ''}
              onChange={(e) => setNewTask({ ...newTask, id: e.target.value })}
              placeholder="Enter Task ID"
            />
          </div>
          <div>
            <label>Employee ID*</label>
            <input
              type="text"
              value={newTask.empId || ''}
              onChange={(e) => setNewTask({ ...newTask, empId: e.target.value })}
              placeholder="Enter Employee ID"
            />
          </div>
        </div>

        <div className="task-input-inline-row">
          <div>
            <label>Employee Name*</label>
            <input
              type="text"
              value={newTask.name || ''}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
              placeholder="Enter Employee Name"
            />
          </div>
          <div>
            <label>Start Date*</label>
            <input
              type="date"
              value={newTask.startDate || ''}
              onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
            />
          </div>
        </div>

        <div className="task-input-inline-row">
          <div>
            <label>End Date*</label>
            <input
              type="date"
              value={newTask.endDate || ''}
              onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
            />
          </div>
          <div>
            <label>Department*</label>
            <select
              value={newTask.department}
              onChange={(e) => setNewTask({ ...newTask, department: e.target.value })}
            >
              <option value="">Select Department</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="IT">IT</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>

        <div className="task-input-inline">
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
            onClick={() => {
              // TODO: Add your logic to add a new task here

              setShowAddTaskModal(false);
            }}
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

{showUpdateTaskModal && updateTask && (
  <div className="task-popup-overlay">
    <div className="task-popup-content">
      <button
        className="task-popup-close"
        onClick={() => {
          setShowUpdateTaskModal(false);
          setIsUpdateChanged(false); // reset when closing
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
            <input
              type="text"
              value={updateTask.id}
              readOnly
              disabled
            />
          </div>
          <div>
            <label>Employee ID*</label>
            <input
              type="text"
              value={updateTask.empId}
              onChange={(e) => {
                setUpdateTask({ ...updateTask, empId: e.target.value });
                setIsUpdateChanged(true);
              }}
              placeholder="Enter Employee ID"
            />
          </div>
        </div>

        {/* Repeat for all fields: */}
        <div className="task-input-inline-row">
          <div>
            <label>Employee Name*</label>
            <input
              type="text"
              value={updateTask.name}
              onChange={(e) => {
                setUpdateTask({ ...updateTask, name: e.target.value });
                setIsUpdateChanged(true);
              }}
              placeholder="Enter Employee Name"
            />
          </div>
          <div>
            <label>Start Date*</label>
            <input
              type="date"
              value={updateTask.startDate || ''}
              onChange={(e) => {
                setUpdateTask({ ...updateTask, startDate: e.target.value });
                setIsUpdateChanged(true);
              }}
            />
          </div>
        </div>

        <div className="task-input-inline-row">
          <div>
            <label>End Date*</label>
            <input
              type="date"
              value={updateTask.endDate || ''}
              onChange={(e) => {
                setUpdateTask({ ...updateTask, endDate: e.target.value });
                setIsUpdateChanged(true);
              }}
            />
          </div>
          <div>
            <label>Department*</label>
            <select
              value={updateTask.department || ''}
              onChange={(e) => {
                setUpdateTask({ ...updateTask, department: e.target.value });
                setIsUpdateChanged(true);
              }}
            >
              <option value="">Select Department</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="IT">IT</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
            </select>
          </div>
        </div>

        <div className="task-input-inline">
          <label>Status*</label>
          <select
            value={updateTask.status || ''}
            onChange={(e) => {
              setUpdateTask({ ...updateTask, status: e.target.value });
              setIsUpdateChanged(true);
            }}
          >
            <option value="">Select Status</option>
            <option value="Pending">Pending</option>
            <option value="Complete">Complete</option>
            <option value="Incomplete">Incomplete</option>
          </select>
        </div>

        <div className="task-input-inline">
          <label>Task Description*</label>
          <textarea
            rows="3"
            value={updateTask.description || ''}
            onChange={(e) => {
              setUpdateTask({ ...updateTask, description: e.target.value });
              setIsUpdateChanged(true);
            }}
          ></textarea>
        </div>

        <div className="task-popup-actions">
          {/* Show Update button only if user changed something */}
          {isUpdateChanged && (
            <button
              className="task-popup-add-btn"
              onClick={() => {
                // TODO: handle update logic here
                console.log('Updated task data:', updateTask);
                setShowUpdateTaskModal(false);
                setIsUpdateChanged(false);
              }}
            >
              Update
            </button>
          )}
          <button
            className="task-popup-cancel-btn"
            onClick={() => {
              setShowUpdateTaskModal(false);
              setIsUpdateChanged(false);
            }}
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  </div>
)}

{showDeleteModal && taskToDelete && (
  <div className="task-popup-overlay">
    <div className="task-popup-content delete-confirmation-popup">
      <button
        className="task-popup-close"
        onClick={() => setShowDeleteModal(false)}
      >
        &times;
      </button>
      <h3>Confirm Delete</h3>
      <p>Are you sure you want to delete the task <strong>{taskToDelete.id}</strong>?</p>
      <div className="task-popup-actions">
        <button
          className="task-popup-add-btn"
          onClick={() => {
            // TODO: Add delete logic here (e.g., API call or state update)
            console.log('Deleting task:', taskToDelete.id);

            // Example logic if tasks are stored in state (you might adjust this)
            // setTasks(tasks => tasks.filter(task => task.id !== taskToDelete.id));

            setShowDeleteModal(false);
            setTaskToDelete(null);
          }}
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

    </AdminLayout>
  );
}

export default AdminTaskManage;
