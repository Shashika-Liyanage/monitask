import React, { useState, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";
import dayjs from "dayjs";
import { DemoContainer, DemoItem } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database"; // Removed unused getDatabase, initializeApp
import { database } from "../../../Service/FirebaseConfig";
import RoundClock from "./RoundClock";

// Corrected initialCards structure to accurately reflect the IDs and titles for dynamic data
const initialCards = [
  { id: 1, title: "No Of Departments", value: "3", isBig: false },
  { id: 2, title: "NO of Employees", value: "1,250", isBig: false },
  { id: 3, title: "Pending Leave Requests", value: "Loading...", isBig: false }, // ID 3 for Pending
  { id: 4, title: "Canceld Leave Requests", value: "Loading...", isBig: false }, // ID 4 for Rejected
];

function AdminDashboard() {
    // Corrected initialization to fetch value from the card with ID 3
    const [pendingLeaveCount, setPendingLeaveCount] = useState(
        initialCards.find(card => card.id === 3)?.value || 'Loading...'
    );
    const [rejectedLeaveCount, setRejectedLeaveCount] = useState(
        initialCards.find(card => card.id === 4)?.value || 'Loading...'
    );
    
    const [cardsData, setCardsData] = useState(initialCards);
    const [employeeList, setEmployeeList] = useState([]);


    // --- 1. Firebase Data Fetching: Count PENDING Leaves (CORRECTED LOGIC) ---
    useEffect(() => {
        // Create a query targeting 'leaveRequests' where status equals "Pending"
        const pendingQuery = query(
            ref(database, "leaveRequests"),
            orderByChild("status"),
            equalTo("Pending") // Filter for status: "Pending"
        );

        // Attach an observer to read the filtered data
        const unsubscribePending = onValue(
          pendingQuery,
          (snapshot) => {
            if (snapshot.exists()) {
                const count = snapshot.size; // Get the count of filtered results
                setPendingLeaveCount(count);
            } else {
                setPendingLeaveCount(0);
            }
          },
          (error) => {
            console.error("Firebase pending count fetch failed:", error);
            setPendingLeaveCount("Error");
          }
        );

        return () => unsubscribePending();
    }, []);

    // --- 2. Firebase Data Fetching: Count REJECTED Leaves (Existing Logic) ---
    useEffect(() => {
        const rejectedQuery = query(
            ref(database, "leaveRequests"),
            orderByChild("status"),
            equalTo("Rejected")
        );

        const unsubscribeRejected = onValue(
          rejectedQuery,
          (snapshot) => {
            if (snapshot.exists()) {
                const count = snapshot.size; 
                setRejectedLeaveCount(count);
            } else {
                setRejectedLeaveCount(0);
            }
          },
          (error) => {
            console.error("Firebase rejected count fetch failed:", error);
            setRejectedLeaveCount("Error");
          }
        );
        return () => unsubscribeRejected();
    }, []);


    // --- 3. Fetch Employee List (Existing Logic) ---
    useEffect(() => {
        const employeesRef = ref(database, "createEmployee/newEmployee");
        const unsubscribeEmployees = onValue(employeesRef, (snapshot) => {
            if (snapshot.exists()) {
                const employeesObject = snapshot.val();
                const employeesArray = Object.keys(employeesObject).map(key => ({
                    id: key,
                    ...employeesObject[key]
                }));
                setEmployeeList(employeesArray);
                const employeeCount = employeesArray.length;
                setCardsData(prevData => prevData.map(card => 
                    card.id === 2 ? { ...card, value: employeeCount.toLocaleString() } : card
                ));
            } else {
                setEmployeeList([]);
            }
        });
        return () => unsubscribeEmployees();
    }, []);


    // --- 4. Update the displayed card data (Consolidated Logic) ---
    useEffect(() => {
        setCardsData((prevData) =>
          prevData.map((card) => {
            if (card.id === 3) { // Target Pending Leave Requests
              return { ...card, value: pendingLeaveCount };
            }
            if (card.id === 4) { // Target Rejected Leave Requests
              return { ...card, value: rejectedLeaveCount };
            }
            return card;
          })
        );
    }, [pendingLeaveCount, rejectedLeaveCount]);

  // --- JSX Rendering (Unchanged) ---
  return (
    <AdminLayout>
      {/* Outer padding/container box */}
      <Box sx={{ p: 3, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
        {/* Metric Cards Grid Container: Centered using mx: 'auto' */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 2fr)",
            gap: 2,
            maxWidth: 800,
            width: "100%",
            mx: "auto",
          }}
        >
          {cardsData.map((card) => (
            <Card
              key={card.id}
              sx={{
                // Card 4 spans two columns
                gridColumn: card.isBig ? "span 2" : "span 1",
                height: card.isBig ? 250 : 200,
                textAlign: "center",
              }}
            >
              <CardActionArea
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  <Typography
                    variant={card.isBig ? "h4" : "h3"}
                    component="div"
                    fontWeight={card.isBig ? "bold" : "normal"}
                    sx={{ color: "#333" }}
                  >
                    {card.value}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight="normal"
                    sx={{ mt: card.isBig ? 0.5 : 0 }}
                  >
                    {card.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
<Box 
            sx={{
                display: 'flex',
                alignItems: 'center', // Vertically align items
                justifyContent: 'center',
                width: '100%',
                maxWidth: 800, // Constrain the full clock+calendar block
                mx: 'auto',
                mt: 4, 
            }}
        >
            
            {/* 1. New Zealand Clock (Left Side) */}
            <Box sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}>
                <RoundClock 
                    city="New Zealand" 
                    timezone="Pacific/Auckland" 
                    initialTime="06:58 AM" // Current NZ time
                />
            </Box>

            {/* 2. Calendar Block (Center) */}
            <Box 
                sx={{
                    maxWidth: 400,
                    width: '100%',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: 3,
                }}
            >
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateCalendar 
                        
                        readOnly 
                        sx={{ width: '100%' }}
                    />
                </LocalizationProvider>
            </Box>
            
            {/* 3. Sri Lanka Clock (Right Side) */}
            <Box sx={{ ml: 2, display: { xs: 'none', sm: 'block' } }}>
                <RoundClock 
                    city="Sri Lanka" 
                    timezone="Asia/Colombo" 
                    initialTime="11:28 PM" // Current SL time
                />
            </Box>

        </Box>
    </AdminLayout>
  );
}

export default AdminDashboard;