import os
from datetime import datetime

# File paths
ATTENDANCE_COUNT_FILE = "attendance_count.txt"
ATTENDANCE_LOG_FILE = "attendance_log.txt"

# Initialize attendance files if not exist
def initialize_attendance():
    if not os.path.exists(ATTENDANCE_COUNT_FILE):
        with open(ATTENDANCE_COUNT_FILE, "w") as file:
            file.write("0")
    if not os.path.exists(ATTENDANCE_LOG_FILE):
        open(ATTENDANCE_LOG_FILE, "a").close()

# Increment attendance and log date/time
def increment_attendance():
    initialize_attendance()

    # Read and update count
    with open(ATTENDANCE_COUNT_FILE, "r+") as file:
        count = int(file.read())
        count += 1
        file.seek(0)
        file.write(str(count))
        file.truncate()

    # Write log with timestamp
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(ATTENDANCE_LOG_FILE, "a") as log_file:
        log_file.write(f"Attendance #{count} at {current_time}\n")

    return count

# Get total attendance count
def get_attendance_count():
    initialize_attendance()
    with open(ATTENDANCE_COUNT_FILE, "r") as file:
        return int(file.read())

# Get all attendance logs
def get_attendance_log():
    initialize_attendance()
    with open(ATTENDANCE_LOG_FILE, "r") as file:
        return file.read()
