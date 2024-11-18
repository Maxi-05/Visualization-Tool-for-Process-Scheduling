from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import psutil
import threading
import datetime
import time

app = Flask(__name__)
CORS(app)  # Enable CORS
socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins

SLEEP_INTERVAL = 1  # seconds
NUM_PROCESSES = 5  # Number of top CPU processes to display

process_data = []  # Store current process data
killed_processes = set()  # Track processes that have been terminated


def get_current_time():
    """Returns the current timestamp as a formatted string."""
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def update_process_data():
    """Update the list of processes and their CPU usage."""
    global process_data, killed_processes

    processes = []
    current_pids = set()

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'create_time']):
        try:
            current_pids.add(proc.info['pid'])
            processes.append({
                'pid': proc.info['pid'],
                'name': proc.info['name'],
                'cpu_percent': proc.info['cpu_percent'],
                'create_time': datetime.datetime.fromtimestamp(proc.info['create_time']).strftime('%Y-%m-%d %H:%M:%S'),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    # Update or add processes to `process_data`
    for proc in processes:
        pid = proc['pid']
        existing_proc = next((p for p in process_data if p['pid'] == pid), None)
        if existing_proc:
            existing_proc['cpu_percent'] = proc['cpu_percent']
        else:
            process_data.append(proc)

    # Mark terminated processes
    for proc in process_data:
        if proc['pid'] not in current_pids:
            proc['cpu_percent'] = 0  # Mark as inactive
            killed_processes.add(proc['pid'])

    # Keep only top `NUM_PROCESSES` by CPU usage
    process_data = sorted(process_data, key=lambda x: x['cpu_percent'], reverse=True)[:NUM_PROCESSES]


def monitor_cpu():
    """Continuously monitor and emit top CPU processes."""
    while True:
        update_process_data()
        socketio.emit('cpu_data', process_data)  # Emit updated data to all clients
        time.sleep(SLEEP_INTERVAL)


@app.route('/')
def index():
    return "Flask-SocketIO server is running!"


@socketio.on('connect')
def on_connect():
    print("Client connected.")


@socketio.on('disconnect')
def on_disconnect():
    print("Client disconnected.")


if __name__ == '__main__':
    threading.Thread(target=monitor_cpu, daemon=True).start()
    socketio.run(app, host='0.0.0.0', port=5000)
