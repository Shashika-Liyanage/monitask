import os
import cv2
import mediapipe as mp
import numpy as np
import time
from datetime import datetime 

# Import local attendance functions
from attendance import (
    log_camera_stop_event, # Logs OUT to local file
    increment_attendance, # Logs generic attendance to local file
    get_first_and_last_attendance, # Gets IN/OUT summary
    get_attendance_log # Gets full local log
)

# Import Firebase functions
from firebase_utils import (
    log_session_start_firebase,
    log_session_stop_firebase
)

# --- GLOBAL SESSION SETUP ---
# 1. Logs IN time to local attendance.txt (count #1)
local_log_start_count = increment_attendance() 
# 2. Logs IN time to Firebase
log_session_start_firebase() 
# ----------------------------

print(f"Session started. Local count: {local_log_start_count}. Press 'q' or SPACE to stop.")

# Setup MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1)

# Eye indexes
LEFT_EYE = [33, 133] # Corner landmarks
cap = cv2.VideoCapture(0)

def detect_pupil_center(gray_eye):
    """Detects the pupil's center using adaptive thresholding for stability."""
    
    # Use larger kernel for Gaussian blur to emphasize the dark pupil
    gray_eye = cv2.GaussianBlur(gray_eye, (11, 11), 0) 
    
    # Use Adaptive Thresholding (more robust than fixed threshold)
    thresh = cv2.adaptiveThreshold(
        gray_eye, 
        255, 
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
        cv2.THRESH_BINARY_INV, 
        11, # Block size
        2 # Constant subtracted from mean
    )
    
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if contours:
        # Find the largest contour (assumed to be the pupil)
        largest = max(contours, key=cv2.contourArea)
        (x, y), radius = cv2.minEnclosingCircle(largest)
        return int(x), int(y), int(radius)
    return None, None, None

looking_away = False
away_start_time = 0
last_away_duration = 0
MIN_AWAY_DURATION_TO_LOG = 10 # Log only if look-away lasts > 10 seconds

while True:
    ret, frame = cap.read()
    if not ret:
        break

    ih, iw = frame.shape[:2]
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    message = "Face not detected"

    if result.multi_face_landmarks:
        landmarks = result.multi_face_landmarks[0].landmark
        
        x1_lm = int(landmarks[LEFT_EYE[0]].x * iw)
        y1_lm = int(landmarks[LEFT_EYE[0]].y * ih)
        x2_lm = int(landmarks[LEFT_EYE[1]].x * iw)
        y2_lm = int(landmarks[LEFT_EYE[1]].y * ih)

        # --- IMPROVED ROI CALCULATION ---
        x_min = min(x1_lm, x2_lm)
        x_max = max(x1_lm, x2_lm)
        y_min = min(y1_lm, y2_lm)
        y_max = max(y1_lm, y2_lm)

        eye_margin = 20 # Increased margin for stability
        
        x1 = x_min - eye_margin
        y1 = y_min - eye_margin
        x2 = x_max + eye_margin
        y2 = y_max + eye_margin

        # Ensure coordinates are within bounds
        x1, y1 = max(0, x1), max(0, y1)
        x2, y2 = min(iw, x2), min(ih, y2)
        # --- END IMPROVED ROI CALCULATION ---
        
        eye_roi = frame[y1:y2, x1:x2]
        
        if eye_roi.size == 0 or eye_roi.shape[0] < 5 or eye_roi.shape[1] < 5:
            continue

        gray_eye = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2GRAY)
        
        px, py, pr = detect_pupil_center(gray_eye)

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 1)

        if px is not None:
            cv2.circle(eye_roi, (px, py), pr, (0, 0, 255), 1)

            eye_width = eye_roi.shape[1]
            ratio = px / eye_width

            # --- Gaze Direction Logic (Wider Acceptable Range) ---
            # Using 0.25 to 0.75 range for looking forward (more robust)
            if ratio < 0.25 or ratio > 0.75:
                message = "⚠️ Looking Away"

                if not looking_away:
                    away_start_time = time.time()
                    looking_away = True
            else:
                message = "Looking Forward"

                if looking_away:
                    last_away_duration = time.time() - away_start_time
                    looking_away = False

                    if last_away_duration > MIN_AWAY_DURATION_TO_LOG:
                        # Log attendance only if the person returns from a long look-away
                        increment_attendance() 
                        
                        mins = int(last_away_duration // 60)
                        secs = int(last_away_duration % 60)
                        duration_str = f"{mins:02}:{secs:02}"
                        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                        with open("look_away_log.txt", "a") as f:
                            f.write(f"Looked away for {duration_str} at {current_time}\n")
        else:
            message = "Pupil not found"

    # --- Timer Display Logic ---
    if looking_away:
        duration = time.time() - away_start_time
    else:
        duration = last_away_duration

    mins = int(duration // 60)
    secs = int(duration % 60)
    timer_text = f"Looked Away: {mins:02}:{secs:02}"

    # Display Message and Timer
    color = (0, 0, 255) if "Away" in message else (0, 255, 0)
    cv2.putText(frame, message, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 2)
    cv2.putText(frame, timer_text, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)

    cv2.imshow("Look Away Timer", frame)

    # --- Key Press Check (Manual OUT Log Trigger) ---
    key = cv2.waitKey(1) & 0xFF
    
    if key == ord('q') or key == ord(' '):
        break 

# --- LOG OUT TIME & CLEANUP ---
# 1. Log OUT time to local attendance file
log_camera_stop_event() 

# 2. Log OUT time to Firebase
log_session_stop_firebase() 

# 3. Cleanup resources
cap.release()
cv2.destroyAllWindows()
print("\nApplication closed. OUT time logged to local file and Firebase.")

# --- Summary Display (Runs after loop exit) ---
print("\n--- Final Session IN/OUT Summary (Local File) ---")
print(get_first_and_last_attendance())

print("\n--- Full Local Log Contents ---")
print(get_attendance_log())