import React, { useState } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import Person3RoundedIcon from '@mui/icons-material/Person3Rounded';
import './adminAttendance.css';
import { useNavigate } from 'react-router-dom';


function AdminAttendanceReq() {
  const mockData = [
    { id: 'A001', empId: 'E123', date: '2025-08-05', checkIn: '08:30', checkOut: '17:00', attendance: 'Present', status: 'Checked' },
    { id: 'A002', empId: 'E124', date: '2025-08-05', checkIn: '09:00', checkOut: '17:30', attendance: 'Present', status: 'Checked' },
    { id: 'A003', empId: 'E125', date: '2025-08-05', checkIn: '08:45', checkOut: '17:15', attendance: 'Present', status: 'Checked' },
    { id: 'A004', empId: 'E126', date: '2025-08-05', checkIn: '08:00', checkOut: '16:30', attendance: 'Present', status: 'Checked' },
    { id: 'A005', empId: 'E127', date: '2025-08-05', checkIn: '09:15', checkOut: '18:00', attendance: 'Late', status: 'Pending' },
  ];
const navigate = useNavigate();

  // New states to track filter inputs
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEmpId, setFilterEmpId] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Filter data based on inputs
  const filteredData = mockData.filter((row) => {
    const matchesStatus = filterStatus ? row.attendance === filterStatus : true;
    const matchesEmpId = filterEmpId ? row.empId.toLowerCase().includes(filterEmpId.toLowerCase()) : true;
    const matchesDate = filterDate ? row.date === filterDate : true;

    return matchesStatus && matchesEmpId && matchesDate;
  });

  return (
    <AdminLayout>
      <div className="attendance-req-container">
        <h2 className="attendance-req-title">All Employees</h2>

        <div className="attendance-req-filters">
          <select
            className="attendance-req-input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Select Status</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
          </select>
          <input
            type="text"
            placeholder="Employee ID"
            className="attendance-req-input"
            value={filterEmpId}
            onChange={(e) => setFilterEmpId(e.target.value)}
          />
          <input
            type="date"
            className="attendance-req-input"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>

        <div className="attendance-req-table-wrapper">
          <table className="attendance-req-table">
            <thead>
              <tr>
                <th>Attendance_ID</th>
                <th>Employee_ID</th>
                <th>Date</th>
                <th>CheckIn_Time</th>
                <th>CheckOut_Time</th>
                <th>Attendance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.empId}</td>
                  <td>{row.date}</td>
                  <td>{row.checkIn}</td>
                  <td>{row.checkOut}</td>
                  <td>{row.attendance}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="attendance-req-cards">
          {filteredData.map((emp) => (
            <div className="attendance-req-card" key={emp.empId}>
              <div className="attendance-req-avatar">
                <Person3RoundedIcon className="attendance-req-avatar-icon" />
              </div>
              <div className="attendance-req-card-content">
                <strong>{emp.empId}</strong>
                <p>{emp.attendance}</p>
              </div>
              <div className="attendance-req-status-dot"></div>
            </div>
          ))}
        </div>

        <div className="attendance-req-actions">
          <button
  className="attendance-req-btn attendance-req-btn-leave-custom"
  onClick={() => navigate('/adminLeave')}
>
  Leave
</button>

          <button className="attendance-req-btn attendance-req-btn-ok-custom">OK</button>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminAttendanceReq;
