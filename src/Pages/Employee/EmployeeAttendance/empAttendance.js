import React, { useEffect, useState } from "react";
import EmployeeLayout from "../../../Layout/Employee_Layout/EmployeeL";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./empAttendance.css";
import { useNavigate } from "react-router-dom";
import attendance_log from "../../../Backend/attendance_log.txt";
function EmployeeAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [extraTime, setExtraTime] = useState("");
  const [showFullView, setShowFullView] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth()); // 0 = Jan
  const [attendanceText, setAttendanceText] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [overtime, setOvertime] = useState("00:00:00");
  const [status, setStatus] = useState("");
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const WORK_START_SECONDS = 8 * 3600; // 08:00:00
  const WORK_END_SECONDS = 17 * 3600; // 17:00:00

  // Fetch attendance text file
  useEffect(() => {
    fetch(attendance_log)
      .then((res) => res.text())
      .then((text) => {
        setAttendanceText(text);
      })
      .catch((err) => console.error(err));
  }, [attendance_log]);

  // Parse attendance text and calculate absent/late/present counts
  useEffect(() => {
    if (!attendanceText) return;

    const lines = attendanceText.split("\n").map((line) => line.trim());
    const data = {};
    const regex = /Attendance #(\w+) at (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/;

    lines.forEach((line) => {
      const match = line.match(regex);
      if (match) {
        const [, type, date, time] = match;
        if (!data[date]) data[date] = {};
        if (type === "first") data[date].checkIn = time;
        else if (type === "last") data[date].checkOut = time;
      }
    });

    const dates = Object.keys(data);

    let absent = 0;
    let late = 0;
    let present = 0;

    dates.forEach((date) => {
      const rec = data[date];
      if (!rec.checkIn && !rec.checkOut) {
        absent++;
      } else {
        present++;
        if (rec.checkIn) {
          const checkInSec = timeToSeconds(rec.checkIn);
          if (checkInSec > WORK_START_SECONDS) {
            late++;
          }
        }
      }
    });

    setAttendanceData(data);
    setAbsentCount(absent);
    setLateCount(late);
    setPresentCount(present);
  }, [attendanceText]);

  // Helper: convert HH:MM:SS string to total seconds
  const timeToSeconds = (timeStr) => {
    const [h, m, s] = timeStr.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  // Helper: convert total seconds to HH:MM:SS string
  const secondsToHHMMSS = (secs) => {
    const h = Math.floor(secs / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((secs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Calculate overtime and status when checkIn or checkOut changes
  useEffect(() => {
    if (!checkIn && !checkOut) {
      setOvertime("00:00:00");
      setStatus("");
      return;
    }

    const checkInSec = checkIn ? timeToSeconds(checkIn) : WORK_START_SECONDS;
    const checkOutSec = checkOut ? timeToSeconds(checkOut) : WORK_END_SECONDS;

    let otSeconds = 0;
    if (checkInSec < WORK_START_SECONDS) otSeconds += WORK_START_SECONDS - checkInSec;
    if (checkOutSec > WORK_END_SECONDS) otSeconds += checkOutSec - WORK_END_SECONDS;
    setOvertime(secondsToHHMMSS(otSeconds));

    let newStatus = "";
    if (checkInSec > WORK_START_SECONDS) {
      newStatus = "Late";
    } else {
      newStatus = "On time";
    }

    if (checkOutSec < WORK_END_SECONDS) {
      newStatus = newStatus === "Late" ? "Late & Half day" : "Half day";
    } else {
      if (newStatus === "On time") newStatus = "Full day";
    }

    setStatus(newStatus);
  }, [checkIn, checkOut]);

  // Update checkIn, checkOut, status, overtime when selected date changes
  useEffect(() => {
    const dateStr = selectedDate.toISOString().slice(0, 10);
    if (attendanceData[dateStr]) {
      setCheckIn(attendanceData[dateStr].checkIn || "");
      setCheckOut(attendanceData[dateStr].checkOut || "");
    } else {
      setCheckIn("");
      setCheckOut("");
      setStatus("");
      setOvertime("00:00:00");
    }
  }, [selectedDate, attendanceData]);
  const handleDateClick = (date) => {
    setSelectedDate(date);
    setShowModal(true);
    setCheckIn("");
    setCheckOut("");
    setExtraTime("");
  };

  const attendanceRecords = [
    {
      date: "2025-07-01",
      checkIn: "09:00 AM",
      checkOut: "05:00 PM",
      status: "Present",
    },
    { date: "2025-07-02", checkIn: "-", checkOut: "-", status: "Absent" },
    {
      date: "2025-08-01",
      checkIn: "09:10 AM",
      checkOut: "05:10 PM",
      status: "Present",
    },
  ];
  const navigate = useNavigate();

  return (
    <EmployeeLayout>
      <div className="attendance-container">
        <h2 className="attendance-title">Employee Attendance</h2>

        <div className="attendance-top-section">
          <div className="calendar-wrapper">
            <Calendar
              onChange={handleDateClick}
              value={selectedDate}
              className="attendance-calendar"
            />
          </div>

          <div className="attendance-summary-vertical">
            <div className="attendance-card present">
              <p>Present Days</p>
              <h3>{presentCount}</h3>
            </div>
            <div className="attendance-card absent">
              <p>Absent Days</p>
              <h3>{absentCount}</h3>
            </div>
            <div className="attendance-card late">
              <p>Late Days</p>
              <h3>{lateCount}</h3>
            </div>
          </div>
        </div>

        <div className="attendance-table-section">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check-In</th>
                <th>Check-Out</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2025-07-29</td>
                <td>Present</td>
                <td>09:01 AM</td>
                <td>05:03 PM</td>
              </tr>
              <tr>
                <td>2025-07-30</td>
                <td>Absent</td>
                <td>-</td>
                <td>-</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="attendance-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowFullView(true)}
          >
            View All Attendance
          </button>

          <button
            className="btn-primary"
            onClick={() => navigate("/employeeLeave")}
          >
            Leave Request
          </button>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Attendance Details</h3>
              <p>Date: {selectedDate.toDateString()}</p>

              <label>Check-In Time:</label>
              <input
                type="time"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                disabled
              />

              <label>Check-Out Time:</label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                disabled
              />

              <p>
                <p>Overtime (OT) : {overtime}</p>
                <p>Status: {status}</p>
              </p>

              {/* <button
                onClick={() => setShowModal(false)}
                className="btn-primary"
                style={{ marginTop: "15px" }}
              >
                Save
              </button> */}
            </div>
          </div>
        )}

        {showFullView && (
          <div
            className="full-attendance-overlay"
            onClick={() => setShowFullView(false)}
          >
            <div
              className="full-attendance-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>All Attendance Records</h3>

              <label>Filter by Month:</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString("default", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <table className="full-attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check-In</th>
                    <th>Check-Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords
                    .filter(
                      (rec) => new Date(rec.date).getMonth() === filterMonth
                    )
                    .map((rec, idx) => (
                      <tr key={idx}>
                        <td>{rec.date}</td>
                        <td>{rec.checkIn}</td>
                        <td>{rec.checkOut}</td>
                        <td>{rec.status}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <button
                className="btn-primary"
                style={{ marginTop: "20px" }}
                onClick={() => setShowFullView(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </EmployeeLayout>
  );
}

export default EmployeeAttendance;
