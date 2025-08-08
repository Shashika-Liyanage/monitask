import os

ATTENDANCE_FILE = "attendance_count.txt"

def initialize_attendance():
    # Check if the file exists, if not create it with 0
    if not os.path.exists(ATTENDANCE_FILE):
        with open(ATTENDANCE_FILE, "w") as file:
            file.write("0")

def increment_attendance():
    initialize_attendance()
    with open(ATTENDANCE_FILE, "r+") as file:
        count = int(file.read())
        count += 1
        file.seek(0)
        file.write(str(count))
        file.truncate()
    return count

def get_attendance():
    initialize_attendance()
    with open(ATTENDANCE_FILE, "r") as file:
        return int(file.read())
