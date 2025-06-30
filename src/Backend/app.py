import cv2
import face_recognition
import os

# Folder with known faces (jpg/png) – filenames should be the person's name
KNOWN_FACES_DIR = "known_faces"

# Create folder if it doesn't exist
if not os.path.exists(KNOWN_FACES_DIR):
    os.makedirs(KNOWN_FACES_DIR)
    print(f"Created missing folder: {KNOWN_FACES_DIR}. Please add known face images here.")
    # Exit early since no faces yet
    exit()

known_face_encodings = []
known_face_names = []

print("Loading known faces...")

for filename in os.listdir(KNOWN_FACES_DIR):
    if filename.lower().endswith(('.jpg', '.png')):
        image_path = os.path.join(KNOWN_FACES_DIR, filename)
        try:
            image = face_recognition.load_image_file(image_path)
            # Check image type and shape
            if image.dtype != 'uint8' or image.ndim != 3 or image.shape[2] != 3:
                print(f"Skipping unsupported image (not 8bit RGB): {filename}")
                continue

            encodings = face_recognition.face_encodings(image)
            if len(encodings) == 0:
                print(f"No faces found in image: {filename}, skipping.")
                continue

            known_face_encodings.append(encodings[0])
            name = os.path.splitext(filename)[0]
            known_face_names.append(name)
            print(f"Loaded encoding for: {name}")

        except Exception as e:
            print(f"Error processing {filename}: {e}")

if len(known_face_encodings) == 0:
    print("No valid face encodings found! Add clear face images to 'known_faces' folder.")
    exit()

# Start webcam
video_capture = cv2.VideoCapture(0)

print("Starting webcam face recognition. Press ESC to quit.")

while True:
    ret, frame = video_capture.read()
    if not ret:
        print("Failed to grab frame")
        break

    # Resize frame for faster processing
    small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)

    # Convert to RGB
    rgb_small_frame = small_frame[:, :, ::-1]

    # Find all face locations and face encodings
    face_locations = face_recognition.face_locations(rgb_small_frame)
    face_encodings = face_recognition.face_encodings(rgb_small_frame, face_locations)

    for face_encoding, face_location in zip(face_encodings, face_locations):
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
        name = "Unknown"

        face_distances = face_recognition.face_distance(known_face_encodings, face_encoding)
        if len(face_distances) > 0:
            best_match_index = face_distances.argmin()
            if matches[best_match_index]:
                name = known_face_names[best_match_index]

        # Scale face location back to original frame size
        top, right, bottom, left = [v * 4 for v in face_location]

        # Draw rectangle around face
        cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

        # Draw label background and text
        cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 255, 0), cv2.FILLED)
        cv2.putText(frame, name, (left + 6, bottom - 10),
                    cv2.FONT_HERSHEY_DUPLEX, 0.7, (0, 0, 0), 1)

    # Display the resulting frame
    cv2.imshow('Face Recognition', frame)

    # Exit on ESC key
    if cv2.waitKey(1) & 0xFF == 27:
        print("ESC pressed. Exiting...")
        break

video_capture.release()
cv2.destroyAllWindows()
