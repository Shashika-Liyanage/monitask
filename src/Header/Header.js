import React, { useEffect, useState, useCallback } from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import Person4RoundedIcon from '@mui/icons-material/Person4Rounded';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import { signInAnonymously, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { 
    ref, get, onValue, 
    query, orderByChild, equalTo 
} from "firebase/database"; 
import { auth, database } from "../Service/FirebaseConfig";
import "./Header.css";
import Chatty from '../Pages/Chatty/Chatty';
import { onAuthStateChanged } from 'firebase/auth';
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
const [isModalOpen, setIsModalOpen] = useState(false); 


  // Function to open the modal
  const openChatModal = () => {
    setIsModalOpen(true);
  };

  // Function to close the modal (used inside ChatModal)
  const closeChatModal = () => {
    setIsModalOpen(false);
  };
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
useEffect(() => {
        // Set up the Firebase Auth listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // currentUser will be null if logged out, or a user object if logged in
            setUser(currentUser); 
        });
        
        return () => unsubscribe(); // Clean up the listener
    }, []);
    // .
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [user, setUser] = useState(null); // Holds the Firebase User object

    // 💡 Auth Listener to track the logged-in user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            // currentUser is null if logged out, or a User object if logged in
            setUser(currentUser); 
        });
        
        return () => unsubscribe(); // Clean up the listener on unmount
    }, []);

    // Example function to log in anonymously for testing
    const handleLogin = async () => {
        try {
            await signInAnonymously(auth);
            // Note: Anonymous user objects DO NOT have a displayName, 
            // so Chatty will use the email/UID fallback.
        } catch (error) {
            console.error("Login failed:", error);
        }
    };


    // ... existing states ...
    


    
    // 💡 NEW STATE: The complete user object to pass to Chatty
    const [chatUser, setChatUser] = useState(null); 

    // ... existing modal functions (openChatModal, closeChatModal) ...

    // ... existing timer useEffect ...

    // STEP 1: Fetch logged-in employee name AND empId (required for tasks)
    useEffect(() => {
        const fetchEmployeeData = async () => {
            const user = auth.currentUser;
            if (!user) {
                // Clear state if no user is logged in
                setEmployeeName("");
                setEmployeeId(null);
                setChatUser(null);
                return;
            }

            // Set up the basic chat user structure using Firebase Auth UID/Email
            let userDisplayName = user.displayName || user.email || `User_${user.uid.substring(0, 8)}`;
            let fetchedMemberID = null;

            try {
                const dbRef = ref(database, `createEmployee/newEmployee/${user.uid}`);
                const snapshot = await get(dbRef);
                
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    // 💡 Overwrite displayName with the fetched full name
                    userDisplayName = data.fullname || userDisplayName;
                    fetchedMemberID = data.memberID || null;
                }
            } catch (err) {
                console.error("Error fetching employee data:", err);
            }
            
            // Update states with the fetched data
            setEmployeeName(userDisplayName); // Use the fetched name for the header display
            setEmployeeId(fetchedMemberID);
            
            // 💡 CRITICAL: Build the final user object to pass to Chatty
            setChatUser({
                uid: user.uid,
                displayName: userDisplayName,
                email: user.email,
                // You can add memberID here if needed: memberID: fetchedMemberID
            });

        };

        // Listen for Auth changes to re-fetch employee data
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser); 
            // Trigger data fetch when the auth state changes
            if (currentUser) {
                fetchEmployeeData();
            } else {
                // Handle logout case immediately
                setEmployeeName("");
                setEmployeeId(null);
                setChatUser(null);
            }
        });
        
        // Return unsubscribe function for cleanup
        return () => unsubscribeAuth();
    }, []);

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
                       
                            <ChatIcon onClick={openChatModal} className="header-icon" />
                        <span className="employee-name"></span>
                             <div className="employee-info">
                       
                            <Person4RoundedIcon className="header-icon" />
                        <span className="employee-name">{employeeName}</span>
                    </div>
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
            <Chatty 
                isOpen={isModalOpen} 
                onClose={closeChatModal} 
                currentUser={chatUser}
            />
        </div>
    );
}

export default EmployeeHeaderView;