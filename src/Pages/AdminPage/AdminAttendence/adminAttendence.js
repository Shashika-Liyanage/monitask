import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../../Layout/Admin_Layout/AdminL';
import Person3RoundedIcon from '@mui/icons-material/Person3Rounded';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue } from 'firebase/database'; // Key Firebase imports
import app from '../../../Service/FirebaseConfig'; // Your Firebase configuration
import './adminAttendance.css';

function AdminAttendanceReq() {
    // State to hold the live data fetched from Firebase
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const db = getDatabase(app); // Get the database instance

    // States to track filter inputs
    const [filterStatus, setFilterStatus] = useState('');
    const [filterEmpId, setFilterEmpId] = useState('');
    const [filterDate, setFilterDate] = useState('');

    /**
     * Set up Real-Time Listener
     */
    useEffect(() => {
        const attendanceRef = ref(db, 'attendanceRecords'); // Assuming your main node is 'attendanceRecords'
        
        // onValue sets up a listener that triggers immediately and every time data changes
        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const records = [];
                
                // Firebase returns an object of objects, so we convert it to an array
                for (const id in data) {
                    records.push({
                        id: id, // Firebase push key
                        ...data[id],
                        // Ensure required fields exist, e.g., empId, date, attendance, status
                    });
                }
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

        // Cleanup function: This detaches the listener when the component unmounts
        return () => unsubscribe();
    }, [db]);


    // Filter data based on user inputs (Memoized for performance)
    const filteredData = useMemo(() => {
        // Use the live attendanceData instead of mockData
        return attendanceData.filter((row) => {
            const matchesStatus = filterStatus ? row.attendance === filterStatus : true;
            // Use case-insensitive search for ID
            const matchesEmpId = filterEmpId ? String(row.empId).toLowerCase().includes(filterEmpId.toLowerCase()) : true;
            const matchesDate = filterDate ? row.date === filterDate : true;

            return matchesStatus && matchesEmpId && matchesDate;
        });
    }, [attendanceData, filterStatus, filterEmpId, filterDate]);


    // Filter data specifically for the CARDS: Show only "Online/Present" users (Memoized)
    const onlineUsersForCards = useMemo(() => {
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        
        return attendanceData.filter((row) => {
            // A more realistic "Online" check:
            // 1. Attendance date is today.
            // 2. Attendance is 'Present' or 'Late'.
            // 3. CheckOut time is empty or null (meaning the shift hasn't ended).
            
            return row.date === today && 
                   (row.attendance === 'Present' || row.attendance === 'Late') &&
                   !row.checkOut; 
        });
    }, [attendanceData]);


    if (loading) {
        return <AdminLayout><p>Loading real-time attendance...</p></AdminLayout>;
    }
    
    if (error && attendanceData.length === 0) {
        return <AdminLayout><p style={{ color: 'red' }}>Error: {error}</p></AdminLayout>;
    }


    // --- RENDERING ---
    return (
        <AdminLayout>
            <div className="attendance-req-container">
                <h2 className="attendance-req-title">All Employees Attendance Records</h2>

                <div className="attendance-req-filters">
                    {/* ... (Your filter inputs remain the same) ... */}
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
                                    <td>{row.checkIn || '-'}</td>
                                    <td>{row.checkOut || '-'}</td>
                                    <td>{row.attendance}</td>
                                    <td>{row.status}</td>
                                </tr>
                            ))}
                            {filteredData.length === 0 && (
                                <tr><td colSpan="7">No records found matching filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <h3 className="attendance-req-online-title">Online Employees ({onlineUsersForCards.length}) 🟢</h3>
                
                {/* --- Online Employees Cards (Uses onlineUsersForCards) --- */}
                <div className="attendance-req-cards">
                    {onlineUsersForCards.map((emp) => (
                        <div className="attendance-req-card" key={emp.id}>
                            <div className="attendance-req-avatar">
                                <Person3RoundedIcon className="attendance-req-avatar-icon" />
                            </div>
                            <div className="attendance-req-card-content">
                                <strong>{emp.empId}</strong>
                                <p>{emp.attendance}</p>
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
            </div>
        </AdminLayout>
    );
}

export default AdminAttendanceReq;