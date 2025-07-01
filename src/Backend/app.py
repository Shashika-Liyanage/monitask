import cv2
import mediapipe as mp
import numpy as np
import time

# Setup MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1)

# Eye indexes from MediaPipe
LEFT_EYE = [33, 133]

# Webcam
cap = cv2.VideoCapture(0)

def detect_pupil_center(gray_eye):
    _, thresh = cv2.threshold(gray_eye, 30, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        (x, y), radius = cv2.minEnclosingCircle(largest)
        return int(x), int(y), int(radius)
    return None, None, None

looking_away = False
away_start_time = 0
last_away_duration = 0

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
        x1 = int(landmarks[LEFT_EYE[0]].x * iw)
        y1 = int(landmarks[LEFT_EYE[0]].y * ih)
        x2 = int(landmarks[LEFT_EYE[1]].x * iw)
        y2 = int(landmarks[LEFT_EYE[1]].y * ih)

        eye_margin = 5
        x1, y1 = min(x1, x2) - eye_margin, min(y1, y2) - eye_margin
        x2, y2 = max(x1, x2) + 2 * eye_margin, max(y1, y2) + 2 * eye_margin

        eye_roi = frame[y1:y2, x1:x2]
        if eye_roi.size == 0:
            continue

        gray_eye = cv2.cvtColor(eye_roi, cv2.COLOR_BGR2GRAY)
        px, py, pr = detect_pupil_center(gray_eye)

        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 1)

        if px is not None:
            cv2.circle(eye_roi, (px, py), pr, (0, 0, 255), 1)

            eye_width = x2 - x1
            ratio = px / eye_width

            if ratio < 0.3 or ratio > 0.7:
                message = "⚠️ Looking Away"

                if not looking_away:
                    away_start_time = time.time()
                    looking_away = True
            else:
                message = "✅ Looking Forward"

                if looking_away:
                    last_away_duration = time.time() - away_start_time
                    looking_away = False

                    # Log only if away duration > 1 second
                    if last_away_duration > 1:
                        mins = int(last_away_duration // 60)
                        secs = int(last_away_duration % 60)
                        duration_str = f"{mins:02}:{secs:02}"

                        with open("look_away_log.txt", "a") as f:
                            f.write(f"Looked away for {duration_str}\n")
        else:
            message = "Pupil not found"

    if looking_away:
        duration = time.time() - away_start_time
    else:
        duration = last_away_duration

    mins = int(duration // 60)
    secs = int(duration % 60)
    timer_text = f"⏱ Looked Away: {mins:02}:{secs:02}"

    cv2.putText(frame, message, (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 1.0,
                (0, 0, 255) if "⚠️" in message else (0, 255, 0), 2)

    cv2.putText(frame, timer_text, (10, 70),
                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 0), 2)

    cv2.imshow("Look Away Timer", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
