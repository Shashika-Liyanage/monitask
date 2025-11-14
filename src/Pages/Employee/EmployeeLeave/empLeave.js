import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL';
import './empLeave.css';

// Import Realtime Database services
import { database } from '../../../Service/FirebaseConfig'; // Import 'database' from your config
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import toast, { Toaster } from "react-hot-toast";
// Assuming you have an authentication context or helper to get the user ID
// import { useAuth } from '../../../hooks/useAuth'; 

/* ========== Admin-like Toast component (added) ========== */
/* Matches the design in your adminLeave.css toast */
const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast-container">
      <div className="toast-message">
        {message}
      </div>
    </div>
  );
};
/* ======================================================= */

function Employeeleave() {
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded for demonstration. **Replace with actual authenticated user ID.**
  const currentUserId = 'emp_12345'; 

  // State for the new leave request form
  const [newLeave, setNewLeave] = useState({
    employeeId: currentUserId,
    type: 'Sick Off',
    fromDate: '',
    toDate: '',
    description: '',
    status: 'Pending', // Default status on submission
  });

  // --- Toast state (added) ---
  const [toastState, setToastState] = useState({ show: false, message: '' });
  const showToast = (message) => setToastState({ show: true, message });
  const hideToast = () => setToastState({ show: false, message: '' });

  // Compute today's date string in YYYY-MM-DD for min attributes and comparisons
  const getTodayString = () => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const today = getTodayString();

  // --- Real-Time Data Fetching (useEffect) ---
  useEffect(() => {
    // 1. Create a reference to the 'leaveRequests' node in the Realtime Database
    const leaveRef = ref(database, 'leaveRequests');
    
    // 2. Set up a real-time listener (onValue)
    const unsubscribe = onValue(leaveRef, (snapshot) => {
      const data = snapshot.val();
      const leaves = [];
      
      if (data) {
        // Realtime DB returns an object of objects, so we need to convert it to an array
        for (let id in data) {
          leaves.push({
            id,
            ...data[id],
          });
        }
      }

      // Sort by creation time (assuming 'createdAt' is saved)
      leaves.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); 
      
      setLeaveHistory(leaves);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leave requests from Realtime DB: ", error);
      setLoading(false);
    });

    // 3. Clean up the listener on component unmount
    return () => unsubscribe();
  }, []);

  // --- Form Handlers ---

  const handleOpenModal = () => setShowModal(true);
  
  const handleCloseModal = () => {
    setShowModal(false);
    // Reset form state on close/cancel
    setNewLeave({
      employeeId: currentUserId,
      type: 'Sick Off',
      fromDate: '',
      toDate: '',
      description: '',
      status: 'Pending',
    });
  };

  const handleFormChange = (e) => {
    setNewLeave({ ...newLeave, [e.target.name]: e.target.value });
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!newLeave.fromDate || !newLeave.toDate || !newLeave.description || !newLeave.type) {
        alert("Please fill in all required fields.");
        return;
    }

    // Validation: fromDate/toDate must not be before today
    // and toDate must not be earlier than fromDate
    try {
      const from = new Date(newLeave.fromDate + 'T00:00:00');
      const to = new Date(newLeave.toDate + 'T00:00:00');
      const todayDate = new Date(getTodayString() + 'T00:00:00');

      if (from < todayDate || to < todayDate) {
        // Show both toast types (react-hot-toast and admin-style)
        toast.error('Selected dates cannot be before today.');
        showToast('Selected dates cannot be before today.');
        return;
      }

      if (to < from) {
        toast.error('End date cannot be earlier than start date.');
        showToast('End date cannot be earlier than start date.');
        return;
      }

      const leaveRef = ref(database, 'leaveRequests');
      
      // Use 'push' to create a unique key and add the data
      await push(leaveRef, {
        ...newLeave,
        // Using serverTimestamp() for accurate, non-local creation time
        createdAt: serverTimestamp(), 
      });

      // Keep existing react-hot-toast behavior
      toast.success('Leave request submitted successfully!');

      // ALSO show admin-style toast (matching adminLeave)
      showToast('Leave request submitted successfully!');

      handleCloseModal();
    } catch (error) {
      console.error("Error submitting leave request to Realtime DB: ", error);
      // Keep existing react-hot-toast behavior
      toast.error('Failed to submit leave request. Check console for details.');

      // ALSO show admin-style toast for error
      showToast('Failed to submit leave request.');
    }
  };

  // --- Display Logic ---
  
  const handleToggleHistory = () => setShowHistory((prev) => !prev);
  const handleMonthChange = (e) => setSelectedMonth(e.target.value);

  // Filter leaves based on selected month (uses the fetched leaveHistory)
  const filteredLeaves = leaveHistory.filter(({ toDate }) => {
    if (selectedMonth === 'All') return true;
    
    // Note: Dates must be in 'YYYY-MM-DD' format from the input/database
    const monthNumber = new Date(toDate).getMonth() + 1; 
    return monthNumber === parseInt(selectedMonth, 10);
  });

  // Calculate summary counts from the real-time data
  const approvedCount = leaveHistory.filter(l => l.status === 'Approved').length;
  const pendingCount = leaveHistory.filter(l => l.status === 'Pending').length;
  const rejectedCount = leaveHistory.filter(l => l.status === 'Rejected').length;
  
  if (loading) {
    return <EmployeeLayout><div className="loading-state">Loading Leave Data...</div></EmployeeLayout>;
  }

  return (

    <EmployeeLayout>
      {/* Keep your existing react-hot-toast Toaster */}
      <Toaster />

      <div className="leave-container">
        <h2 className="leave-title">Leave Request</h2>

        <div className="leave-main-section">
          <div className="leave-calendar-modern">
            <Calendar onChange={setDate} value={date} className="modern-calendar" />
          </div>

          <div className="leave-summary-column">
            <div className="leave-card approved">
              <p>Approved Leaves</p>
              <h3>{approvedCount}</h3>
            </div>
            <div className="leave-card pending">
              <p>Pending Leaves</p>
              <h3>{pendingCount}</h3>
            </div>
            <div className="leave-card rejected">
              <p>Rejected Leaves</p>
              <h3>{rejectedCount}</h3>
            </div>
          </div>
        </div>

        {/* Leave History Table */}
        <div className="leave-table-container">
          <h3 style={{ marginBottom: '10px' }}>Recent Leave History (Real-time)</h3>
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
                    No leave records found.
                  </td>
                </tr>
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
          <button className="submit-leave-btn" onClick={handleOpenModal}>
            Request Leave
          </button>
        </div>

        {/* Leave Request Modal */}
        {showModal && (
          <div className="modal-wrapper">
            <div className="modal-overlay" onClick={handleCloseModal}></div>

            <div className="leave-modal">
              <h3 className="modal-title">Leave Request Form</h3>
              <form className="leave-form" onSubmit={handleLeaveSubmit}>
                
                <label>
                  Employee ID<span className="required">*</span>
                  <input type="text" value={currentUserId} readOnly />
                </label>

                <label>
                  Leave Type<span className="required">*</span>
                  <select name="type" value={newLeave.type} onChange={handleFormChange} required>
                    <option value="Sick Off">Sick Off</option>
                    <option value="Casual">Casual</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Half Day">Half Day</option>
                  </select>
                </label>

                <label>
                  Dates<span className="required">*</span>
                  <div className="date-range">
                    <input 
                      type="date" 
                      name="fromDate" 
                      value={newLeave.fromDate} 
                      onChange={handleFormChange} 
                      required
                      min={today}            /* prevents picking past dates in UI */
                    />
                    <span className="arrow">→</span>
                    <input 
                      type="date" 
                      name="toDate" 
                      value={newLeave.toDate} 
                      onChange={handleFormChange} 
                      required
                      min={today}            /* prevents picking past dates in UI */
                    />
                  </div>
                </label>

                <label>
                  Description<span className="required">*</span>
                  <textarea 
                    name="description" 
                    value={newLeave.description} 
                    onChange={handleFormChange} 
                    placeholder="Enter description" 
                    rows="3" 
                    required
                  ></textarea>
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
          </div>
        )}

        {/* ===== Render admin-like toast (added) ===== */}
        {toastState.show && <Toast message={toastState.message} onClose={hideToast} />}
        {/* =========================================== */}
      </div>
    </EmployeeLayout>
  );
}

export default Employeeleave;
