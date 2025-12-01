import React, { useRef, useState } from "react";
import { ref, set, get, update, runTransaction } from "firebase/database";
import { database } from "../../Service/FirebaseConfig";
import { getAuth } from "firebase/auth";

export default function Recognition() {
  const videoRef = useRef(null);
  const [detected, setDetected] = useState("Detecting...");
  const [quantity, setQuantity] = useState(1);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  // Store the ID of the current camera device (e.g., 'user' or 'environment')
  const [currentCameraFacing, setCurrentCameraFacing] = useState("user"); 
  let intervalID = null;

  const getCameraStream = async (facingMode) => {
    // Stop any existing tracks
    const currentStream = videoRef.current?.srcObject;
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    const constraints = {
      video: {
        width: { ideal: 400 },
        height: { ideal: 300 },
        facingMode: facingMode, // 'user' (front) or 'environment' (back)
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRef.current.srcObject = stream;
      setCurrentCameraFacing(facingMode); // Update state to reflect the active camera
      return true;
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(`Could not access ${facingMode} camera. Make sure permissions are granted.`);
      return false;
    }
  };

  const openCamera = async (facingMode = currentCameraFacing) => {
    if (isCameraOpen) {
      // If camera is already open, just switch
      await getCameraStream(facingMode);
    } else {
      // Open modal and start detection loop
      const success = await getCameraStream(facingMode);
      if (success) {
        setIsCameraOpen(true);
        intervalID = setInterval(() => {
          captureFrame();
        }, 1000);
      }
    }
  };
  
  const toggleCameraFacing = () => {
    const newFacing = currentCameraFacing === "user" ? "environment" : "user";
    openCamera(newFacing);
  };

  const closeCamera = () => {
    clearInterval(intervalID);
    setIsCameraOpen(false);

    // Stop all media tracks to turn off the camera light
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4) return; // Wait until video is ready

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 400; // Use actual dimensions if available
    canvas.height = video.videoHeight || 300;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64Image = canvas.toDataURL("image/jpeg");

    try {
      const res = await fetch("http://127.0.0.1:8000/detect-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image })
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
    const inventoryRef = ref(database, "inventory");

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return alert("No logged-in user! Please log in.");
      const username = currentUser.displayName || currentUser.email || "UnknownUser";

      // Fetch IP in parallel with other operations
      let userIP = "UnknownIP";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        userIP = ipData.ip;
      } catch (e) {
        console.warn("Could not fetch user IP.");
      }

      // Use `push` for Firebase auto-generated key, which is usually better for lists.
      // If you need the key to be based on date/name for sorting, your original approach is fine:
      const newItemRef = ref(database, "inventory/" + Date.now() + "-" + itemName);
      
      await set(newItemRef, {
        name: itemName,
        quantity: parseInt(quantity),
        lastUpdated: Date.now(),
        updatedBy: username,
        updatedIP: userIP
      });

      alert("New inventory record added successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving item!");
    }
  };

  // --- STYLING CONSTANTS ---
  const styles = {
    // Main container for the app/button
    appContainer: {
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: '20px',
        textAlign: 'center',
    },
    // Modal background
    modalOverlay: {
      display: isCameraOpen ? "flex" : "none", // Use flex for centering
      position: "fixed",
      top: 0, 
      left: 0,
      width: "100%", 
      height: "100%",
      background: "rgba(0,0,0,0.8)", // Darker overlay
      justifyContent: 'center', // Center content horizontally
      alignItems: 'center', // Center content vertically
      zIndex: 1000,
    },
    // Modal content box
    modalContent: {
      background: "white",
      padding: "30px",
      width: "90%",
      maxWidth: "450px", // Max width for desktop/tablet
      borderRadius: "12px",
      boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
      textAlign: "center",
      animation: 'fadeIn 0.3s ease-out', // Simple animation (needs keyframes for full effect)
    },
    // Video element styling
    videoStyle: {
        width: "100%",
        height: "auto",
        maxWidth: "400px",
        borderRadius: "8px",
        border: "3px solid #007bff",
        margin: "15px 0",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        backgroundColor: '#eee'
    },
    // Detected item text styling
    detectedText: {
        fontSize: '1.2em',
        fontWeight: 'bold',
        color: detected === "Detecting..." ? '#6c757d' : '#28a745',
        marginBottom: '15px'
    },
    // Input/Label group
    inputGroup: {
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputStyle: {
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ced4da',
        width: '60px',
        textAlign: 'center',
        marginLeft: '10px'
    },
    // Button styling
    buttonBase: {
        padding: '10px 20px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.2s',
        margin: '5px'
    },
    primaryButton: {
        backgroundColor: '#007bff',
        color: 'white',
        ...({ ':hover': { backgroundColor: '#0056b3' } }), // Pseudo-class styles are often handled by CSS modules or styled-components
    },
    secondaryButton: {
        backgroundColor: '#6c757d',
        color: 'white',
        ...({ ':hover': { backgroundColor: '#5a6268' } }),
    },
    switchButton: {
        backgroundColor: '#ffc107',
        color: '#212529',
        ...({ ':hover': { backgroundColor: '#e0a800' } }),
    }
  };

  return (
    <div style={styles.appContainer}>
      <button 
        onClick={() => openCamera("user")} 
        style={{...styles.buttonBase, ...styles.primaryButton}}>
        📸 Open Item Scanner
      </button>

      {/* Modal */}
      <div style={styles.modalOverlay}>
        <div style={styles.modalContent}>
          <h3>✨ Item Recognition Scanner</h3>

          <video
            ref={videoRef}
            style={styles.videoStyle}
            autoPlay
            playsInline // Important for mobile browsers
            muted // Mute is required for autoplay in some browsers
          ></video>
          

          <p style={styles.detectedText}>
            **Detected Item:** {detected}
          </p>

          <div style={styles.inputGroup}>
            <label>Quantity to Add:</label>
            <input
              type="number"
              value={quantity}
              min="1"
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} // Ensure quantity is at least 1
              style={styles.inputStyle}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={addToInventory} 
              style={{...styles.buttonBase, ...styles.primaryButton}}>
              💾 Add to Inventory
            </button>
            <button 
              onClick={toggleCameraFacing} 
              style={{...styles.buttonBase, ...styles.switchButton}}>
              🔄 Switch to {currentCameraFacing === 'user' ? 'Back' : 'Front'} Camera
            </button>
            <button 
              onClick={closeCamera} 
              style={{...styles.buttonBase, ...styles.secondaryButton}}>
              ❌ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}