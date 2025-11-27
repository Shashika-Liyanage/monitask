import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime
import os

# --- CONFIGURATION (UPDATE THESE VALUES) ---
# Use the exact filename: e.g., 'monitask-27c8f-firebase-adminsdk-xxxxx-0123456789.json'
SERVICE_ACCOUNT_KEY_PATH = 'monitask-27c8f-firebase-adminsdk-fbsvc-5837d80de0.json'
# Your Firebase Realtime Database URL: e.g., 'https://monitask-27c8f-default-rtdb.firebaseio.com'
DATABASE_URL = 'https://monitask-27c8f-default-rtdb.firebaseio.com/' 
# --- END CONFIGURATION ---

# Global variable to store the unique key for the current session
CURRENT_SESSION_ID = None

def initialize_firebase():
    """Initializes the Firebase Admin SDK."""
    try:
        if not firebase_admin._apps: 
            # Check if the key file exists
            if not os.path.exists(SERVICE_ACCOUNT_KEY_PATH):
                print(f"[Firebase ERROR] Service Account Key NOT FOUND at: {SERVICE_ACCOUNT_KEY_PATH}")
                return False
                
            cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
            firebase_admin.initialize_app(cred, {
                'databaseURL': DATABASE_URL
            })
            print("[Firebase] SDK initialized successfully.")
            return True
        return True
    except Exception as e:
        print(f"[Firebase ERROR] Initialization failed: {e}")
        return False

def log_session_start_firebase():
    """Logs the start time (IN) to Firebase and generates a unique session ID."""
    global CURRENT_SESSION_ID
    if not initialize_firebase():
        return None
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        sessions_ref = db.reference('Attendance') 
        new_session_ref = sessions_ref.push({
            'start_time': current_time,
            'end_time': None, 
            'status': 'IN_PROGRESS',
            'log_timestamp': datetime.now().timestamp()
        })
        
        CURRENT_SESSION_ID = new_session_ref.key
        print(f"[Firebase] Logged IN time. Session ID: {CURRENT_SESSION_ID}")
        return CURRENT_SESSION_ID
        
    except Exception as e:
        print(f"[Firebase ERROR] Failed to log start time: {e}")
        return None

def log_session_stop_firebase():
    """Logs the stop time (OUT) to the existing session entry in Firebase."""
    global CURRENT_SESSION_ID
    if not initialize_firebase():
        return
    
    if not CURRENT_SESSION_ID:
        print("[Firebase ERROR] Cannot log OUT time: Session ID is missing.")
        return

    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        session_ref = db.reference(f'Attendance/{CURRENT_SESSION_ID}')
        
        session_ref.update({
            'end_time': current_time,
            'status': 'COMPLETED'
        })
        
        print(f"[Firebase] Logged OUT time for Session ID: {CURRENT_SESSION_ID}")
        
    except Exception as e:
        print(f"[Firebase ERROR] Failed to log stop time: {e}")