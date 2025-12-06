import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import Person3RoundedIcon from '@mui/icons-material/Person3Rounded';
import { useNavigate } from 'react-router-dom';
import {
  getDatabase,
  ref,
  onValue,
  push,
  update as fbUpdate,
  remove,
  serverTimestamp,
  get
} from 'firebase/database';
import app from '../../../Service/FirebaseConfig';
import './adminAttendance.css';

/* Toast component (same behavior as Leave screen) */
const Toast = ({ message, onClose, type = 'success' }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 5000);
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

/* ConfirmToast component — persistent until user acts */
const ConfirmToast = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="toast-container">
      <div className="confirm-toast">
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
          <button className="confirm-btn" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

function AdminAttendanceReq() {
    // Realtime attendance data
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const showToast = (message, type = 'success') => setToast({ show: true, message, type });
    const hideToast = () => setToast({ show: false, message: '', type: 'success' });

    // Confirm toast state (for delete)
    const [confirmDelete, setConfirmDelete] = useState({ show: false, record: null });

    const navigate = useNavigate();
    const db = getDatabase(app);

    // Filters
    const [filterStatus, setFilterStatus] = useState('');
    const [filterEmpId, setFilterEmpId] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Real-time listener
    useEffect(() => {
        const attendanceRef = ref(db, 'attendanceRecords');
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const records = [];
                for (const id in data) {
                    records.push({ id, ...data[id] });
                }
                records.sort((a, b) => {
                  const aTime = a.createdAt || a.date || '';
                  const bTime = b.createdAt || b.date || '';
                  if (typeof aTime === 'number' && typeof bTime === 'number') return bTime - aTime;
                  return String(bTime).localeCompare(String(aTime));
                });
                setAttendanceData(records);
                setError(null);
            } else {
                setAttendanceData([]);
                setError("No attendance records found.");
            }
            setLoading(false);
        }, (dbError) => {
            console.error("Firebase Read Error:", dbError);
            setError("Failed to load attendance data in real-time.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    // Filters memoized
    const filteredData = useMemo(() => {
        return attendanceData.filter((row) => {
            const matchesStatus = filterStatus ? row.attendance === filterStatus : true;
            const matchesEmpId = filterEmpId ? String(row.empId).toLowerCase().includes(filterEmpId.toLowerCase()) : true;
            const matchesDate = filterDate ? row.date === filterDate : true;
            return matchesStatus && matchesEmpId && matchesDate;
        });
    }, [attendanceData, filterStatus, filterEmpId, filterDate]);

    // Online cards
    const onlineUsersForCards = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10);
        return attendanceData.filter((row) =>
            row.date === today &&
            (row.attendance === 'Present' || row.attendance === 'Late') &&
            !row.checkOut
        );
    }, [attendanceData]);

    // Modal & form state (shared for Add/Edit)
    const [showModal, setShowModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // form fields - added employeeName field (auto-fill)
    const [formEmpId, setFormEmpId] = useState('');
    const [formEmployeeName, setFormEmployeeName] = useState(''); // new
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0,10));
    const [formCheckIn, setFormCheckIn] = useState('');
    const [formCheckOut, setFormCheckOut] = useState('');
    const [formAttendance, setFormAttendance] = useState('Present');
    const [formStatus, setFormStatus] = useState('Active');
    const [formOvertime, setFormOvertime] = useState(''); // stored as string like "1.50"

    const resetForm = () => {
      setFormEmpId('');
      setFormEmployeeName('');
      setFormDate(new Date().toISOString().slice(0,10));
      setFormCheckIn('');
      setFormCheckOut('');
      setFormAttendance('Present');
      setFormStatus('Active');
      setFormOvertime('');
      setSelectedRecord(null);
    };

    const openAddModal = () => {
      resetForm();
      setShowModal(true);
    };

    const openEditModal = (row) => {
      setSelectedRecord(row);
      setFormEmpId(row.empId || '');
      setFormEmployeeName(row.employee || row.employeeName || ''); // prefill name if saved
      setFormDate(row.date || new Date().toISOString().slice(0,10));
      setFormCheckIn(row.checkIn || '');
      setFormCheckOut(row.checkOut || '');
      setFormAttendance(row.attendance || 'Present');
      setFormStatus(row.status || 'Active');
      // if record has overtime saved use it, otherwise will recalc
      setFormOvertime((row.overtime !== undefined && row.overtime !== null) ? String(row.overtime) : '');
      setShowModal(true);
    };

    // --- NEW: compute overtime based on checkIn/checkOut relative to 08:00-17:00 ---
    // Returns string with hours rounded to 2 decimals, e.g. "1.50", or "0.00"
    const computeOvertime = (checkInTime, checkOutTime) => {
      // shift start/end in minutes
      const SHIFT_START_MIN = 8 * 60;   // 08:00
      const SHIFT_END_MIN = 17 * 60;    // 17:00

      // helper: convert "HH:MM" to minutes since midnight; returns null if invalid
      const timeStringToMinutes = (t) => {
        if (!t || typeof t !== 'string') return null;
        const parts = t.split(':');
        if (parts.length < 2) return null;
        const hh = parseInt(parts[0], 10);
        const mm = parseInt(parts[1], 10);
        if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
        return hh * 60 + mm;
      };

      const inMin = timeStringToMinutes(checkInTime);
      const outMin = timeStringToMinutes(checkOutTime);

      let morningOTMin = 0;
      let eveningOTMin = 0;

      // morning OT: minutes before shift start
      if (inMin !== null && inMin < SHIFT_START_MIN) {
        morningOTMin = SHIFT_START_MIN - inMin;
      }

      // evening OT: minutes after shift end
      if (outMin !== null && outMin > SHIFT_END_MIN) {
        eveningOTMin = outMin - SHIFT_END_MIN;
      }

      // If only one time present: still calculate corresponding OT portion
      // Total OT in minutes:
      const totalOTMin = Math.max(0, morningOTMin) + Math.max(0, eveningOTMin);

      // convert to hours with 2 decimal places (digit-by-digit safe calculation)
      const otHours = Math.round((totalOTMin / 60) * 100) / 100; // rounds to 2 decimals
      // Format as fixed with 2 decimals
      return otHours.toFixed(2);
    };

    // Recalculate overtime whenever check-in/out change
    useEffect(() => {
      // If user already has a saved overtime (editing) and didn't change times, we still want
      // to recalc when they change times. If both times empty, keep empty.
      if (!formCheckIn && !formCheckOut) {
        // don't overwrite existing saved overtime on edit unless user changes times;
        // if adding, keep as empty string
        return;
      }
      const ot = computeOvertime(formCheckIn, formCheckOut);
      setFormOvertime(ot);
    }, [formCheckIn, formCheckOut]); // eslint-disable-line react-hooks/exhaustive-deps

    // --- NEW: lookup employee by empId and autofill name (same path as Leave) ---
    const lookupEmployeeById = async (empId) => {
      const id = (empId || formEmpId || '').toString().trim();
      if (!id) {
        // clear name if id empty
        setFormEmployeeName('');
        return;
      }

      try {
        const empRef = ref(db, 'createEmployee/newEmployee');
        const snapshot = await get(empRef);
        if (!snapshot.exists()) {
          // no employees node
          setFormEmployeeName('');
          showToast('No employees found in database.', 'error');
          return;
        }

        const data = snapshot.val();
        let found = null;
        for (const key of Object.keys(data)) {
          const rec = data[key];
          // compare multiple possible id fields
          if (String(rec.memberID || rec.empId || rec.employeeId || '').trim() === id) {
            found = rec;
            break;
          }
        }

        if (found) {
          const name = found.fullname || found.fullName || found.name || '';
          setFormEmployeeName(name);
          showToast(`Employee found: ${name}`, 'success');
        } else {
          setFormEmployeeName('');
          showToast('No employee found with that ID.', 'error');
        }
      } catch (err) {
        console.error('Lookup error:', err);
        showToast('Failed to lookup employee. See console.', 'error');
      }
    };
    // --- end lookup ---

    // Add
    const handleSaveAttendance = async () => {
      if (!formEmpId) {
        showToast('Please enter Employee ID.', 'error');
        return;
      }
      try {
        const attendanceRef = ref(db, 'attendanceRecords');
        const payload = {
          empId: formEmpId,
          employee: formEmployeeName || '',
          date: formDate,
          checkIn: formCheckIn || '',
          checkOut: formCheckOut || '',
          attendance: formAttendance,
          status: formStatus,
          overtime: formOvertime === '' ? 0 : Number(formOvertime),
          createdAt: serverTimestamp(),
        };
        await push(attendanceRef, payload);
        showToast('Attendance added successfully.', 'success');
        setShowModal(false);
        resetForm();
      } catch (err) {
        console.error('Error adding attendance:', err);
        showToast('Failed to add attendance. See console.', 'error');
      }
    };

    // Update
    const handleUpdateAttendance = async () => {
      if (!selectedRecord || !selectedRecord.id) {
        showToast('No record selected for update.', 'error');
        return;
      }
      try {
        const recRef = ref(db, `attendanceRecords/${selectedRecord.id}`);
        const payload = {
          empId: formEmpId,
          employee: formEmployeeName || '',
          date: formDate,
          checkIn: formCheckIn || '',
          checkOut: formCheckOut || '',
          attendance: formAttendance,
          status: formStatus,
          overtime: formOvertime === '' ? 0 : Number(formOvertime),
          updatedAt: serverTimestamp(),
        };
        await fbUpdate(recRef, payload);
        showToast('Attendance updated successfully.', 'success');
        setShowModal(false);
        resetForm();
      } catch (err) {
        console.error('Error updating attendance:', err);
        showToast('Failed to update attendance. See console.', 'error');
      }
    };

    // Delete (starts confirm flow — no window.confirm)
    const handleDeleteAttendance = (record) => {
      setConfirmDelete({ show: true, record });
    };

    // Confirmed delete
    const handleDeleteAttendanceConfirmed = async () => {
      const rec = confirmDelete.record;
      if (!rec || !rec.id) {
        showToast('No record selected for delete.', 'error');
        setConfirmDelete({ show: false, record: null });
        return;
      }
      try {
        const recRef = ref(db, `attendanceRecords/${rec.id}`);
        await remove(recRef);
        showToast('Attendance record deleted.', 'success');
        setShowModal(false);
        setConfirmDelete({ show: false, record: null });
        resetForm();
      } catch (err) {
        console.error('Error deleting attendance:', err);
        showToast('Failed to delete attendance. See console.', 'error');
        setConfirmDelete({ show: false, record: null });
      }
    };

    // Cancel delete
    const handleCancelDelete = () => {
      setConfirmDelete({ show: false, record: null });
    };

    if (loading) {
        return <AdminLayout><p>Loading real-time attendance...</p></AdminLayout>;
    }

    if (error && attendanceData.length === 0) {
        return <AdminLayout><p style={{ color: 'red' }}>Error: {error}</p></AdminLayout>;
    }

    return (
        <AdminLayout>
            <div className="attendance-req-container">
                {/* Title + Add button in top-right */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="attendance-req-title">All Employees Attendance Records</h2>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button
                      className="add-attendance-btn"
                      onClick={openAddModal}
                      title="Add Attendance"
                    >
                      + Add Attendance
                    </button>
                  </div>
                </div>

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

                {/* --- Main Attendance Table (Uses filteredData) --- */}
                <div className="attendance-req-table-wrapper">
                    <table className="attendance-req-table">
                        <thead>
                            <tr>
                                <th style={{ display: 'none' }}>Attendance_ID</th> {/* hidden front-end only */}
                                <th>Employee ID</th>
                                <th>Employee</th>
                                <th>Date</th>
                                <th>CheckIn_Time</th>
                                <th>CheckOut_Time</th>
                                <th>Attendance</th>
                                <th>Status</th>
                                <th>OT (hrs)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((row) => (
                                <tr
                                  key={row.id}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => openEditModal(row)}
                                >
                                    <td style={{ display: 'none' }}>{row.id}</td>
                                    <td>{row.empId}</td>
                                    <td>{row.employee || row.employeeName || '-'}</td>
                                    <td>{row.date}</td>
                                    <td>{row.checkIn || '-'}</td>
                                    <td>{row.checkOut || '-'}</td>
                                    <td>{row.attendance}</td>
                                    <td>{row.status}</td>
                                    <td>{(row.overtime !== undefined && row.overtime !== null) ? String(row.overtime) : '-'}</td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr><td colSpan="9">No records found matching filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <h3 className="attendance-req-online-title">Online Employees ({onlineUsersForCards.length}) 🟢</h3>

                {/* --- Online Employees Cards (Uses onlineUsersForCards) --- */}
                <div className="attendance-req-cards">
                    {onlineUsersForCards.map((emp) => (
                        <div className="attendance-req-card" key={emp.id} onClick={() => openEditModal(emp)} style={{ cursor: 'pointer' }}>
                            <div className="attendance-req-avatar">
                                <Person3RoundedIcon className="attendance-req-avatar-icon" />
                            </div>
                            <div className="attendance-req-card-content">
                                <strong>EMP NO:          {emp.empId}</strong>
                                <p>Status:        {emp.attendance}</p>
                                <p>Name :         {emp.employee}</p>
                                <p>Check in Time: {emp.checkIn}</p>
                            </div>
                            <div className="attendance-req-status-dot online"></div>
                        </div>
                    ))}
                    {onlineUsersForCards.length === 0 && (
                        <p style={{ padding: '10px', color: '#888' }}>No employees currently marked as Present and Checked in for today.</p>
                    )}
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

                {/* --- Modal (Add/Edit) --- */}
                {showModal && (
                  <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedRecord(null); }}>
                    <div className="modal-content attendance-modal" onClick={(e) => e.stopPropagation()}>
                      <h3>{selectedRecord ? 'Edit Attendance' : 'Add Attendance'}</h3>

                      <label>Employee ID</label>
                      <input
                        type="text"
                        value={formEmpId}
                        onChange={(e) => setFormEmpId(e.target.value)}
                        onBlur={() => lookupEmployeeById(formEmpId)} // lookup on blur
                        placeholder="e.g. EMP001"
                      />

                      <label>Employee Name</label>
                      <input
                        type="text"
                        value={formEmployeeName}
                        onChange={(e) => setFormEmployeeName(e.target.value)}
                        placeholder="Employee name (auto-filled)"
                      />

                      <label>Date</label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                      />

                      <label>Check-In Time</label>
                      <input
                        type="time"
                        value={formCheckIn}
                        onChange={(e) => setFormCheckIn(e.target.value)}
                      />

                      <label>Check-Out Time</label>
                      <input
                        type="time"
                        value={formCheckOut}
                        onChange={(e) => setFormCheckOut(e.target.value)}
                      />

                      <label>Overtime (hrs)</label>
                      <input
                        type="text"
                        value={formOvertime}
                        readOnly
                        placeholder="Auto-calculated"
                      />

                      <label>Attendance</label>
                      <select value={formAttendance} onChange={(e) => setFormAttendance(e.target.value)}>
                        <option value="Present">Present</option>
                        <option value="Absent">Absent</option>
                        <option value="Late">Late</option>
                        <option value="WFH">WFH</option>
                      </select>

                      <label>Status</label>
                      <select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>

                      <div className="modal-actions">
                        <button
                          className="btn-secondary"
                          onClick={() => {
                            setShowModal(false);
                            setSelectedRecord(null);
                          }}
                        >
                          Cancel
                        </button>

                        {selectedRecord ? (
                          <>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteAttendance(selectedRecord)}
                              style={{ marginRight: 8 }}
                            >
                              Delete
                            </button>
                            <button
                              className="btn-primary"
                              onClick={handleUpdateAttendance}
                              disabled={!formEmpId}
                            >
                              Update
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-primary"
                            onClick={handleSaveAttendance}
                            disabled={!formEmpId}
                          >
                            Save
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Regular Toast */}
                {toast.show && <Toast message={toast.message} onClose={hideToast} type={toast.type} />}

                {/* Confirm Delete Toast */}
                {confirmDelete.show && (
                  <ConfirmToast
                    message={`Delete attendance for ${confirmDelete.record?.empId || ''} on ${confirmDelete.record?.date || ''}?`}
                    onConfirm={handleDeleteAttendanceConfirmed}
                    onCancel={handleCancelDelete}
                  />
                )}

            </div>
        </AdminLayout>
    );
}

export default AdminAttendanceReq;