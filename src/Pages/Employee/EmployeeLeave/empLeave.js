import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL';
import './empLeave.css';


const allLeaveHistory = [
  {
    toDate: '2025-08-02',
    fromDate: '2025-08-01',
    description: 'Family trip to Kandy',
    type: 'Casual',
    status: 'Approved',
  },
  {
    toDate: '2025-07-15',
    fromDate: '2025-07-15',
    description: 'Doctor appointment',
    type: 'Sick Off',
    status: 'Pending',
  },
  {
    toDate: '2025-06-25',
    fromDate: '2025-06-24',
    description: 'Attending wedding',
    type: 'Unpaid',
    status: 'Rejected',
  },
  {
    toDate: '2025-05-10',
    fromDate: '2025-05-10',
    description: 'Half-day for personal work',
    type: 'Half Day',
    status: 'Approved',
  },
];

function Employeeleave() {
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('All');

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const handleToggleHistory = () => setShowHistory((prev) => !prev);

  const handleMonthChange = (e) => setSelectedMonth(e.target.value);

  const filteredLeaves = allLeaveHistory.filter(({ toDate }) => {
    if (selectedMonth === 'All') return true;
    const monthNumber = new Date(toDate).getMonth() + 1;
    return monthNumber === parseInt(selectedMonth, 10);
  });

  return (
    <EmployeeLayout>
      <div className="leave-container">
        <h2 className="leave-title">Leave Request</h2>

        <div className="leave-main-section">
          <div className="leave-calendar-modern">
            <Calendar onChange={setDate} value={date} className="modern-calendar" />
          </div>

          <div className="leave-summary-column">
            <div className="leave-card approved">
              <p>Approved Leaves</p>
              <h3>5</h3>
            </div>
            <div className="leave-card pending">
              <p>Pending Leaves</p>
              <h3>2</h3>
            </div>
            <div className="leave-card rejected">
              <p>Rejected Leaves</p>
              <h3>1</h3>
            </div>
          </div>
        </div>

        <div className="leave-table-container">
          <table className="leave-table">
            <thead>
              <tr>
                <th>To Date</th>
                <th>From Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>
                    No leave records found for selected month.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(({ toDate, fromDate, description, type, status }, idx) => (
                  <tr key={idx}>
                    <td>{toDate}</td>
                    <td>{fromDate}</td>
                    <td>{description}</td>
                    <td>{type}</td>
                    <td className={`status-${status.toLowerCase()}`}>{status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="leave-actions">
          <button className="submit-leave-btn" onClick={handleOpenModal}>
            Request Leave
          </button>
          <button className="view-history-btn" onClick={handleToggleHistory}>
            {showHistory ? 'Hide Leave History' : 'View Leave History'}
          </button>
        </div>

        {/* SINGLE OVERLAY + MODAL WRAPPER */}
        {(showModal || showHistory) && (
          <div className="modal-wrapper">
            <div className="modal-overlay" onClick={showModal ? handleCloseModal : handleToggleHistory}></div>

            {showModal && (
              <div className="leave-modal">
                <h3 className="modal-title">Leave Request Form</h3>
                <form className="leave-form">
                  <label>
                    Employee ID<span className="required">*</span>
                    <input type="text" placeholder="Enter ID" required />
                  </label>

                  <label>
                    Leave Type<span className="required">*</span>
                    <select required>
                      <option>Sick Off</option>
                      <option>Unpaid</option>
                      <option>Half Day</option>
                      <option>Morning</option>
                      <option>Evening</option>
                    </select>
                  </label>

                 

                  <label>
                    Dates<span className="required">*</span>
                    <div className="date-range">
                      <input type="date" />
                      <span className="arrow">→</span>
                      <input type="date" />
                    </div>
                  </label>

                  <label>
                    Description
                    <textarea placeholder="Enter description" rows="3"></textarea>
                  </label>

                  <div className="modal-actions">
                    <button type="submit" className="apply-btn">
                      Apply
                    </button>
                    <button type="button" className="cancel-btn" onClick={handleCloseModal}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {showHistory && (
              <div className="leave-modal history-modal">
                <h3 className="modal-title">Leave History</h3>

                <label htmlFor="month-select" style={{ fontWeight: '600' }}>
                  Select Month:
                </label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    borderRadius: '5px',
                    border: '1px solid #ccc',
                    marginBottom: '20px',
                    width: '100%',
                  }}
                >
                  <option value="All">All</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>

                <div className="history-table-wrapper" style={{ overflowY: 'auto', maxHeight: '60vh' }}>
                  <table className="leave-table">
                    <thead>
                      <tr>
                        <th>To Date</th>
                        <th>From Date</th>
                        <th>Description</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaves.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>
                            No leave records found for selected month.
                          </td>
                        </tr>
                      ) : (
                        filteredLeaves.map(({ toDate, fromDate, description, type, status }, idx) => (
                          <tr key={idx}>
                            <td>{toDate}</td>
                            <td>{fromDate}</td>
                            <td>{description}</td>
                            <td>{type}</td>
                            <td className={`status-${status.toLowerCase()}`}>{status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'center' }}>
                  <button type="button" className="cancel-btn" onClick={handleToggleHistory}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

export default Employeeleave;
