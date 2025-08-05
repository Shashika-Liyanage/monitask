import React, { useState } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import './adminLeave.css';

function AdminLeaveReq() {
  const [initialRequests] = useState([
    {
      id: 1,
      empId: 'EMP001',
      employee: 'John Doe',
      date: '2025-08-01',
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      status: 'Pending',
      reason: '',
      leaveType: 'Annual',
      description: 'Vacation leave for 3 days',
    },
    {
      id: 2,
      empId: 'EMP002',
      employee: 'Jane Smith',
      date: '2025-07-28',
      startDate: '2025-07-28',
      endDate: '2025-07-29',
      status: 'Approved',
      reason: '',
      leaveType: 'Medical',
      description: 'Medical leave due to fever',
    },
    {
      id: 3,
      empId: 'EMP003',
      employee: 'Sara Dan',
      date: '2025-07-30',
      startDate: '2025-07-30',
      endDate: '2025-07-31',
      status: 'Rejected',
      reason: 'Insufficient leave balance',
      leaveType: 'Casual',
      description: 'Casual leave request',
    },
    {
      id: 4,
      empId: 'EMP004',
      employee: 'Ann Perera',
      date: '2025-08-01',
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      status: 'Pending',
      reason: '',
      leaveType: 'Annual',
      description: 'Vacation leave for 3 days',
    },
  ]);

  const [leaveRequests, setLeaveRequests] = useState(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [newRequest, setNewRequest] = useState({
    id: '',
    empId: '',
    employee: '',
    startDate: '',
    endDate: '',
    leaveType: 'Annual',
    description: '',
  });

  const [filters, setFilters] = useState({
    status: 'All',
    id: '',
    date: '',
  });

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const filteredRequests = leaveRequests.filter((req) => {
    const statusMatch =
      filters.status === 'All' || req.status === filters.status;
    const idMatch = req.id.toString().includes(filters.id);
    const dateMatch = !filters.date || req.date === filters.date;
    return statusMatch && idMatch && dateMatch;
  });

  const handleFormSubmit = () => {
    if (
      !newRequest.id ||
      !newRequest.empId ||
      !newRequest.employee ||
      !newRequest.startDate ||
      !newRequest.endDate ||
      !newRequest.description
    ) {
      alert('Please fill all fields.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    const newLeave = {
      ...newRequest,
      date: today,
      status: 'Pending',
      reason: '',
    };

    setLeaveRequests([...leaveRequests, newLeave]);
    setShowForm(false);
    setNewRequest({
      id: '',
      empId: '',
      employee: '',
      startDate: '',
      endDate: '',
      leaveType: 'Annual',
      description: '',
    });
  };

  return (
    <AdminLayout>
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

        <div className="leave-req-filters">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option>All</option>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>

          <input
            type="text"
            name="id"
            placeholder="LeaveID"
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
                  <tr key={`${req.id}-${req.empId}`} onClick={() => setSelectedRequest(req)}>
                    <td>{req.id}</td>
                    <td>{req.empId}</td>
                    <td>{req.employee}</td>
                    <td>{req.leaveType}</td>
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

        {/* Leave Details Modal */}
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
              <p><strong>LeaveReq ID:</strong> {selectedRequest.id}</p>
              <p><strong>EMP ID:</strong> {selectedRequest.empId}</p>
              <p><strong>Employee:</strong> {selectedRequest.employee}</p>
              <p><strong>Start Date:</strong> {selectedRequest.startDate}</p>
              <p><strong>End Date:</strong> {selectedRequest.endDate}</p>
              <p><strong>Type:</strong> {selectedRequest.leaveType}</p>
              <p><strong>Status:</strong> {selectedRequest.status}</p>
              <p><strong>Description:</strong> {selectedRequest.description}</p>

              {selectedRequest.status === 'Rejected' && selectedRequest.reason && (
                <p><strong>Rejection Reason:</strong> {selectedRequest.reason}</p>
              )}

              {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Rejecting') && (
                <>
                  {selectedRequest.status === 'Pending' && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                      <button
                        className="leave-req-btn-request"
                        style={{ backgroundColor: '#d4edda', borderColor: '#28a745' }}
                        onClick={() => {
                          const updated = leaveRequests.map((req) =>
                            req.id === selectedRequest.id && req.empId === selectedRequest.empId
                              ? { ...req, status: 'Approved' }
                              : req
                          );
                          setLeaveRequests(updated);
                          setSelectedRequest({ ...selectedRequest, status: 'Approved' });
                        }}
                      >
                        Approve
                      </button>

                      <button
                        className="leave-req-btn-request"
                        style={{ backgroundColor: '#f8d7da', borderColor: '#dc3545' }}
                        onClick={() => {
                          setRejectionReason('');
                          setSelectedRequest({ ...selectedRequest, status: 'Rejecting' });
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {selectedRequest.status === 'Rejecting' && (
                    <div style={{ marginTop: '15px' }}>
                      <label htmlFor="rejection">Rejection Reason:</label>
                      <textarea
                        id="rejection"
                        rows="3"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter reason..."
                        style={{
                          width: '100%',
                          padding: '10px',
                          marginTop: '5px',
                          borderRadius: '8px',
                          border: '1px solid #ccc',
                        }}
                      />
                      <button
                        onClick={() => {
                          if (!rejectionReason.trim()) {
                            alert('Please enter a reason.');
                            return;
                          }
                          const updated = leaveRequests.map((req) =>
                            req.id === selectedRequest.id && req.empId === selectedRequest.empId
                              ? { ...req, status: 'Rejected', reason: rejectionReason }
                              : req
                          );
                          setLeaveRequests(updated);
                          setSelectedRequest({ ...selectedRequest, status: 'Rejected', reason: rejectionReason });
                          setRejectionReason('');
                        }}
                        className="leave-req-btn-request"
                        style={{
                          marginTop: '10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        OK
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Add Leave Form Modal */}
        {showForm && (
          <div className="leave-popup-overlay">
            <div className="leave-popup-content">
              <button className="leave-popup-close" onClick={() => setShowForm(false)}>&times;</button>
              <h3>Request Leave</h3>
              <input type="text" placeholder="LeaveReq ID" value={newRequest.id} onChange={(e) => setNewRequest({ ...newRequest, id: e.target.value })} />
              <input type="text" placeholder="EMP ID" value={newRequest.empId} onChange={(e) => setNewRequest({ ...newRequest, empId: e.target.value })} />
              <input type="text" placeholder="Employee" value={newRequest.employee} onChange={(e) => setNewRequest({ ...newRequest, employee: e.target.value })} />
              <input type="date" placeholder="Start Date" value={newRequest.startDate} onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })} />
              <input type="date" placeholder="End Date" value={newRequest.endDate} onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })} />
              <select value={newRequest.leaveType} onChange={(e) => setNewRequest({ ...newRequest, leaveType: e.target.value })}>
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
