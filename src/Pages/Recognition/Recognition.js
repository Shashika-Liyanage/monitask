import React, { useRef, useState } from "react";
import { ref, set, get, update, runTransaction } from "firebase/database";
import { database } from "../../Service/FirebaseConfig";
import { getAuth } from "firebase/auth";

export default function Recognition() {
  const videoRef = useRef(null);
  const [detected, setDetected] = useState("Detecting...");
  const [quantity, setQuantity] = useState(1);
  let intervalID = null;

  const openCamera = async () => {
    document.getElementById("modal").style.display = "block";

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;

    intervalID = setInterval(() => {
      captureFrame();
    }, 1000);
  };

  const closeCamera = () => {
    clearInterval(intervalID);
    document.getElementById("modal").style.display = "none";
  };

  const captureFrame = async () => {
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const base64Image = canvas.toDataURL("image/jpeg");

    const res = await fetch("http://127.0.0.1:8000/detect-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image })
    });

    const data = await res.json();
    setDetected(data.item);
  };

  // 🔥 SAVE BUTTON FUNCTION
//   const addToInventory = async () => {
//     if (!detected || detected === "Detecting...") {
//       alert("No item detected!");
//       return;
//     }

//     const itemName = detected.toLowerCase().trim(); // Firebase-safe
//     const itemRef = ref(database, "inventory/" + itemName);

//     try {
//       const snapshot = await get(itemRef);

//       if (snapshot.exists()) {
//         // Item already exists → UPDATE quantity
//         const oldQty = snapshot.val().quantity || 0;
//         const newQty = oldQty + parseInt(quantity);

//         await update(itemRef, {
//           quantity: newQty,
//           lastUpdated: Date.now()
//         });

//         alert(`Updated quantity: ${newQty}`);

//       } else {
//         // New item → CREATE
//         await set(itemRef, {
//           name: itemName,
//           quantity: parseInt(quantity),
//           lastUpdated: Date.now()
//         });

//         alert("Item added!");
//       }
//     } catch (error) {
//       console.error(error);
//       alert("Error saving item!");
//     }
//   };
const addToInventory = async () => {
  if (!detected || detected === "Detecting...") {
    alert("No item detected!");
    return;
  }

  const itemName = detected.toLowerCase().trim(); // Firebase-safe
  const inventoryRef = ref(database, "inventory"); // parent ref, not per item

  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("No logged-in user!");
    const username = currentUser.displayName || currentUser.email || "UnknownUser";

    const ipRes = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipRes.json();
    const userIP = ipData.ip;

    // Push a new record
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


  return (
    <>
      <button onClick={openCamera}>Open Camera</button>

      <div id="modal" style={{
        display: "none",
        position: "fixed",
        top: 0, left: 0,
        width: "100%", height: "100%",
        background: "rgba(0,0,0,0.5)",
        padding: "40px"
      }}>
        <div style={{
          background: "white",
          padding: "20px",
          width: "420px",
          margin: "auto",
          borderRadius: "10px"
        }}>
          <h3>Item Recognition</h3>

          <video
            ref={videoRef}
            width="400"
            height="300"
            autoPlay
          ></video>

          <p><b>Detected Item:</b> {detected}</p>

          <label>Quantity:</label>
          <input
            type="number"
            value={quantity}
            min="1"
            onChange={(e) => setQuantity(e.target.value)}
          />

          <br /><br />

          <button onClick={addToInventory}>Add to Inventory</button>
          <button onClick={closeCamera} style={{ marginLeft: "10px" }}>Close</button>
        </div>
      </div>
    </>
  );
}

