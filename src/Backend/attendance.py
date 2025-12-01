import os
from datetime import datetime

# --- Configuration ---
ATTENDANCE_COUNT_FILE = "attendance_count.txt"
ATTENDANCE_LOG_FILE = "attendance_log.txt"

# --- Utility Functions ---

def initialize_attendance():
    """Initializes the attendance count and log files if they don't exist."""
    if not os.path.exists(ATTENDANCE_COUNT_FILE):
        with open(ATTENDANCE_COUNT_FILE, "w") as file:
            file.write("0")
            
    if not os.path.exists(ATTENDANCE_LOG_FILE):
        open(ATTENDANCE_LOG_FILE, "a").close()

def get_attendance_count():
    """Reads and returns the total attendance count."""
    initialize_attendance()
    try:
        with open(ATTENDANCE_COUNT_FILE, "r") as file:
            return int(file.read().strip())
    except (FileNotFoundError, ValueError):
        return 0

def increment_attendance():
    """Increments the count and logs the attendance event with a timestamp. 
       Marks the first entry as 'IN'."""
    initialize_attendance()

    # 1. Read and update count
    with open(ATTENDANCE_COUNT_FILE, "r+") as file:
        try:
            count_str = file.read().strip()
            count = int(count_str) if count_str else 0
        except ValueError:
            count = 0 
            
        count += 1
        
        file.seek(0)
        file.write(str(count))
        file.truncate() 

    # 2. Write log with timestamp
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    log_type = "IN" if count == 1 else "Log In " # Mark the very first entry as IN
    
    with open(ATTENDANCE_LOG_FILE, "a") as log_file:
        # Format: Type #Count at Timestamp
        log_file.write(f"{log_type}  at {current_time}\n")

    return count

def log_camera_stop_event():
    """
    Logs the final event as the OUT time using the final attendance count number.
    This function is called manually upon loop exit.
    """
   #final_count = get_attendance_count() 
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    # Log the final entry using the count and mark it as OUT
    # log_entry = f"Log Out {final_count} at {current_time}\n"
    log_entry = f"Log Out at {current_time}\n"
    if os.path.exists(ATTENDANCE_LOG_FILE):
        with open(ATTENDANCE_LOG_FILE, "a") as log_file:
            log_file.write(log_entry)
        print(f"\n[Local Log] Logged final stop (OUT) event at {current_time}.")
    else:
        print("[Local Log] Could not log final event: Log file not found.")

def get_attendance_log():
    """Gets the entire attendance log content."""
    initialize_attendance()
    try:
        with open(ATTENDANCE_LOG_FILE, "r") as file:
            return file.read()
    except FileNotFoundError:
        return "Attendance log file not found."
    
def get_first_and_last_attendance():
    """
    Reads the attendance log and returns the IN and OUT entries.
    """
    initialize_attendance()
    
    try:
        with open(ATTENDANCE_LOG_FILE, "r") as file:
            logs = file.readlines()
    except:
        return "Attendance log is empty."

    if not logs:
        return "Attendance log is empty."

    first_output = "Attendance #first: Not Found"
    last_output = "Attendance #last: Not Found"

    # Find the 'IN' entry
    for line in logs:
        if line.startswith("IN "):
            timestamp_part_first = " at ".join(line.strip().split(" at ")[1:])
            first_output = f"Log In At {timestamp_part_first}"
            break
            
    # Find the 'OUT' entry (should be the last line if the app closed gracefully)
    for line in reversed(logs):
        if line.startswith(" Log Out"):
            timestamp_part_last = " at ".join(line.strip().split(" at ")[1:])
            last_output = f"Log Out At {timestamp_part_last}"
            break

    return f"{last_output}\n{first_output}"