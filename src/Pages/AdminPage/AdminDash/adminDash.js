import React, { useState, useEffect } from "react";
import AdminLayout from "../../../Layout/Admin_Layout/AdminL";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { ref, onValue, query, orderByChild, equalTo } from "firebase/database";
import { database } from "../../../Service/FirebaseConfig";
import RoundClock from "./RoundClock";

// -----------------------------
// INITIAL CARDS
// -----------------------------
const initialCards = [
  { id: 1, title: "Today Attendance", value: "Loading...", isBig: false },
  { id: 2, title: "No Of Departments", value: "3", isBig: false },
  { id: 3, title: "NO of Employees", value: "Loading...", isBig: false },
  { id: 4, title: "Pending Leave Requests", value: "Loading...", isBig: false },
  { id: 5, title: "Rejected Leave Requests", value: "Loading...", isBig: false },
    { id:6, title: "Add any", value: "Add anything...", isBig: false },
];

function AdminDashboard() {
  const [todayAttendance, setTodayAttendance] = useState("Loading...");
  const [pendingLeaveCount, setPendingLeaveCount] = useState("Loading...");
  const [rejectedLeaveCount, setRejectedLeaveCount] = useState("Loading...");
  const [cardsData, setCardsData] = useState(initialCards);
  const [employeeList, setEmployeeList] = useState([]);

  // -----------------------------
  // 1. Today Attendance
  // -----------------------------
  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");

    const attendanceQuery = query(
      ref(database, "attendanceRecords"),
      orderByChild("date"),
      equalTo(today)
    );

    onValue(attendanceQuery, (snapshot) => {
      if (snapshot.exists()) {
        setTodayAttendance(snapshot.size);
      } else {
        setTodayAttendance(0);
      }
    });
  }, []);

  // -----------------------------
  // 2. Pending Leave Count
  // -----------------------------
  useEffect(() => {
    const pendingQuery = query(
      ref(database, "leaveRequests"),
      orderByChild("status"),
      equalTo("Pending")
    );

    onValue(pendingQuery, (snapshot) => {
      setPendingLeaveCount(snapshot.exists() ? snapshot.size : 0);
    });
  }, []);

  // -----------------------------
  // 3. Rejected Leave Count
  // -----------------------------
  useEffect(() => {
    const rejectedQuery = query(
      ref(database, "leaveRequests"),
      orderByChild("status"),
      equalTo("Rejected")
    );

    onValue(rejectedQuery, (snapshot) => {
      setRejectedLeaveCount(snapshot.exists() ? snapshot.size : 0);
    });
  }, []);

  // -----------------------------
  // 4. Employee List Count
  // -----------------------------
  useEffect(() => {
    const employeesRef = ref(database, "createEmployee/newEmployee");

    onValue(employeesRef, (snapshot) => {
      if (snapshot.exists()) {
        const employeesObject = snapshot.val();
        const employeesArray = Object.keys(employeesObject).map((key) => ({
          id: key,
          ...employeesObject[key],
        }));
        setEmployeeList(employeesArray);
      } else {
        setEmployeeList([]);
      }
    });
  }, []);

  // -----------------------------
  // 5. Update cards whenever data changes
  // -----------------------------
  useEffect(() => {
    setCardsData((prev) =>
      prev.map((card) => {
        if (card.id === 1) return { ...card, value: todayAttendance };
        if (card.id === 3)
          return { ...card, value: employeeList.length.toLocaleString() };
        if (card.id === 4) return { ...card, value: pendingLeaveCount };
        if (card.id === 5) return { ...card, value: rejectedLeaveCount };
        return card;
      })
    );
  }, [
    todayAttendance,
    employeeList,
    pendingLeaveCount,
    rejectedLeaveCount,
  ]);

  // -----------------------------
  // UI RENDER
  // -----------------------------
  return (
    <AdminLayout>
      <Box sx={{ p: 2, backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
        
        {/* Dashboard Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            maxWidth: 900,
            width: "100%",
            mx: "auto",
          }}
        >
          {cardsData.map((card) => (
            <Card
              key={card.id}
              sx={{
                gridColumn: "span 1",
                minHeight: 120,
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
                    fontWeight={card.isBig ? "bold" : "normal"}
                    sx={{ color: "#333" }}
                  >
                    {card.value}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: card.isBig ? 0.5 : 0 }}
                  >
                    {card.title}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>

        {/* Clock + Calendar */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            maxWidth: 1100,
            mx: "auto",
            mt: 4,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {/* New Zealand Clock */}
          <RoundClock city="New Zealand" timezone="Pacific/Auckland" />

          {/* Calendar */}
          <Box
            sx={{
              maxWidth: 400,
              width: "100%",
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar readOnly sx={{ width: "100%" }} />
            </LocalizationProvider>
          </Box>

          {/* Sri Lanka Clock */}
          <RoundClock city="Sri Lanka" timezone="Asia/Colombo" />

          {/* India Clock */}
          {/* <RoundClock city="India" timezone="Asia/Kolkata" /> */}
        </Box>
      </Box>
    </AdminLayout>
  );
}

export default AdminDashboard;
