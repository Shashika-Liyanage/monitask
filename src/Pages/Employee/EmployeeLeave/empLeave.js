import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL';
import './empLeave.css';

import { getAuth } from "firebase/auth";
import { getDatabase, ref, onValue, push, serverTimestamp, get } from "firebase/database";
import app from '../../../Service/FirebaseConfig';

import toast, { Toaster } from "react-hot-toast";

function Employeeleave() {
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const auth = getAuth(app);
  const db = getDatabase(app);
  const [employeeData, setEmployeeData] = useState(null);

  // Fetch logged-in employee data
  useEffect(() => {
    const fetchEmployeeData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const employeeRef = ref(db, `createEmployee/newEmployee/${user.uid}`);
        const snapshot = await get(employeeRef);
        if (snapshot.exists()) setEmployeeData(snapshot.val());
      } catch (error) {
        console.error("Failed to fetch employee data:", error);
        toast.error("Failed to fetch employee data");
      }
    };
    const unsubscribe = auth.onAuthStateChanged(user => { if (user) fetchEmployeeData(); });
    return () => unsubscribe();
  }, []);

  const currentUserId = employeeData?.memberID || '';

  // Leave limits
  const LEAVE_LIMITS = { Annual: 5, Casual: 10, Medical: 10, 'Half Day': 3 };
  const TOTAL_LEAVE_LIMIT = 28;

  const [newLeave, setNewLeave] = useState({
    employeeId: currentUserId,
    type: 'Annual',
    fromDate: '',
    toDate: '',
    description: '',
    status: 'Pending',
  });

  const getTodayString = () => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const today = getTodayString();

  // Real-time leave fetching
  useEffect(() => {
    const leaveRef = ref(db, 'leaveRequests');
    const unsubscribe = onValue(leaveRef, snapshot => {
      const data = snapshot.val();
      const leaves = [];
      if (data) {
        for (let id in data) leaves.push({ id, ...data[id] });
      }
      leaves.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setLeaveHistory(leaves);
      setLoading(false);
    }, error => { console.error("Error fetching leave requests:", error); setLoading(false); });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = () => {
    setNewLeave(prev => ({ ...prev, employeeId: employeeData?.memberID || '', type: 'Annual' }));
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setNewLeave({ employeeId: employeeData?.memberID || '', type: 'Annual', fromDate: '', toDate: '', description: '', status: 'Pending' });
  };
  const handleFormChange = (e) => setNewLeave({ ...newLeave, [e.target.name]: e.target.value });

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!newLeave.fromDate || !newLeave.toDate || !newLeave.description || !newLeave.type) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      const from = new Date(newLeave.fromDate + 'T00:00:00');
      const to = new Date(newLeave.toDate + 'T00:00:00');
      const todayDate = new Date(getTodayString() + 'T00:00:00');

      if (from < todayDate || to < todayDate) {
        toast.error('Selected dates cannot be before today.');
        return;
      }
      if (to < from) {
        toast.error('End date cannot be earlier than start date.');
        return;
      }

      const currentYear = new Date().getFullYear();
      const employeeLeavesThisYear = leaveHistory.filter(
        l => l.employeeId === currentUserId && new Date(l.fromDate).getFullYear() === currentYear
      );

      // Prevent duplicate leave for same day
      const duplicateLeave = employeeLeavesThisYear.find(l => l.fromDate === newLeave.fromDate);
      if (duplicateLeave) {
        toast.error('You already have a leave request for this day.');
        return;
      }

      // Check type limits
      const leaveTypeCount = employeeLeavesThisYear.filter(l => l.type === newLeave.type).length;
      if (leaveTypeCount >= LEAVE_LIMITS[newLeave.type]) {
        toast.error(`You have reached the maximum ${newLeave.type} leaves for this year.`);
        return;
      }

      // Check total leave
      if (employeeLeavesThisYear.length >= TOTAL_LEAVE_LIMIT) {
        toast.error('You have reached your total leave limit for this year.');
        return;
      }

      // Submit leave
      const leaveRef = ref(db, 'leaveRequests');
      await push(leaveRef, { ...newLeave, createdAt: serverTimestamp() });
      toast.success('Leave request submitted successfully!');
      handleCloseModal();
    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast.error('Failed to submit leave request.');
    }
  };

  const filteredLeaves = leaveHistory
    .filter(l => l.employeeId === currentUserId)
    .filter(({ toDate }) => selectedMonth === 'All' || new Date(toDate).getMonth() + 1 === parseInt(selectedMonth));

  const approvedCount = leaveHistory.filter(l => l.status === 'Approved' && l.employeeId === currentUserId).length;
  const pendingCount = leaveHistory.filter(l => l.status === 'Pending' && l.employeeId === currentUserId).length;
  const rejectedCount = leaveHistory.filter(l => l.status === 'Rejected' && l.employeeId === currentUserId).length;

  if (loading) return <EmployeeLayout><div className="loading-state">Loading Leave Data...</div></EmployeeLayout>;

  return (
    <EmployeeLayout>
      <Toaster 
        position="bottom-center" 
        reverseOrder={false}
        toastOptions={{
          success: {
            style: { background: '#4CAF50', color: '#fff', fontWeight: 600 },
          },
          error: {
            style: { background: '#F44336', color: '#fff', fontWeight: 600 },
          },
          loading: {
            style: { background: '#2196F3', color: '#fff', fontWeight: 600 },
          },
        }}
      />

      <div className="leave-container">
        <h2 className="leave-title">Leave Request</h2>

        <div className="leave-main-section">
          <div className="leave-calendar-modern">
            <Calendar onChange={setDate} value={date} className="modern-calendar" />
          </div>
          <div className="leave-summary-column">
            <div className="leave-card approved"><p>Approved Leaves</p><h3>{approvedCount}</h3></div>
            <div className="leave-card pending"><p>Pending Leaves</p><h3>{pendingCount}</h3></div>
            <div className="leave-card rejected"><p>Rejected Leaves</p><h3>{rejectedCount}</h3></div>
          </div>
        </div>

        <div className="leave-table-container">
          <h3 style={{ marginBottom: '10px' }}>Recent Leave History</h3>
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
                <tr><td colSpan="5" style={{ textAlign: 'center', color: '#999' }}>No leave records found.</td></tr>
              ) : (
                filteredLeaves.map(({ toDate, fromDate, description, type, status, id }) => (
                  <tr key={id}>
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
          <button className="submit-leave-btn" onClick={handleOpenModal}>Request Leave</button>
        </div>

        {showModal && (
          <div className="modal-wrapper">
            {/* Overlay removed as requested - previously here was:
                <div className="modal-overlay" onClick={handleCloseModal}></div>
                Removing it prevents the dark background and outside-click close behavior.
            */}
            <div className="leave-modal">
              <h3 className="modal-title">Leave Request Form</h3>
              <form className="leave-form" onSubmit={handleLeaveSubmit}>
                <label>Employee ID<span className="required">*</span>
                  <input type="text" value={currentUserId} readOnly />
                </label>

                <label>Leave Type<span className="required">*</span>
                  <select name="type" value={newLeave.type} onChange={handleFormChange} required>
                    <option value="Annual">Annual</option>
                    <option value="Casual">Casual</option>
                    <option value="Medical">Medical</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </label>

                <label>Dates<span className="required">*</span>
                  <div className="date-range">
                    <input type="date" name="fromDate" value={newLeave.fromDate} onChange={handleFormChange} required min={today} />
                    <span className="arrow">→</span>
                    <input type="date" name="toDate" value={newLeave.toDate} onChange={handleFormChange} required min={today} />
                  </div>
                </label>

                <label>Description<span className="required">*</span>
                  <textarea name="description" value={newLeave.description} onChange={handleFormChange} placeholder="Enter description" rows="3" required />
                </label>

                <div className="modal-actions">
                  <button type="submit" className="apply-btn">Apply</button>
                  <button type="button" className="cancel-btn" onClick={handleCloseModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

export default Employeeleave;
