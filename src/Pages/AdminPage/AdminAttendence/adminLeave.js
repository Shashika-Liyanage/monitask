import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import './adminLeave.css';
import toast, { Toaster } from "react-hot-toast";

// Import Realtime Database services
import { database } from '../../../Service/FirebaseConfig'; // Import 'database' from your config
import { ref, onValue, update, push, serverTimestamp } from 'firebase/database';


function AdminLeaveReq() {
  // Local data state is replaced by fetching from Firebase
  const [leaveRequests, setLeaveRequests] = useState([]); 
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  // State for adding a new request (Admin initiated)
  const [newRequest, setNewRequest] = useState({
    empId: '',
    employee: '',
    startDate: '',
    endDate: '',
    type: 'Annual', // Renamed from leaveType to match Employee component
    description: '',
  });

  const [filters, setFilters] = useState({
    status: 'Pending', // Default to showing only Pending requests for Admin
    id: '',
    date: '',
  });


  // --- 1. REAL-TIME DATA FETCHING ---
  useEffect(() => {
    const leaveRef = ref(database, 'leaveRequests');
    
    const unsubscribe = onValue(leaveRef, (snapshot) => {
      const data = snapshot.val();
      const requests = [];
      
      if (data) {
        // Convert object of objects into an array, adding the Firebase ID
        for (let id in data) {
          requests.push({
            id, // The unique Firebase key (used as LeaveReq ID)
            ...data[id],
          });
        }
      }

      // Sort by creation time
      requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); 
      
      setLeaveRequests(requests);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leave requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  // --- 2. FIREBASE UPDATE HANDLER ---
  const handleUpdateStatus = async (id, newStatus, reason = '') => {
    // Only proceed if an ID is present (from Firebase)
    if (!id) return; 

    try {
      // Create a reference to the specific request using the Firebase key
      const leaveItemRef = ref(database, `leaveRequests/${id}`);
      
      // Use 'update' to apply the new status and reason
      await update(leaveItemRef, {
        status: newStatus,
        reason: reason,
        reviewedAt: serverTimestamp(),
      });

      toast.success(`Request ${newStatus} successfully!`);
      setSelectedRequest(null); // Close the modal
      setRejectionReason('');
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast.error(`Failed to update status.`);
    }
  };


  // --- 3. FILTERING LOGIC (Using fetched Firebase data) ---
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const filteredRequests = leaveRequests.filter((req) => {
    const statusMatch =
      filters.status === 'All' || req.status === filters.status;
    // Filter by the unique Firebase ID
    const idMatch = req.id.toString().includes(filters.id); 
    // The Employee component saves the dates as YYYY-MM-DD
    const dateMatch = !filters.date || req.fromDate === filters.date; 
    return statusMatch && idMatch && dateMatch;
  });


  // --- 4. ADMIN INITIATED LEAVE REQUEST (Optional but included) ---
  const handleFormSubmit = async () => {
    if (
      !newRequest.empId ||
      !newRequest.employee ||
      !newRequest.startDate ||
      !newRequest.endDate ||
      !newRequest.description
    ) {
      toast.error('Please fill all fields.');
      return;
    }

    try {
      const leaveRef = ref(database, 'leaveRequests');
      
      await push(leaveRef, {
        ...newRequest,
        status: 'Approved', // Admin requests are often auto-approved
        reason: 'Admin initiated request',
        createdAt: serverTimestamp(), 
        // Use 'employeeId' to match the employee component's schema
        employeeId: newRequest.empId, 
        toDate: newRequest.endDate,
        fromDate: newRequest.startDate,
      });

      toast.success('New leave request submitted (Admin Initiated)');
      setShowForm(false);
      // Reset form
      setNewRequest({ empId: '', employee: '', startDate: '', endDate: '', type: 'Annual', description: '' });
    } catch (error) {
      console.error("Error submitting admin-initiated request:", error);
      toast.error('Failed to submit request.');
    }
  };

  if (loading) {
    return <AdminLayout><div className="loading-state">Loading Leave Requests...</div></AdminLayout>;
  }


  return (
    <AdminLayout>
      <Toaster />
      <div className="leave-req-container">
        <div className="leave-req-topbar">
          <h2 className="leave-req-title">Leave Requests</h2>
          <button
            className="leave-req-btn-request"
            onClick={() => setShowForm(true)}
          >
            Request Leave (Admin)
          </button>
        </div>

        <div className="leave-req-filters">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <input
            type="text"
            name="id"
            placeholder="LeaveReq ID (Firebase Key)"
            value={filters.id}
            onChange={handleFilterChange}
          />

          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
          />
        </div>

        <div className="leave-req-table-wrapper">
          <table className="leave-req-table">
            <thead>
              <tr>
                <th>LeaveReq ID</th>
                <th>EMP ID</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  // Use the Firebase 'id' as the key and for selection
                  <tr key={req.id} onClick={() => setSelectedRequest(req)}>
                    <td>{req.id}</td> 
                    <td>{req.employeeId || req.empId}</td>
                    <td>{req.employee}</td>
                    <td>{req.type}</td>
                    <td>{req.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="leave-req-no-data">
                    No matching leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Leave Details Modal (Decision Logic) */}
        {selectedRequest && (
          <div className="leave-popup-overlay">
            <div className="leave-popup-content">
              <button
                className="leave-popup-close"
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
              >
                &times;
              </button>
              <h3>Leave Details</h3>
              {/* Use req.id (Firebase Key) */}
              <p><strong>LeaveReq ID:</strong> {selectedRequest.id}</p>
              <p><strong>EMP ID:</strong> {selectedRequest.employeeId || selectedRequest.empId}</p>
              <p><strong>Employee:</strong> {selectedRequest.employee}</p>
              <p><strong>Start Date:</strong> {selectedRequest.fromDate || selectedRequest.startDate}</p>
              <p><strong>End Date:</strong> {selectedRequest.toDate || selectedRequest.endDate}</p>
              <p><strong>Type:</strong> {selectedRequest.type}</p>
              <p><strong>Status:</strong> {selectedRequest.status}</p>
              <p><strong>Description:</strong> {selectedRequest.description}</p>

              {selectedRequest.status === 'Rejected' && selectedRequest.reason && (
                <p><strong>Rejection Reason:</strong> {selectedRequest.reason}</p>
              )}

              {/* Decision buttons visible ONLY for Pending status */}
              {selectedRequest.status === 'Pending' && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                  <button
                    className="leave-req-btn-request"
                    style={{ backgroundColor: '#28a745', color: 'white', border: 'none' }}
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'Approved')} // FIREBASE APPROVE
                  >
                    Approve
                  </button>

                  <button
                    className="leave-req-btn-request"
                    style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}
                    // Temporary state to show rejection input box
                    onClick={() => setSelectedRequest({ ...selectedRequest, status: 'Rejecting' })}
                  >
                    Reject
                  </button>
                </div>
              )}

              {/* Rejection Reason Input Box */}
              {selectedRequest.status === 'Rejecting' && (
                <div style={{ marginTop: '15px' }}>
                  <label htmlFor="rejection">Rejection Reason:</label>
                  <textarea
                    id="rejection"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason..."
                    style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          toast.error('Please enter a reason before rejecting.');
                          return;
                        }
                        // FIREBASE REJECT
                        handleUpdateStatus(selectedRequest.id, 'Rejected', rejectionReason); 
                      }}
                      className="leave-req-btn-request"
                      style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setSelectedRequest({ ...selectedRequest, status: 'Pending' })}
                      className="leave-req-btn-request"
                      style={{ backgroundColor: '#ccc', color: '#333', border: 'none' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Leave Form Modal (Updated to use Firebase push) */}
        {showForm && (
          <div className="leave-popup-overlay">
            <div className="leave-popup-content">
              <button className="leave-popup-close" onClick={() => setShowForm(false)}>&times;</button>
              <h3>Request Leave (Admin Initiated)</h3>
              
              {/* Removed ID input as Firebase generates the ID */}
              <input type="text" placeholder="EMP ID" value={newRequest.empId} onChange={(e) => setNewRequest({ ...newRequest, empId: e.target.value })} />
              <input type="text" placeholder="Employee Name" value={newRequest.employee} onChange={(e) => setNewRequest({ ...newRequest, employee: e.target.value })} />
              <input type="date" placeholder="Start Date" value={newRequest.startDate} onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })} />
              <input type="date" placeholder="End Date" value={newRequest.endDate} onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })} />
              <select value={newRequest.type} onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}>
                <option value="Annual">Annual</option>
                <option value="Casual">Casual</option>
                <option value="Medical">Medical</option>
              </select>
              <textarea placeholder="Description" rows="3" value={newRequest.description} onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}></textarea>
              <button className="leave-req-btn-request" style={{ marginTop: '10px' }} onClick={handleFormSubmit}>OK</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminLeaveReq;