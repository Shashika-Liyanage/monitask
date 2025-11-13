import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import './adminLeave.css';
import toast, { Toaster } from "react-hot-toast";

// Import Realtime Database services
import { database } from '../../../Service/FirebaseConfig';
import { ref, onValue, update, push, serverTimestamp } from 'firebase/database';

function AdminLeaveReq() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [newRequest, setNewRequest] = useState({
    empId: '',
    employee: '',
    startDate: '',
    endDate: '',
    type: 'Annual',
    description: '',
  });

  const [filters, setFilters] = useState({
    status: 'Pending',
    id: '',
    date: '',
  });

  // --- FETCH LEAVE REQUESTS IN REALTIME ---
  useEffect(() => {
    const leaveRef = ref(database, 'leaveRequests');
    const unsubscribe = onValue(leaveRef, (snapshot) => {
      const data = snapshot.val();
      const requests = [];

      if (data) {
        for (let id in data) {
          requests.push({
            id,
            ...data[id],
          });
        }
      }

      requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setLeaveRequests(requests);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching leave requests:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- GENERATE AUTOMATED LEAVE ID (LEV001, LEV002, etc.) ---
  const generateLeaveCode = () => {
    let maxNum = 0;
    for (const r of leaveRequests) {
      if (r.leaveCode && typeof r.leaveCode === 'string') {
        const m = r.leaveCode.match(/^LEV0*([0-9]+)$/i);
        if (m && m[1]) {
          const n = parseInt(m[1], 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
    }
    const next = maxNum + 1;
    return 'LEV' + String(next).padStart(3, '0');
  };

  // --- UPDATE STATUS HANDLER ---
  const handleUpdateStatus = async (id, newStatus, reason = '') => {
    if (!id) return;
    try {
      const leaveItemRef = ref(database, `leaveRequests/${id}`);
      await update(leaveItemRef, {
        status: newStatus,
        reason: reason,
        reviewedAt: serverTimestamp(),
      });
      toast.success(`Request ${newStatus} successfully!`);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast.error(`Failed to update status.`);
    }
  };

  // --- FILTER HANDLER ---
  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const filteredRequests = leaveRequests.filter((req) => {
    const statusMatch =
      filters.status === 'All' || req.status === filters.status;
    const idValue = req.leaveCode || req.id;
    const idMatch = idValue && idValue.toString().toLowerCase().includes(filters.id.toLowerCase());
    const dateMatch = !filters.date || req.fromDate === filters.date;
    return statusMatch && idMatch && dateMatch;
  });

  // --- ADMIN INITIATED LEAVE SUBMISSION ---
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
      const leaveCode = generateLeaveCode();

      await push(leaveRef, {
        ...newRequest,
        status: 'Pending',
        reason: '',
        createdAt: serverTimestamp(),
        employeeId: newRequest.empId,
        toDate: newRequest.endDate,
        fromDate: newRequest.startDate,
        leaveCode,
      });

      toast.success(`New leave request submitted (${leaveCode}). Awaiting approval.`);
      setShowForm(false);
      setNewRequest({
        empId: '',
        employee: '',
        startDate: '',
        endDate: '',
        type: 'Annual',
        description: '',
      });
    } catch (error) {
      console.error("Error submitting admin-initiated request:", error);
      toast.error('Failed to submit request.');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-state">Loading Leave Requests...</div>
      </AdminLayout>
    );
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
            Request Leave
          </button>
        </div>

        {/* --- FILTER SECTION --- */}
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

          {/* Leave ID filter hidden, only date shown */}
          <input
            type="date"
            name="date"
            value={filters.date}
            onChange={handleFilterChange}
          />
        </div>

        {/* --- TABLE SECTION (Leave ID hidden) --- */}
        <div className="leave-req-table-wrapper">
          <table className="leave-req-table">
            <thead>
              <tr>
                {/* LeaveReq ID hidden */}
                <th>EMP ID</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="leave-row"
                    onClick={() => setSelectedRequest(req)}
                  >
                    {/* LeaveReq ID hidden */}
                    <td>{req.employeeId || req.empId}</td>
                    <td>{req.employee}</td>
                    <td>{req.type}</td>
                    <td>{req.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="leave-req-no-data">
                    No matching leave requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* --- LEAVE DETAILS MODAL (Leave ID hidden) --- */}
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
                ×
              </button>

              <h3>Leave Details</h3>

              <div className="leave-popup-detail">
                {/* LeaveReq ID hidden */}
                <p><strong>EMP ID:</strong> <span>{selectedRequest.employeeId || selectedRequest.empId}</span></p>
                <p><strong>Employee:</strong> <span>{selectedRequest.employee}</span></p>
                <p><strong>Start Date:</strong> <span>{selectedRequest.fromDate || selectedRequest.startDate}</span></p>
                <p><strong>End Date:</strong> <span>{selectedRequest.toDate || selectedRequest.endDate}</span></p>
                <p><strong>Type:</strong> <span>{selectedRequest.type}</span></p>
                <p><strong>Status:</strong> <span>{selectedRequest.status}</span></p>
              </div>

              <div className="description">
                <strong>Description:</strong>
                <div style={{ marginTop: 6 }}>{selectedRequest.description || '—'}</div>
              </div>

              {selectedRequest.status === 'Rejected' && selectedRequest.reason && (
                <div style={{ marginTop: 10 }}>
                  <strong>Rejection Reason:</strong>
                  <div style={{ marginTop: 6, color: '#6b6b6b' }}>{selectedRequest.reason}</div>
                </div>
              )}

              {selectedRequest.status === 'Pending' && (
                <div className="leave-action-row">
                  <button
                    className="btn-approve"
                    onClick={() => handleUpdateStatus(selectedRequest.id, 'Approved')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => setSelectedRequest({ ...selectedRequest, status: 'Rejecting' })}
                  >
                    Reject
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => { setSelectedRequest(null); setRejectionReason(''); }}
                  >
                    Close
                  </button>
                </div>
              )}

              {selectedRequest.status === 'Rejecting' && (
                <div className="rejection-box">
                  <label htmlFor="rejection"><strong>Rejection Reason</strong></label>
                  <textarea
                    id="rejection"
                    rows="4"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason..."
                  />
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      className="btn-reject confirm"
                      onClick={() => {
                        if (!rejectionReason.trim()) {
                          toast.error('Please enter a reason before rejecting.');
                          return;
                        }
                        handleUpdateStatus(selectedRequest.id, 'Rejected', rejectionReason);
                      }}
                    >
                      Confirm Reject
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => setSelectedRequest({ ...selectedRequest, status: 'Pending' })}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- ADD LEAVE FORM MODAL --- */}
        {showForm && (
          <div className="leave-popup-overlay">
            <div className="leave-popup-content wide">
              <button className="leave-popup-close" onClick={() => setShowForm(false)}>&times;</button>
              <h3>Request Leave</h3>

              <input
                type="text"
                placeholder="Employee ID *"
                value={newRequest.empId}
                onChange={(e) => setNewRequest({ ...newRequest, empId: e.target.value })}
              />
              <input
                type="text"
                placeholder="Employee Name *"
                value={newRequest.employee}
                onChange={(e) => setNewRequest({ ...newRequest, employee: e.target.value })}
              />
              <input
                type="date"
                placeholder="Start Date"
                value={newRequest.startDate}
                onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
              />
              <input
                type="date"
                placeholder="End Date"
                value={newRequest.endDate}
                onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
              />
              <select
                value={newRequest.type}
                onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
              >
                <option value="Annual">Annual</option>
                <option value="Casual">Casual</option>
                <option value="Medical">Medical</option>
              </select>
              <textarea
                placeholder="Description *"
                rows="3"
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              ></textarea>

              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button className="leave-req-btn-request" onClick={handleFormSubmit}>Submit</button>
                <button className="btn-cancel" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminLeaveReq;