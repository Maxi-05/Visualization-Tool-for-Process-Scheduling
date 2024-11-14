from flask import Flask
from flask_socketio import SocketIO
import psutil
import threading
import time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

def fetch_process_data():
    """Fetches PIDs running on Core 0 and emits them to the frontend."""
    while True:
        # Initialize a list to store the PIDs running on Core 0
        pids_on_core_0 = []
        
        # Iterate over all processes to get their core and PID info
        for proc in psutil.process_iter(['pid']):
            try:
                # Check if the process is running on core 0
                if proc.cpu_num() == 0:  # Use proc.cpu_num() directly here
                    pids_on_core_0.append(proc.pid)
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # Emit data to the frontend using Socket.IO
        socketio.emit('process_data', {'pids': pids_on_core_0})
        time.sleep(2)  # Adjust interval as needed

@app.route('/')
def index():
    return "Backend is running!"

# Start the background thread to fetch data and emit to the frontend
threading.Thread(target=fetch_process_data).start()

if __name__ == '__main__':
    socketio.run(app, debug=True)
