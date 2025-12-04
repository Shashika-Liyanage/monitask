import React, { useEffect, useState } from "react";

export default function RoundClock({ city, timezone }) {
  const [timeData, setTimeData] = useState({
    time: "",
    date: "",
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const timeString = now.toLocaleTimeString("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const dateString = now.toLocaleDateString("en-US", {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      setTimeData({ time: timeString, date: dateString });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <div
      style={{
        width: 180,
        height: 180,
        borderRadius: "50%",
        background: "white",
        padding: 20,
        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <h4 style={{ margin: 0 }}>{city}</h4>
      <h2 style={{ margin: "10px 0" }}>{timeData.time}</h2>
      <p style={{ fontSize: 12, color: "#555", margin: 0 }}>{timeData.date}</p>
    </div>
  );
}
