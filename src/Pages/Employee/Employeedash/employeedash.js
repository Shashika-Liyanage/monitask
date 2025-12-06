import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL'; 
import { Box, Typography, Card, CardContent, Button, Grid, Divider } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { Doughnut, Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'; 
import { ref, onValue, query, orderByChild, equalTo, get } from 'firebase/database';
import { database } from '../../../Service/FirebaseConfig';
import { getAuth } from "firebase/auth";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// --- Chart Constants ---
const DEFAULT_TASK_DATA = {
    labels: ['Complete Tasks', 'Uncomplete Tasks'],
    datasets: [{ data: [0, 100], backgroundColor: ['#4CAF50', '#FF9800'], hoverBackgroundColor: ['#45A049', '#FB8C00'] }],
};
// --- UPDATED ATTENDANCE CONSTANTS (Adding WFH) ---
const DEFAULT_ATTENDANCE_DATA = {
    labels: ['Office Days', 'WFH', 'Absent', 'Late'], // Changed 'Present' to 'Office Days' for clarity in the bar chart
    datasets: [
        { 
            label: 'Count', 
            data: [0, 0, 0, 0], 
            backgroundColor: [
                'rgba(75, 192, 192, 0.8)',      // Office Days (Present)
                'rgba(59, 130, 246, 0.8)',      // WFH
                'rgba(255, 99, 132, 0.8)',      // Absent
                'rgba(255, 159, 64, 0.8)',      // Late
            ], 
            borderWidth: 1 
        }
    ],
};
const DEFAULT_WFH_DATA = {
    labels: ['WFH Days', 'Office Days'],
    datasets: [{ data: [0, 100], backgroundColor: ['#3F51B5', '#81D4FA'], hoverBackgroundColor: ['#3949AB', '#4FC3F7'] }],
};
const WFH_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', 
    plugins: {
        legend: { position: 'right', labels: { boxWidth: 10 } },
        title: { display: false }
    }
};

