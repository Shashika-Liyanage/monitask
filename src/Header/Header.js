import React, { useEffect, useState, useCallback } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
    ref, get, onValue, 
    query, orderByChild, equalTo // Added for the task query
} from "firebase/database"; 
import { auth, database } from "../Service/FirebaseConfig";
import "./Header.css";

// --- NEW STATE STRUCTURE ---
const DEFAULT_NOTIFICATION_STATE = {
    count: 0,
    latestTaskId: null,
    description: null,
    showPopup: false, 
};
// -------------------------

function EmployeeHeaderView({ onToggleSidebar }) {
    const navigate = useNavigate();
    const [employeeName, setEmployeeName] = useState("");
    const [employeeId, setEmployeeId] = useState(null); 
    const [showLogoutPopup, setShowLogoutPopup] = useState(false);
    const [notificationState, setNotificationState] = useState(DEFAULT_NOTIFICATION_STATE);

    // Function to toggle the notification popup
    const toggleNotificationPopup = useCallback(() => {
        setNotificationState(prev => ({
            ...prev,
            showPopup: !prev.showPopup,
            // You might want to remove the popup immediately when they click, 
            // but keep the badge until the task is marked 'Incomplete' or 'Complete'.
        }));
    }, []);

    // --- STEP 1: Fetch logged-in employee name AND empId (required for tasks) ---
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
    }, []);


    /**
     * --- STEP 2: Real-Time Listener for Pending Tasks ---
     * Checks for tasks assigned to the user where status is "Pending".
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
                
                // CRITICAL LOGIC FIX: Check for 'Pending' status (case-insensitively)
                const taskStatus = (task.status || '').toLowerCase(); 
                const isPending = taskStatus === 'pending'; 

                if (isPending) {
                    // Show '1' if any pending task exists
                    pendingCount = 1; 
                    
                    // Find the most recent pending task for the description popup
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

        // Cleanup function
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