import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import './adminLeave.css';

// Import Realtime Database services
import { database } from '../../../Service/FirebaseConfig';
import { ref, onValue, update, push, serverTimestamp, get } from 'firebase/database';

/* Toast component now supports a 'type' prop: 'success' or 'error' */
const Toast = ({ message, onClose, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const className = type === 'error' ? 'message error-message' : 'message success-message';

  return (
    <div className="toast-container">
      <div id="messageBox" className={className}>
        {message}
      </div>
    </div>
  );
};

function AdminLeaveReq() {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Toast state (now includes type)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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

  // Function to show toast with type
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  // Function to hide toast
  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // Helper: get today's date string in YYYY-MM-DD for min attribute and comparisons
  const getTodayString = () => {
    const t = new Date();
    const yyyy = t.getFullYear();
    const mm = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const today = getTodayString();

  // === New: leave quotas per year (type -> allowed units) ===
  // Annual/Casual/Medical counted in DAYS
  // Half Day counted as 1 request unit (quota = 3 requests)
  const LEAVE_QUOTAS = {
    Annual: 5,   // days
    Casual: 10,  // days
    Medical: 10, // days
    'Half Day': 3, // requests
  };
  const TOTAL_LEAVES_PER_YEAR = 28; // informational if you want to enforce overall cap later

  // Helper: parse date string "YYYY-MM-DD" -> Date at UTC midnight
  const parseDate = (s) => {
    if (!s) return null;
    // ensure safe parse (treat as local date); append T00:00:00
    return new Date(s + 'T00:00:00');
  };

  // Helper: inclusive days between two dates (both Date objects)
  const daysInclusive = (d1, d2) => {
    if (!d1 || !d2) return 0;
    const a = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    const b = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((b - a) / msPerDay) + 1;
  };

  // Helper: check overlap between [a1,a2] and [b1,b2]
  const rangesOverlap = (a1, a2, b1, b2) => {
    return a1 <= b2 && b1 <= a2;
  };

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
      showToast(`Request ${newStatus} successfully!`, 'success');
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error("Error updating leave status:", error);
      showToast(`Failed to update status.`, 'error');
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

  // --- AUTOFILL: lookup employee name by empId (non-invasive) ---
  const lookupEmployeeById = async (empId) => {
    const id = (empId || newRequest.empId || '').toString().trim();
    if (!id) {
      // nothing to lookup; don't bother querying DB
      return;
    }

    try {
      const empRef = ref(database, 'createEmployee/newEmployee');
      const snapshot = await get(empRef);
      if (!snapshot.exists()) {
        showToast('No employees found in database.', 'error');
        // clear employee field to avoid stale name
        setNewRequest(prev => ({ ...prev, employee: '' }));
        return;
      }

      const data = snapshot.val();
      let found = null;
      for (const key of Object.keys(data)) {
        const rec = data[key];
        // compare memberID as string trimmed (case-sensitive as IDs usually are)
        if (String(rec.memberID || '').trim() === id) {
          found = rec;
          break;
        }
      }

      if (found) {
        const name = found.fullname || '';
        setNewRequest(prev => ({ ...prev, employee: name }));
        showToast(`Employee found: ${name}`, 'success');
      } else {
        setNewRequest(prev => ({ ...prev, employee: '' }));
        showToast('No employee found with that ID.', 'error');
      }
    } catch (err) {
      console.error('Lookup error:', err);
      showToast('Failed to lookup employee. See console.', 'error');
    }
  };
  // --- end autofill ---

  // --- ADMIN INITIATED LEAVE SUBMISSION ---
  const handleFormSubmit = async () => {
    // basic required fields
    if (
      !newRequest.empId ||
      !newRequest.employee ||
      !newRequest.startDate ||
      !newRequest.endDate ||
      !newRequest.description
    ) {
      showToast('Please fill all fields.', 'error');
      return;
    }

    // parse date objects
    let fromDateObj, toDateObj;
    try {
      fromDateObj = parseDate(newRequest.startDate);
      toDateObj = parseDate(newRequest.endDate);
      if (!fromDateObj || !toDateObj || isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (err) {
      console.error('Date parsing error', err);
      showToast('Invalid date(s) provided.', 'error');
      return;
    }

    // Date validations: prevent selecting before today and ensure end >= start
    try {
      const todayDate = new Date(today + 'T00:00:00');

      if (fromDateObj < todayDate || toDateObj < todayDate) {
        showToast('Selected dates cannot be before today.', 'error');
        return;
      }

      if (toDateObj < fromDateObj) {
        showToast('End date cannot be earlier than start date.', 'error');
        return;
      }
    } catch (err) {
      console.error('Date validation error', err);
      showToast('Invalid date(s) provided.', 'error');
      return;
    }

    // --- NEW: Prevent overlapping requests for same employee ---
    try {
      const empIdTrim = String(newRequest.empId).trim();
      const overlapping = leaveRequests.some((r) => {
        // ignore rejected requests
        if (r.status === 'Rejected') return false;

        const rFrom = parseDate(r.fromDate || r.startDate || r.start || '');
        const rTo = parseDate(r.toDate || r.endDate || r.end || '');
        if (!rFrom || !rTo) return false;

        const rEmpId = String(r.employeeId || r.empId || r.memberID || '').trim();
        if (!rEmpId) return false;

        if (rEmpId !== empIdTrim) return false;

        // if ranges overlap -> conflict
        return rangesOverlap(fromDateObj, toDateObj, rFrom, rTo);
      });

      if (overlapping) {
        showToast('Employee already has a leave request that overlaps these dates.', 'error');
        return;
      }
    } catch (err) {
      console.error('Overlap check error', err);
      // continue (but safer to block)
      showToast('Error validating overlapping requests. See console.', 'error');
      return;
    }

    // --- NEW: enforce per-type per-year quotas ---
    try {
      // determine the calendar year to count against: use startDate's year
      const year = fromDateObj.getFullYear();

      // function to compute how many days of a given request fall within 'year'
      const daysInYear = (reqFrom, reqTo, yearNum) => {
        const yearStart = new Date(`${yearNum}-01-01T00:00:00`);
        const yearEnd = new Date(`${yearNum}-12-31T00:00:00`);
        const start = reqFrom > yearStart ? reqFrom : yearStart;
        const end = reqTo < yearEnd ? reqTo : yearEnd;
        if (start > end) return 0;
        return daysInclusive(start, end);
      };

      // compute how many units already used this year for this employee (status not Rejected)
      const empIdTrim = String(newRequest.empId).trim();
      const used = {
        Annual: 0,
        Casual: 0,
        Medical: 0,
        'Half Day': 0,
      };

      for (const r of leaveRequests) {
        if (r.status === 'Rejected') continue; // ignore rejected
        const rEmpId = String(r.employeeId || r.empId || r.memberID || '').trim();
        if (rEmpId !== empIdTrim) continue;

        const rFrom = parseDate(r.fromDate || r.startDate || r.start || '');
        const rTo = parseDate(r.toDate || r.endDate || r.end || '');
        if (!rFrom || !rTo) continue;

        const rType = r.type || 'Annual';
        // Only count days that fall into this 'year'
        if (rType === 'Half Day') {
          // treat each half-day request as 1 unit (we assume rFrom == rTo)
          if (rFrom.getFullYear() === year) used['Half Day'] += 1;
        } else {
          used[rType] = (used[rType] || 0) + daysInYear(rFrom, rTo, year);
        }
      }

      // compute units requested by this newRequest
      let requestedUnits = 0;
      const reqType = newRequest.type || 'Annual';
      if (reqType === 'Half Day') {
        requestedUnits = 1; // one half-day request unit
      } else {
        requestedUnits = daysInclusive(fromDateObj, toDateObj);
      }

      const currentUsed = used[reqType] || 0;
      const quota = LEAVE_QUOTAS[reqType] ?? null;

      if (quota !== null && typeof quota !== 'undefined') {
        if (currentUsed + requestedUnits > quota) {
          // Build friendly message
          const remaining = Math.max(0, quota - currentUsed);
          showToast(
            `Quota exceeded for ${reqType}. Used: ${currentUsed}, Requested: ${requestedUnits}, Allowed per year: ${quota}. Remaining: ${remaining}`,
            'error'
          );
          return;
        }
      }
      // (Optional) You could also enforce TOTAL_LEAVES_PER_YEAR across all types by summing used + requested across all types.
    } catch (err) {
      console.error('Quota check error', err);
      showToast('Error validating leave quotas. See console.', 'error');
      return;
    }

    // --- All validations passed -> submit request ---
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

      showToast(`New leave request submitted (${leaveCode}). Awaiting approval.`, 'success');
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
      showToast('Failed to submit request.', 'error');
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
                          showToast('Please enter a reason before rejecting.', 'error');
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
                onBlur={() => lookupEmployeeById(newRequest.empId)} /* <- autofill lookup onBlur */
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
                min={today} /* prevent picking past dates in UI */
              />
              <input
                type="date"
                placeholder="End Date"
                value={newRequest.endDate}
                onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                min={today} /* prevent picking past dates in UI */
              />
              <select
                value={newRequest.type}
                onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value })}
              >
                <option value="Annual">Annual</option>
                <option value="Casual">Casual</option>
                <option value="Medical">Medical</option>
                <option value="Half Day">Half Day</option>
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

        {/* TOAST NOTIFICATION */}
        {toast.show && <Toast message={toast.message} onClose={hideToast} type={toast.type} />}
      </div>
    </AdminLayout>
  );
}

export default AdminLeaveReq;
