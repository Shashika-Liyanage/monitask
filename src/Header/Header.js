import React, { useEffect, useState, useCallback } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
    ref, get, onValue, 
    query, orderByChild, equalTo 
} from "firebase/database"; 
import { auth, database } from "../Service/FirebaseConfig";
import "./Header.css";

// --- Time Formatting Helper ---
const formatDateTime = () => {
    // Format the time as: Mon, Dec 6, 2025, 08:49:48 PM
    return new Date().toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
};
// ----------------------------

// --- NOTIFICATION STATE STRUCTURE ---
const DEFAULT_NOTIFICATION_STATE = {
    count: 0,
    latestTaskId: null,
    description: null,
    showPopup: false, 
};
// ------------------------------------

function EmployeeHeaderView({ onToggleSidebar }) {
    const navigate = useNavigate();
    const [employeeName, setEmployeeName] = useState("");
    const [employeeId, setEmployeeId] = useState(null); 
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const [notificationState, setNotificationState] = useState(DEFAULT_NOTIFICATION_STATE);
    
    // --- NEW STATE: Time and Date ---
    const [currentTime, setCurrentTime] = useState(formatDateTime());
    // ---------------------------------

    // Function to toggle the notification popup
    const toggleNotificationPopup = useCallback(() => {
        setNotificationState(prev => ({
            ...prev,
            showPopup: !prev.showPopup,
        }));
    }, []);

    /**
     * NEW useEffect: Update time every second
     */
    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(formatDateTime());
        }, 1000);

        // Cleanup function
        return () => clearInterval(timerId);
    }, []);

    // STEP 1: Fetch logged-in employee name AND empId (required for tasks)
    useEffect(() => {
        const fetchEmployeeData = async () => {
            const user = auth.currentUser;
            if (!user) return;

            try {
                const dbRef = ref(database, `createEmployee/newEmployee/${user.uid}`);
                const snapshot = await get(dbRef);
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setEmployeeName(data.fullname || "");
                    setEmployeeId(data.memberID || null); 
                }
            } catch (err) {
                console.error("Error fetching employee data:", err);
            }
        };
        fetchEmployeeData();
    }, [database]);


    /**
     * STEP 2: Real-Time Listener for Pending Tasks
     */
    useEffect(() => {
        if (!employeeId) return;

        const tasksRef = ref(database, 'tasks');
        const employeeTasksQuery = query(
            tasksRef,
            orderByChild('empId'),
            equalTo(employeeId)
        );

        const unsubscribe = onValue(employeeTasksQuery, (snapshot) => {
            if (!snapshot.exists()) {
                setNotificationState(DEFAULT_NOTIFICATION_STATE);
                return;
            }

            let pendingCount = 0;
            let latestPendingTask = null;
            let latestTimestamp = 0;

            snapshot.forEach((childSnapshot) => {
                const task = childSnapshot.val();
                
                const taskStatus = (task.status || '').toLowerCase(); 
                const isPending = taskStatus === 'pending'; 

                if (isPending) {
                    pendingCount = 1; 
                    
                    const timestamp = new Date(task.createdAt || 0).getTime();
                    if (timestamp > latestTimestamp) {
                        latestTimestamp = timestamp;
                        latestPendingTask = task;
                    }
                }
            });

            if (pendingCount > 0 && latestPendingTask) {
                setNotificationState(prev => ({
                    ...prev,
                    count: 1, 
                    latestTaskId: latestPendingTask.id || 'N/A',
                    description: latestPendingTask.description || 'No description.',
                }));
            } else {
                setNotificationState(DEFAULT_NOTIFICATION_STATE);
            }
        });

        return () => unsubscribe();
    }, [database, employeeId]);


    const handleLogout = async () => {
        try {
            await signOut(auth);          
            navigate("/");                
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <div className="main-header">
            <div className="header-left">
                {/* Hamburger (mobile only) */}
                <button className="menu-button" onClick={onToggleSidebar} aria-label="Toggle sidebar">
                    &#9776;
                </button>
                
                <span className="logo-text">Monitask</span>
                
            
            </div>
    {/* --- DISPLAY CURRENT TIME --- */}
                <span style={{ fontSize: "20px", fontWeight:"bold"}} className="current-time">{currentTime}</span>
                {/* ---------------------------- */}
            <div className="header-right">
                {/* Logged-in employee name with profile icon */}
                {employeeName && (
                    <div className="employee-info">
                        <Person4RoundedIcon className="header-icon" />
                        <span className="employee-name">{employeeName}</span>
                    </div>
                )}

                {/* --- Notification Bell (with badge and click handler) --- */}
                <div className="notification-wrapper">
                    <NotificationsIcon 
                        className="header-icon notification-bell" 
                        titleAccess="Notifications" 
                        onClick={toggleNotificationPopup}
                    />
                    
                    {notificationState.count > 0 && (
                        <span className="notification-badge">{notificationState.count}</span>
                    )}

                    {/* Notification Popup (Conditional Rendering) */}
                    {notificationState.showPopup && notificationState.count > 0 && (
                        <div className="notification-popup">
                            <p className="popup-title">New Task Assigned:</p>
                            <p><strong>ID:</strong> {notificationState.latestTaskId}</p>
                            <p><strong>Description:</strong> {notificationState.description}</p>
                        </div>
                    )}
                </div>
                {/* ----------------------------------------------------- */}

                {/* Existing logout icon */}
                <LogoutIcon
                    onClick={() => setShowLogoutPopup(true)}
                    titleAccess="Log Out"
                    className="header-icon"
                />

                {/* Logout confirmation popup */}
                {showLogoutPopup && (
                    <div className="logout-popup">
                        <p>Do you want to logout?</p>
                        <div className="popup-buttons">
                            <button onClick={handleLogout}>Yes</button>
                            <button onClick={() => setShowLogoutPopup(false)}>No</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default EmployeeHeaderView;