import React, { useState } from 'react';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL';
import './empTask.css';

const tasks = [
  {
    id: 1,
    title: 'Design Homepage',
    description: 'Create wireframe and design UI for homepage',
    startDate: '2025-07-01',
    endDate: '2025-07-05',
    status: 'Complete',
  },
  {
    id: 2,
    title: 'API Integration',
    description: 'Integrate backend API for user auth',
    startDate: '2025-07-06',
    endDate: '2025-07-15',
    status: 'Pending',
  },
  {
    id: 3,
    title: 'Testing',
    description: 'Perform unit and integration testing',
    startDate: '2025-08-01',
    endDate: '2025-08-10',
    status: 'Incomplete',
  },
  // Add more tasks here
];

// Helper to get month name from date string
const getMonthName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleString('default', { month: 'long' });
};

function EmployeeTask() {
  const [viewAllModalOpen, setViewAllModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterMonth, setFilterMonth] = useState('All');

  // Filter tasks by month for "View All" modal
  const filteredTasks =
    filterMonth === 'All'
      ? tasks
      : tasks.filter(task => getMonthName(task.startDate) === filterMonth);

  const months = [
    'All',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  return (
    <EmployeeLayout>
      <div className="task-container">
        <h2 className='task-tittle'>My Tasks</h2>
        <table className="task-table">
          <thead>
            <tr>
              <th>Task Id</th>
              <th>Task Title</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr
                key={task.id}
                className="task-row"
                onClick={() => setSelectedTask(task)}
              >
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="view-all-btn-container">
  <button
    className="view-all-btn"
    onClick={() => setViewAllModalOpen(true)}
  >
    View All Task Details
  </button>
</div>



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
      <button onClick={() => setSelectedTask(null)}>Close</button>
    </div>
  </div>
)}

{viewAllModalOpen && (
  <div className="task-modal-overlay" onClick={() => setViewAllModalOpen(false)}>
    <div className="task-modal-content large" onClick={e => e.stopPropagation()}>
      <h3>All Tasks</h3>
      <label>
        Filter by Start Month:&nbsp;
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
        >
          {months.map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </label>

      <table className="task-table full">
        <thead>
          <tr>
            <th>Task Id</th>
            <th>Task Title</th>
            <th>Description</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.length ? (
            filteredTasks.map(task => (
              <tr key={task.id}>
                <td>{task.id}</td>
                <td>{task.title}</td>
                <td>{task.description}</td>
                <td>{task.startDate}</td>
                <td>{task.endDate}</td>
                <td>{task.status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>
                No tasks found for selected month.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <button onClick={() => setViewAllModalOpen(false)}>Close</button>
    </div>
  </div>
)}

      </div>
    </EmployeeLayout>
  );
}

export default EmployeeTask;
