import React, { useState, useEffect } from 'react';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL'; 
import { Box, Typography, Card, CardContent, Button, Grid, Divider } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { Doughnut, Bar } from 'react-chartjs-2'; 
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'; 
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../../../Service/FirebaseConfig';
import { getAuth } from "firebase/auth";
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Load Logged User First
const auth = getAuth();
const loggedUser = auth.currentUser;

// If user is not logged in → null
const currentEmpID = loggedUser?.empId;
const taskData = {
    labels: ['Complete Tasks', 'Uncomplete Tasks'],
    datasets: [
        {
            data: [70, 30], // Example data
            backgroundColor: ['#4CAF50', '#FF9800'], 
            hoverBackgroundColor: ['#45A049', '#FB8C00'],
        },
    ],
};
const taskOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', 
    plugins: {
        legend: {
            position: 'right',
            labels: { boxWidth: 10 }
        },
        title: { display: false }
    }
};

// --- 2. Attendance Data for Bar Chart ---
// Mock data based on the visualization
const attendanceData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [
        {
            label: 'Count',
            data: [20, 3, 5], 
            backgroundColor: [
                'rgba(75, 192, 192, 0.8)', 
                'rgba(255, 99, 132, 0.8)', 
                'rgba(255, 159, 64, 0.8)', 
            ],
            borderWidth: 1,
        },
    ],
};
const attendanceOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false }, title: { display: false } }
};

// ----------------------------------------------------
// Employee Dashboard Content Component
// ----------------------------------------------------
const EmployeeDashboardContent = () => {
    // State for the CheckIn/CheckOut button
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    
    // Mock State for the Performance Score
    const [performanceScore, setPerformanceScore] = useState("Loading..."); 

    const handleCheckInToggle = () => {
        // Here you would implement your Firebase write logic for attendance
        setIsCheckedIn(!isCheckedIn);
        console.log(`User ${isCheckedIn ? 'Checked Out' : 'Checked In'}`);
    };

    // Placeholder for the current employee's ID (e.g., fetched from auth context)
    // We use '004' as seen in your Firebase image for testing/demonstration.

    // -----------------------------------------


useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        console.log("⚠️ No logged user found.");
        setPerformanceScore("N/A");
        return;
    }

    const currentEmpID = user.empId;  // make sure your user has empId in auth

    console.log("🔍 Logged user's empId:", currentEmpID);

    if (!currentEmpID) {
        setPerformanceScore("N/A");
        return;
    }

    const performanceQuery = query(
        ref(database, "performanceReviews"),
        orderByChild("empId"),
        equalTo(currentEmpID)
    );

    const unsubscribe = onValue(performanceQuery, (snapshot) => {
        if (snapshot.exists()) {
            const reviews = snapshot.val();
            const latestKey = Object.keys(reviews).pop();
            const latestScore = reviews[latestKey].score;

            console.log("🎯 Latest Score:", latestScore);

            setPerformanceScore(latestScore);
        } else {
            setPerformanceScore("N/A");
        }
    });

    return () => unsubscribe();
}, []);


    // -----------------------
    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            
            {/* Header, Employee Name, and CheckIn/Out Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pl: 2, pr: 2 }}>
                <Typography variant="h5" fontWeight="medium">
                    Employee - Employee Name
                </Typography>
                <Button 
                    variant="contained" 
                    color={isCheckedIn ? 'error' : 'success'}
                    onClick={handleCheckInToggle}
                    sx={{ borderRadius: '15px' }} 
                >
                    {isCheckedIn ? 'CheckOut' : 'CheckIn'}
                </Button>
            </Box>
            
            {/* Main Charts and Metrics Grid */}
            <Grid container spacing={3}>
                
                {/* LEFT SIDE (Performance, Task, Calendar) */}
                <Grid item xs={12} md={6}>
                    <Grid container spacing={3}>
                        
                        {/* 1. Performance Score Card */}
                        <Grid item xs={12} sm={6}>
                            <Card sx={{ height: 150, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                <CardContent>
                                    <Typography variant="body2" color="text.secondary">
                                        Performance Score
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
                                <Box sx={{ width: 100, height: 100, ml: 1 }}>
                                    <Doughnut data={taskData} options={taskOptions} />
                                </Box>
                                <Box sx={{ ml: 2 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Task</Typography>
                                    <Divider sx={{ my: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary">Complete Tasks</Typography>
                                    <Typography variant="body2" color="text.secondary">Uncomplete Tasks</Typography>
                                </Box>
                            </Card>
                        </Grid>
                        
                        {/* 3. Calendar */}
                        <Grid item xs={12}>
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
                        </Grid>
                    </Grid>
                </Grid>

                {/* RIGHT SIDE: Attendance Bar Chart */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%', minHeight: 490, p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column' }}> 
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ ml: 1, mb: 1 }}>
                            Attendance
                        </Typography>
                        <Box sx={{ flexGrow: 1, height: 400 }}>
                            <Bar data={attendanceData} options={attendanceOptions} />
                        </Box>
                        <Button 
                            variant="outlined" 
                            size="small"
                            sx={{ mt: 2 }}
                        >
                            OK (View Details Placeholder)
                        </Button>
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
    <>
        <EmployeeLayout>
            <EmployeeDashboardContent />
        </EmployeeLayout>
    </>
  )
}

export default EmployeeDashboard;