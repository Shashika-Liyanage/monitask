import React, { useEffect, useState } from "react";
import EmployeeLayout from "../../../Layout/Employee_Layout/EmployeeL";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./empAttendance.css";
import { useNavigate } from "react-router-dom";
// NOTE: Ensure these paths are correct relative to your project structure
import attendance_log from "../../../Backend/attendance_log.txt";
import lookaway_log from "../../../Backend/look_away_log.txt";

function EmployeeAttendance() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [extraTime, setExtraTime] = useState("");
  const [showFullView, setShowFullView] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth()); // 0 = Jan
  const [attendanceText, setAttendanceText] = useState("");
  const [lookawayText, setlookAwayText] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [overtime, setOvertime] = useState("00:00:00");
  const [status, setStatus] = useState("");
  const [absentCount, setAbsentCount] = useState(0);
  const [lateCount, setLateCount] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const WORK_START_SECONDS = 8 * 3600; // 08:00:00
  const WORK_END_SECONDS = 17 * 3600; // 17:00:00

  const navigate = useNavigate();

  // Helper: convert HH:MM:SS string to total seconds
  const timeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m, s] = timeStr.split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };

  // Helper: convert total seconds to HH:MM:SS string
  const secondsToHHMMSS = (secs) => {
    const absSecs = Math.abs(secs);
    const h = Math.floor(absSecs / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((absSecs % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (absSecs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // 1. Fetch attendance text file
  useEffect(() => {
    fetch(attendance_log)
      .then((res) => res.text())
      .then((text) => {
        setAttendanceText(text);
      })
      .catch((err) => console.error("Error fetching attendance log:", err));
  }, [attendance_log]);

  // 2. Fetch lookaway text file (currently unused in logic)
  useEffect(() => {
    fetch(lookaway_log)
      .then((res) => res.text())
      .then((text) => {
        setlookAwayText(text);
      })
      .catch((err) => console.error("Error fetching lookaway log:", err));
  }, [lookaway_log]);

  // 3. Parse attendance text and calculate absent/late/present counts
  useEffect(() => {
    if (!attendanceText) return;

    const lines = attendanceText.split("\n").map((line) => line.trim());
    const data = {};

    // Expects 'Attendance #first/last at YYYY-MM-DD HH:MM:SS'
    const regex =
      /(Log In|Log Out)\s+at\s+(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})/;

    lines.forEach((line) => {
      const match = line.match(regex);
      if (match) {
        const [, type, date, time] = match;
        if (!data[date]) data[date] = {};

        // Use 'first' for Check-In and 'last' for Check-Out
        if (type === "Log In") data[date].checkIn = time;
        else if (type === "Log Out") data[date].checkOut = time;
      }
    });

    const dates = Object.keys(data);

    // Get all dates from the current month for accurate counting
    const currentYear = new Date().getFullYear();
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const currentMonthDays = Array.from(
      { length: daysInMonth(currentYear, filterMonth) },
      (_, i) => {
        const day = (i + 1).toString().padStart(2, "0");
        const month = (filterMonth + 1).toString().padStart(2, "0");
        return `${currentYear}-${month}-${day}`;
      }
    );

    let absent = 0;
    let late = 0;
    let present = 0;

    currentMonthDays.forEach((date) => {
      const rec = data[date];
      const dayOfWeek = new Date(date).getDay(); // 0=Sunday, 6=Saturday
      // Skip weekend days for simpler logic (assuming M-F work week)
      if (dayOfWeek === 0 || dayOfWeek === 6) return;

      if (!rec || !rec.checkIn) {
        absent++;
      } else {
        present++;
        const checkInSec = timeToSeconds(rec.checkIn);
        if (checkInSec > WORK_START_SECONDS) {
          late++;
        }
      }
    });

    // NOTE: This logic needs refinement to correctly count present/absent
    // across all days in the month/year, not just the dates found in the log.
    // However, sticking to your provided logic for now:
    setAttendanceData(data);
    setAbsentCount(absent);
    setLateCount(late);
    setPresentCount(present);
  }, [attendanceText, filterMonth]); // Added filterMonth as a dependency

  // 4. Calculate overtime and status when checkIn or checkOut changes
  useEffect(() => {
    // Determine if the selected date is a weekend (to avoid setting status/OT)
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      setOvertime("00:00:00");
      setStatus("Weekend/Holiday");
      return;
    }

    // Handle case where no attendance is logged for the day
    if (!checkIn && !checkOut) {
      setOvertime("00:00:00");
      setStatus("Absent");
      return;
    }

    const checkInSec = checkIn ? timeToSeconds(checkIn) : WORK_START_SECONDS;
    const checkOutSec = checkOut ? timeToSeconds(checkOut) : WORK_END_SECONDS;

    // Calculate Overtime
    let otSeconds = 0;
    // Overtime from early check-in
    if (checkIn && checkInSec < WORK_START_SECONDS)
      otSeconds += WORK_START_SECONDS - checkInSec;
    // Overtime from late check-out
    if (checkOut && checkOutSec > WORK_END_SECONDS)
      otSeconds += checkOutSec - WORK_END_SECONDS;
    setOvertime(secondsToHHMMSS(otSeconds));

    // Determine Status
    let newStatus = "Present";

    const checkInTime = new Date(`2000/01/01 ${checkIn}`);
    const workStartTime = new Date(
      `2000/01/01 ${secondsToHHMMSS(WORK_START_SECONDS)}`
    );
    const checkOutTime = new Date(`2000/01/01 ${checkOut}`);
    const workEndTime = new Date(
      `2000/01/01 ${secondsToHHMMSS(WORK_END_SECONDS)}`
    );

    if (checkIn && checkInTime > workStartTime) {
      newStatus = "Late";
    } else if (checkIn) {
      newStatus = "On time";
    }

    if (checkOut && checkOutTime < workEndTime) {
      newStatus = newStatus === "Late" ? "Late & Half day" : "Half day";
    } else {
      if (newStatus === "On time") newStatus = "Full day";
    }

    // Handle only check-in or only check-out (incomplete day)
    if (checkIn && !checkOut) {
      newStatus = (newStatus === "Late" ? "Late" : "On time") + " (Incomplete)";
    }
    if (checkOut && !checkIn) {
      newStatus = "Check-Out Only (Incomplete)";
    }

    setStatus(newStatus);
  }, [checkIn, checkOut, selectedDate]);

  // 5. Update checkIn, checkOut, status, overtime when selected date changes
  useEffect(() => {
    const dateStr = selectedDate.toISOString().slice(0, 10);

    // Check if the selected date is a weekend
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setCheckIn("");
      setCheckOut("");
      setStatus("Weekend/Holiday");
      setOvertime("00:00:00");
      return;
    }

    // Check data from parsed log
    if (attendanceData[dateStr]) {
      setCheckIn(
        secondsToHHMMSS(timeToSeconds(attendanceData[dateStr].checkIn)) || ""
      );
      setCheckOut(
        secondsToHHMMSS(timeToSeconds(attendanceData[dateStr].checkOut)) || ""
      );
    } else {
      setCheckIn("");
      setCheckOut("");
      setStatus("Absent");
      setOvertime("00:00:00");
    }
  }, [selectedDate, attendanceData]);

const handleDateClick = (date) => {
  const day = date.getDay();

  // Prevent opening modal on weekends
  if (day === 0 || day === 6) {
    alert("Weekends are not counted for attendance.");
    return;
  }

  setSelectedDate(date);
  setShowModal(true);
  setExtraTime("");
};


  // Simplified attendanceRecords for the 'View All' modal (to show log parsing works)
  // This will be populated from attendanceData in a real app, but for now we'll
  // map the attendanceData to a display format.
  const recordsForFullView = Object.keys(attendanceData)
    .map((dateStr) => {
      const rec = attendanceData[dateStr];
      // Recalculate status for the full view table
      const checkInSec = rec.checkIn ? timeToSeconds(rec.checkIn) : 0;
      const checkOutSec = rec.checkOut ? timeToSeconds(rec.checkOut) : 0;

      let currentStatus = "Absent";
      if (rec.checkIn) {
        currentStatus = checkInSec > WORK_START_SECONDS ? "Late" : "On time";
        if (rec.checkOut && checkOutSec < WORK_END_SECONDS) {
          currentStatus =
            currentStatus === "Late" ? "Late & Half day" : "Half day";
        } else if (rec.checkOut) {
          if (currentStatus === "On time") currentStatus = "Full day";
          else if (currentStatus === "Late") currentStatus = "Late";
        } else if (rec.checkIn) {
          currentStatus += " (Incomplete)";
        }
      }

      return {
        date: dateStr,
        checkIn: rec.checkIn || "-",
        checkOut: rec.checkOut || "-",
        status: currentStatus,
      };
    })
    .filter((rec) => new Date(rec.date).getMonth() === filterMonth);

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
              tileDisabled={({ date }) =>
                date.getDay() === 0 || date.getDay() === 6
              }
            />
          </div>

          <div className="attendance-summary-vertical">
            <div className="attendance-card present">
              <p>Present Days (Month)</p>
              <h3>{presentCount}</h3>
            </div>
            <div className="attendance-card absent">
              <p>Absent Days (Month)</p>
              <h3>{absentCount}</h3>
            </div>
            <div className="attendance-card late">
              <p>Late Days (Month)</p>
              <h3>{lateCount}</h3>
            </div>
          </div>
        </div>

        <div className="attendance-table-section">
          <p className="table-caption">Recent Attendance</p>
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
              {/* Displaying a small number of recent records for quick view */}
              {Object.keys(attendanceData)
                .sort()
                .reverse()
                .slice(0, 5) // Show top 5 recent records
                .map((dateStr, idx) => {
                  const rec = attendanceData[dateStr];
                  // Simple status check for table display
                  const checkInTime = rec.checkIn || "-";
                  const checkOutTime = rec.checkOut || "-";
                  const displayStatus =
                    checkInTime !== "-"
                      ? timeToSeconds(checkInTime) > WORK_START_SECONDS
                        ? "Late"
                        : "Present"
                      : "Absent";

                  return (
                    <tr key={idx}>
                      <td>{dateStr}</td>
                      <td>{displayStatus}</td>
                      <td>{checkInTime}</td>
                      <td>{checkOutTime}</td>
                    </tr>
                  );
                })}
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
              <p className="modal-date">
                Date: {selectedDate.toDateString()}
              </p>

              <label>Check-In Time:</label>
              <input
                type="text" // Change to text since it's disabled/read-only in this context
                value={checkIn || "N/A"}
                disabled
              />

              <label>Check-Out Time:</label>
              <input
                type="text" // Change to text since it's disabled/read-only in this context
                value={checkOut || "N/A"}
                disabled
              />

              <div className="modal-info-box">
                <p>Status: {status || "Loading..."}</p>
                <p>Overtime (OT) : {overtime}</p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="btn-primary"
                style={{ marginTop: "15px" }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Full View Modal */}
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
                  {recordsForFullView.map((rec, idx) => (
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
