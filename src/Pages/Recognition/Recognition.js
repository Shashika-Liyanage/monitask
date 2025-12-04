import React, { useRef, useState, useEffect } from "react";
import { ref, set } from "firebase/database";
import { database } from "../../Service/FirebaseConfig";
import { getAuth } from "firebase/auth";
import AdminLayout from "../../Layout/Admin_Layout/AdminL";

export default function Recognition() {
  const videoRef = useRef(null);
  const [detected, setDetected] = useState("Detecting...");
  const [quantity, setQuantity] = useState(1);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [currentCameraFacing, setCurrentCameraFacing] = useState("environment");
  let intervalID = null;

  // AUTO OPEN CAMERA WHEN PAGE LOADS
  useEffect(() => {
    openCamera(currentCameraFacing);
    return () => clearInterval(intervalID);
  }, []);

  const getCameraStream = async (facingMode) => {
    const currentStream = videoRef.current?.srcObject;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }

    const constraints = {
      video: {
        width: { ideal: 400 },
        height: { ideal: 300 },
        facingMode: facingMode,
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      setCurrentCameraFacing(facingMode);
      return true;
    } catch (error) {
      console.error("Camera error:", error);
      alert("Camera access blocked!");
      return false;
    }
  };

  const openCamera = async (facingMode = currentCameraFacing) => {
    const success = await getCameraStream(facingMode);
    if (success) {
      setIsCameraOpen(true);
      intervalID = setInterval(() => {
        captureFrame();
      }, 1000);
    }
  };

  const toggleCameraFacing = () => {
    const newFacing = currentCameraFacing === "user" ? "environment" : "user";
    openCamera(newFacing);
  };

  const closeCamera = () => {
    clearInterval(intervalID);
    setIsCameraOpen(false);

    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 400;
    canvas.height = video.videoHeight || 300;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch("http://127.0.0.1:8000/detect-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await res.json();
      setDetected(data.item);
    } catch (err) {
      console.error("Detection API error:", err);
      setDetected("Detection Failed");
    }
  };

  const addToInventory = async () => {
    if (!detected || detected === "Detecting...") {
      alert("No item detected!");
      return;
    }

    const itemName = detected.toLowerCase().trim();

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return alert("Not logged in!");

      const username =
        currentUser.displayName || currentUser.email || "UnknownUser";

      const newItemRef = ref(
        database,
        "inventory/" + Date.now() + "-" + itemName
      );

      await set(newItemRef, {
        name: itemName,
        quantity: parseInt(quantity),
        lastUpdated: Date.now(),
        updatedBy: username,
      });

      alert("Item saved!");
    } catch (err) {
      console.error(err);
      alert("Error saving item!");
    }
  };

  // ----------------------------- UI -----------------------------
  return (
    <AdminLayout>
      <div style={{ padding: "20px", textAlign: "center" }}>
        {/* AUTO OPENED CAMERA MODAL */}
        <div
          style={{
            display: isCameraOpen ? "flex" : "none",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "25px",
              width: "90%",
              maxWidth: "450px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <h3>📦 Auto Item Recognition</h3>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                borderRadius: "10px",
                border: "3px solid #007bff",
              }}
            ></video>

            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
              Detected: {detected}
            </p>

            <input
              type="number"
              value={quantity}
              min="1"
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              style={{
                padding: "8px",
                width: "80px",
                marginBottom: "10px",
              }}
            />

            <div>
              <button
                onClick={addToInventory}
                style={{
                  padding: "10px 18px",
                  background: "#007bff",
                  color: "white",
                  border: 0,
                  borderRadius: "5px",
                  marginRight: "5px",
                }}
              >
                Add to Inventory
              </button>

              <button
                onClick={toggleCameraFacing}
                style={{
                  padding: "10px 18px",
                  background: "#ffc107",
                  border: 0,
                  borderRadius: "5px",
                  marginRight: "5px",
                }}
              >
                Switch Camera
              </button>

              <button
                onClick={closeCamera}
                style={{
                  padding: "10px 18px",
                  background: "gray",
                  color: "white",
                  border: 0,
                  borderRadius: "5px",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
