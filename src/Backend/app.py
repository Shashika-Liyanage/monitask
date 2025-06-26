import cv2

# Open webcam
cam = cv2.VideoCapture(0)

# Define the codec and create VideoWriter object
fourcc = cv2.VideoWriter_fourcc(*'XVID')  # You can also try 'MJPG', 'MP4V', etc.
out = cv2.VideoWriter('output.avi', fourcc, 20.0, (640, 480))

cv2.namedWindow("Python webcam video")

while True:
    ret, frame = cam.read()

    if not ret:
        print("Failed to grab frame")
        break

    # Show frame in window
    cv2.imshow("Monitask", frame)

    # Write frame to video file
    out.write(frame)

    # Exit with ESC key
    k = cv2.waitKey(1)
    if k % 256 == 27:
        print("Escape hit, closing...")
        break

# Release everything
cam.release()
out.release()
cv2.destroyAllWindows()
