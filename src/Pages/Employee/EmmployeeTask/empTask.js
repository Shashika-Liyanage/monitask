import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL';
import { getDatabase, ref, onValue, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import app from '../../../Service/FirebaseConfig';
import toast, { Toaster } from "react-hot-toast";
import './empTask.css';

function EmployeeTaskView() {
  const db = getDatabase(app);
  const auth = getAuth(app);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterMonth, setFilterMonth] = useState('All');
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);

  const months = [
    'All','January','February','March','April','May','June','July',
    'August','September','October','November','December',
  ];

  // Fetch logged-in employee data
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const employeeRef = ref(db, `createEmployee/newEmployee/${user.uid}`);
    onValue(employeeRef, snapshot => {
      if (snapshot.exists()) {
        setEmployeeData(snapshot.val());
      }
    });
  }, [auth]);

  // Fetch employee tasks
  useEffect(() => {
    if (!employeeData) return;

    const tasksRef = ref(db, 'tasks');
    const unsubscribe = onValue(tasksRef, snapshot => {
      const data = snapshot.val();
      const list = [];
      if (data) {
        const today = new Date();
        for (const key in data) {
          const task = data[key];
          if (task.empId === employeeData.memberID) {
            const endDate = new Date(task.endDate + 'T23:59:59');

            // Auto-update overdue tasks: Pending → Incomplete
            if (task.status === 'Pending' && today > endDate) {
              task.status = 'Incomplete';
              update(ref(db, `tasks/${key}`), { status: 'Incomplete' });
            }

            list.push({ dbKey: key, ...task });
          }
        }
      }
      setTasks(list);
      setLoading(false);
    }, error => {
      console.error(error);
      toast.error('Failed to load tasks');
      setLoading(false);
    });
    return () => unsubscribe();
  }, [employeeData, db]);

  const getMonthName = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'long' });
  };

  const filteredTasks = filterMonth === 'All'
    ? tasks
    : tasks.filter(task => getMonthName(task.startDate) === filterMonth);

  // Employee marks task as Complete
  const handleCompleteTask = async (task) => {
    try {
      await update(ref(db, `tasks/${task.dbKey}`), { status: 'Complete' });
      toast.success('Task marked as complete!');
      // Refresh selectedTask status
      setSelectedTask({ ...task, status: 'Complete' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task.');
    }
  };

  if (loading) return <EmployeeLayout><div>Loading tasks...</div></EmployeeLayout>;

  return (
    <EmployeeLayout>
      <Toaster
        position="bottom-center"
        toastOptions={{
          success: { style: { background: '#4CAF50', color: '#fff', fontWeight: 600 } },
          error: { style: { background: '#F44336', color: '#fff', fontWeight: 600 } },
        }}
      />

      <div className="task-container">
        <h2 className="task-tittle">My Tasks</h2>

        <div className="task-filters">
          <label>Filter by Start Month:&nbsp;
            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
              {months.map(month => <option key={month} value={month}>{month}</option>)}
            </select>
          </label>
        </div>

        <table className="task-table">
          <thead>
            <tr>
              <th>Task ID</th>
              <th>Employee Name</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.length > 0 ? filteredTasks.map(task => {
              const today = new Date();
              const startDate = new Date(task.startDate);
              const endDate = new Date(task.endDate + 'T23:59:59');
              const canComplete = today >= startDate && today <= endDate && task.status !== 'Complete';

              return (
                <tr key={task.dbKey} onClick={() => setSelectedTask(task)} className="task-row">
                  <td>{task.id}</td>
                  <td>{task.name}</td>
                  <td>{task.status}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan="3" style={{ textAlign: 'center' }}>No tasks found</td></tr>
            )}
          </tbody>
        </table>

        {/* Task details modal */}
        {selectedTask && (
          <div className="task-modal-overlay" onClick={() => setSelectedTask(null)}>
            <div className="task-modal-content" onClick={e => e.stopPropagation()}>
              <h3>Task Details</h3>
              <ul>
                <li><strong>Task Id:</strong> {selectedTask.id}</li>
                <li><strong>Task Title:</strong> {selectedTask.title}</li>
                <li><strong>Description:</strong> {selectedTask.description}</li>
                <li><strong>Start Date:</strong> {selectedTask.startDate}</li>
                <li><strong>End Date:</strong> {selectedTask.endDate}</li>
                <li><strong>Status:</strong> {selectedTask.status}</li>
              </ul>

              {/* Complete button */}
              <button
                className="complete-btn"
                disabled={new Date(selectedTask.endDate + 'T23:59:59') < new Date() || selectedTask.status === 'Complete'}
                onClick={() => handleCompleteTask(selectedTask)}
              >
                Complete
              </button>

              <button
                onClick={() => setSelectedTask(null)}
                style={{ marginLeft: '10px', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </EmployeeLayout>
  );
}

export default EmployeeTaskView;