// ----------------------------------------------------
// Employee Dashboard Content Component
// ----------------------------------------------------
const EmployeeDashboardContent = () => {
    const auth = getAuth();
    
    // --- States for Live Data ---
    const [employeeId, setEmployeeId] = useState(null);
    const [performanceScore, setPerformanceScore] = useState("Loading..."); 
    
    // Chart Data
    const [taskChartData, setTaskChartData] = useState(DEFAULT_TASK_DATA);
    const [attendanceChartData, setAttendanceChartData] = useState(DEFAULT_ATTENDANCE_DATA);
    const [wfhChartData, setWfhChartData] = useState(DEFAULT_WFH_DATA);
    
    // *** NEW RAW COUNT STATES FOR TYPOGRAPHY DISPLAY ***
    const [completeTasks, setCompleteTasks] = useState("N/A");
    const [uncompleteTasks, setUncompleteTasks] = useState("N/A");
    const [attendanceRawCounts, setAttendanceRawCounts] = useState({ office: 'N/A', wfh: 'N/A' });

    const [isCheckedIn, setIsCheckedIn] = useState(false);
    
    const handleCheckInToggle = () => {
        setIsCheckedIn(!isCheckedIn);
        console.log(`User ${isCheckedIn ? 'Checked Out' : 'Checked In'}`);
    };
    
    // --- STEP 1: Fetch employeeId (e.g., "EMP002") from the profile ---
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) {
            setPerformanceScore("N/A");
            return;
        }

        const fetchEmployeeId = async () => {
            try {
                const profileRef = ref(database, `createEmployee/newEmployee/${user.uid}`);
                const snapshot = await get(profileRef);
                
                if (snapshot.exists() && snapshot.val().memberID) {
                    const empId = snapshot.val().memberID;
                    setEmployeeId(empId);
                } else {
                    setPerformanceScore("N/A");
                }
            } catch (err) {
                console.error("Error fetching employee ID:", err);
                setPerformanceScore("Error");
            }
        };

        fetchEmployeeId();
    }, [auth]);


    // --- STEP 2: Fetch Performance Score ---
    useEffect(() => {
        if (!employeeId) return;

        setPerformanceScore("Fetching...");
        
        const performanceQuery = query(
            ref(database, "performanceReviews"),
            orderByChild("empId"),
            equalTo(employeeId)
        );

        const unsubscribe = onValue(performanceQuery, (snapshot) => {
            if (snapshot.exists()) {
                let latestScore = "N/A";
                let latestTimestamp = 0;
                
                snapshot.forEach((childSnapshot) => {
                   const review = childSnapshot.val();
                   const timestamp = new Date(review.date || 0).getTime();
                   
                   if (timestamp > latestTimestamp) {
                       latestTimestamp = timestamp;
                       latestScore = review.score || review.rating; 
                   }
                });

                setPerformanceScore(latestScore || "N/A");
            } else {
                setPerformanceScore("N/A");
            }
        }, (error) => {
            console.error("Firebase Performance Fetch Error:", error);
            setPerformanceScore("Error");
        });

        return () => unsubscribe();
    }, [employeeId]);
    
    
    // --- STEP 3: Fetch Monthly Attendance Data (Including WFH Count) ---
    useEffect(() => {
        if (!employeeId) return;

        const attendanceQuery = query(
            ref(database, "attendanceRecords"),
            orderByChild("empId"),
            equalTo(employeeId)
        );

        const unsubscribe = onValue(attendanceQuery, (snapshot) => {
            let totalPresent = 0; // Raw count of all non-absent days (Office + WFH)
            let totalAbsent = 0;
            let totalLate = 0;
            let totalWFH = 0; 
            
            const today = dayjs();
            const currentMonthYear = today.format('YYYYMM');

            if (snapshot.exists()) {
                snapshot.forEach((childSnapshot) => {
                    const record = childSnapshot.val();
                    const recordDate = dayjs(record.date);
                    const recordMonthYear = recordDate.format('YYYYMM');

                    if (recordMonthYear === currentMonthYear) {
                        const status = (record.attendance || record.status || '').toLowerCase();
                        
                        // 1. Count all working days (Present or WFH)
                        if (status === 'present' || status === 'checkedin' || status === 'wfh') {
                            totalPresent++; 
                        } else if (status === 'absent' || status === 'leave') {
                            totalAbsent++;
                        } 
                        
                        // 2. Count WFH separately
                        if (status === 'wfh' || (record.type && record.type.toLowerCase() === 'wfh')) { 
                            totalWFH++;
                        }
                        
                        // 3. Count Late (Assuming checkIn time is stored as string 'HH:MM')
                        if (record.checkIn && record.checkIn > '09:00') {
                            totalLate++;
                        }
                    }
                });
            }
            
            // Calculate actual Office Days (Total Present - WFH)
            const totalOfficeDays = totalPresent - totalWFH; 
            
            // *** UPDATE RAW COUNT STATE ***
            setAttendanceRawCounts({ office: totalOfficeDays, wfh: totalWFH });

            // --- Update Attendance Bar Chart (4 Columns) ---
            setAttendanceChartData({
                labels: ['Office Days', 'WFH', 'Absent', 'Late'], 
                datasets: [
                    {
                        label: 'Count',
                        // Data order must match labels: Office, WFH, Absent, Late
                        data: [totalOfficeDays, totalWFH, totalAbsent, totalLate], 
                        backgroundColor: DEFAULT_ATTENDANCE_DATA.datasets[0].backgroundColor,
                        borderWidth: 1,
                    },
                ],
            });

            // --- Update WFH Doughnut Chart (Percentages) ---
            let wfhPercent = 0;
            let officePercent = 0;
            const totalWorkingDays = totalPresent; 

            if (totalWorkingDays > 0) {
                wfhPercent = Math.round((totalWFH / totalWorkingDays) * 100);
                officePercent = 100 - wfhPercent;
            }
            
            setWfhChartData({
                labels: ['WFH Days', 'Office Days'],
                datasets: [{ 
                    data: [wfhPercent, officePercent], 
                    backgroundColor: DEFAULT_WFH_DATA.datasets[0].backgroundColor, 
                    hoverBackgroundColor: DEFAULT_WFH_DATA.datasets[0].hoverBackgroundColor
                }],
            });
            
        });

        return () => unsubscribe();
    }, [employeeId]); 
    
    // --- STEP 4 (NEW): Fetch Task Data (Simulated/Placeholder) ---
    // You must replace this block with actual Firebase logic to query your 'tasks' collection
    useEffect(() => {
        if (!employeeId) return;
        
        // --- START SIMULATION ---
        // Replace these hardcoded values with your actual Firebase query logic
        const tempCompleted = 18; 
        const tempUncompleted = 5; 
        // --- END SIMULATION ---
        
        setCompleteTasks(tempCompleted);
        setUncompleteTasks(tempUncompleted);
        
        const totalTasks = tempCompleted + tempUncompleted;
        const completePercent = totalTasks > 0 ? Math.round((tempCompleted / totalTasks) * 100) : 0;
        const uncompletePercent = 100 - completePercent;

        setTaskChartData({
            labels: ['Complete Tasks', 'Uncomplete Tasks'],
            datasets: [{ 
                data: [completePercent, uncompletePercent], 
                backgroundColor: DEFAULT_TASK_DATA.datasets[0].backgroundColor, 
                hoverBackgroundColor: DEFAULT_TASK_DATA.datasets[0].hoverBackgroundColor
            }],
        });
    }, [employeeId]);


    // -----------------------
    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            
            {/* Header, Employee Name, and CheckIn/Out Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pl: 2, pr: 2 }}>
                <Typography variant="h5" fontWeight="medium">
                    {/* Employee Name Placeholder */}
                </Typography>
                {/* <Button 
                    variant="contained" 
                    color={isCheckedIn ? 'error' : 'success'}
                    onClick={handleCheckInToggle}
                    sx={{ borderRadius: '15px' }} 
                >
                    {isCheckedIn ? 'CheckOut' : 'CheckIn'}
                </Button> */}
            </Box>
            
            {/* Main Charts and Metrics Grid */}
            <Grid container spacing={3}>
                
                {/* LEFT SIDE (Performance, Task, Calendar, WFH) */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={3}>
                        
                        {/* 1. Performance Score Card */}
                        <Grid item xs={12} sm={6}>
                            <Card sx={{ width:200, height: 150, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        Latest Performance Score
                                    </Typography>
                                    <Typography variant="h2" color="primary.main" fontWeight="bold">
                                        {performanceScore}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* 2. Task Metrics Card (Doughnut Chart) */}
                        <Grid item xs={12} sm={6}>
                            <Card sx={{ height: 150, p: 1, display: 'flex', alignItems: 'center', borderRadius: 2 }}>
                                <Box sx={{ width: 200, height: 100, ml: 1 }}>
                                    <Doughnut data={taskChartData} options={WFH_OPTIONS} />
                                </Box>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Task Status</Typography>
                                    <Divider sx={{ my: 0.5 }} />
                                    {/* *** Displaying Task Counts *** */}
                                    <Typography  variant="body2" color="text.secondary">Complete Tasks:{completeTasks}</Typography>
                                    <Typography variant="body2" color="text.secondary">Uncomplete Tasks:{uncompleteTasks}</Typography>
                                </Box>
                            </Card>
                        </Grid>
                        
                        {/* 3. WFH Chart Card (Doughnut Chart) */}
                        <Grid item xs={12} sm={6}>
                            <Card sx={{ height: 150, p: 1, display: 'flex', alignItems: 'center', borderRadius: 2 }}>
                                <Box sx={{ width: 300, height: 100, ml: 1 }}>
                                    <Doughnut data={wfhChartData} options={WFH_OPTIONS} />
                                </Box>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">WFH Ratio</Typography>
                                    <Divider sx={{ my: 0.5 }} />
                                    {/* *** Displaying WFH/Office Counts *** */}
                                    <Typography variant="body2" color="text.secondary">WFH Days: {attendanceRawCounts.wfh}</Typography>
                                    <Typography variant="body2" color="text.secondary">Office Days: {attendanceRawCounts.office}</Typography>
                                </Box>
                            </Card>
                        </Grid>

                        {/* 4. Calendar Placeholder - Currently commented out */}
                         {/* <Grid item xs={12} sm={6}>
                            <Card sx={{ p: 1, maxWidth: 400, mx: 'auto', borderRadius: 2 }}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                     <DateCalendar 
                                         readOnly 
                                         sx={{ 
                                             maxWidth: '100%', 
                                             mx: 'auto'
                                         }}
                                     />
                                </LocalizationProvider>
                            </Card>
                         </Grid> */}
                        
                    </Grid>
                </Grid>

                {/* RIGHT SIDE: Attendance Bar Chart */}
                <Grid item xs={12} md={6}>
                    <Card sx={{  height: '100%', minHeight: 490, p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column' }}> 
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ ml: 1, mb: 1 }}>
                            Monthly Attendance
                        </Typography>
                        <Box sx={{ flexGrow: 1,width:500, height: 400 }}>
                            {/* Bar chart uses the updated state with 4 data points (Office, WFH, Absent, Late) */}
                            <Bar data={attendanceChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false }, title: { display: false } } }} />
                        </Box>
                    </Card>
                </Grid>

            </Grid>
        </Box>
    );
};


// ----------------------------------------------------
// Main Export Component
// ----------------------------------------------------
function EmployeeDashboard() {
    return (
        <EmployeeLayout>
            <EmployeeDashboardContent />
        </EmployeeLayout>
    )
}

export default EmployeeDashboard;