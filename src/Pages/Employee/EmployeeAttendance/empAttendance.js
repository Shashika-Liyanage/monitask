import React, { useState } from 'react';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './empAttendance.css';
import { useNavigate } from 'react-router-dom';


function EmployeeAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [extraTime, setExtraTime] = useState('');
  const [showFullView, setShowFullView] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth()); // 0 = Jan

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowModal(true);
    setCheckIn('');
    setCheckOut('');
    setExtraTime('');
  };

    const attendanceRecords = [
  { date: '2025-07-01', checkIn: '09:00 AM', checkOut: '05:00 PM', status: 'Present' },
  { date: '2025-07-02', checkIn: '-', checkOut: '-', status: 'Absent' },
  { date: '2025-08-01', checkIn: '09:10 AM', checkOut: '05:10 PM', status: 'Present' },
];
const navigate = useNavigate();

  const handleTimeChange = () => {
    if (!checkIn || !checkOut) return;

    const [inHour, inMin] = checkIn.split(':').map(Number);
    const [outHour, outMin] = checkOut.split(':').map(Number);
    const checkInMins = inHour * 60 + inMin;
    const checkOutMins = outHour * 60 + outMin;

    const workStart = 9 * 60; // 9:00
    const workEnd = 17 * 60;  // 17:00

    const worked = checkOutMins - checkInMins;
    const standardWork = workEnd - workStart;
    const extra = worked - standardWork;

  


    setExtraTime(extra > 0 ? `${Math.floor(extra / 60)}h ${extra % 60}m` : '0h 0m');
  };

  return (
    <EmployeeLayout>
      <div className="attendance-container">
        <h2 className="attendance-title">Employee Attendance</h2>

        <div className="attendance-top-section">
          <div className="calendar-wrapper">
            <Calendar
              onChange={handleDateClick}
              value={selectedDate}
              className="attendance-calendar"
            />
          </div>

          <div className="attendance-summary-vertical">
            <div className="attendance-card present">
              <p>Present Days</p>
              <h3>22</h3>
            </div>
            <div className="attendance-card absent">
              <p>Absent Days</p>
              <h3>2</h3>
            </div>
            <div className="attendance-card late">
              <p>Late Days</p>
              <h3>1</h3>
            </div>
          </div>
        </div>

        <div className="attendance-table-section">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check-In</th>
                <th>Check-Out</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2025-07-29</td>
                <td>Present</td>
                <td>09:01 AM</td>
                <td>05:03 PM</td>
              </tr>
              <tr>
                <td>2025-07-30</td>
                <td>Absent</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="attendance-actions">
 <button className="btn-secondary" onClick={() => setShowFullView(true)}>
  View All Attendance
</button>

  <button className="btn-primary" onClick={() => navigate('/employeeLeave')}>
    Leave Request
  </button>
</div>


        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Attendance Details</h3>
              <p>Date: {selectedDate.toDateString()}</p>

              <label>Check-In Time:</label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  setTimeout(handleTimeChange, 0);
                }}
              />

              <label>Check-Out Time:</label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  setTimeout(handleTimeChange, 0);
                }}
              />

              <p>Extra Time: <strong>{extraTime}</strong></p>

              <button onClick={() => setShowModal(false)} className="btn-primary" style={{ marginTop: '15px' }}>Save</button>
            </div>
          </div>
        )}

        {showFullView && (
  <div className="full-attendance-overlay" onClick={() => setShowFullView(false)}>
    <div className="full-attendance-modal" onClick={(e) => e.stopPropagation()}>
      <h3>All Attendance Records</h3>

      <label>Filter by Month:</label>
      <select
        value={filterMonth}
        onChange={(e) => setFilterMonth(parseInt(e.target.value))}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <option key={i} value={i}>
            {new Date(0, i).toLocaleString('default', { month: 'long' })}
          </option>
        ))}
      </select>

      <table className="full-attendance-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Check-In</th>
            <th>Check-Out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendanceRecords
            .filter((rec) => new Date(rec.date).getMonth() === filterMonth)
            .map((rec, idx) => (
              <tr key={idx}>
                <td>{rec.date}</td>
                <td>{rec.checkIn}</td>
                <td>{rec.checkOut}</td>
                <td>{rec.status}</td>
              </tr>
            ))}
        </tbody>
      </table>

      <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => setShowFullView(false)}>
        Close
      </button>
    </div>
  </div>
)}

      </div>
    </EmployeeLayout>
  );
}

export default EmployeeAttendance;
