from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
import psutil
import threading
import time
import datetime
import json

app = Flask(__name__)
socketio = SocketIO(app)

SLEEP_INTERVAL = 1  # seconds
NUM_PROCESSES = 5  # Number of top CPU processes to display

# Data structure to hold process information
process_data = []
killed_processes = set()


@app.route('/')
def index():



    
    return '''
    <h1>CPU Monitor</h1>
    <p>JSON data from socket.io will appear below:</p>
    <pre id="output"></pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.0/socket.io.js"></script>
    <script>
        const socket = io();
        socket.on('cpu_data', function(data) {
            document.getElementById('output').innerText = JSON.stringify(data, null, 2);
        });
    </script>
    '''

def get_current_time():
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def update_process_data():
    global process_data, killed_processes
    
    processes = []
    current_pids = set()

    for proc in psutil.process_iter(['pid', 'name', 'create_time',  'cpu_percent']):
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

    for proc in processes:
        pid = proc['pid']
        # Check if the pid exists. If yes update it else add it to the list.
        existing_proc = next((p for p in process_data if p['pid'] == pid), None)
        if existing_proc:
            existing_proc['cpu_percent'] = proc['cpu_percent']
            existing_proc['kill_time'] = get_current_time()
        else:
            process_data.append({
                'pid': pid,
                'name': proc['name'],
                'create_time': proc['create_time'],
                'cpu_percent': proc['cpu_percent'],
                'kill_time': get_current_time()         # So that the graph gets extended till the current time.
            })

    for proc in process_data:
        if proc['pid'] not in current_pids:
            proc['kill_time'] = get_current_time()
            killed_processes.add(proc['pid'])

    process_data = sorted(process_data, key=lambda x: x['cpu_percent'], reverse=True)[:NUM_PROCESSES]



def monitor_cpu():
    global process_data, killed_processes
    """Continuously monitor and emit top CPU processes."""
    while True:
        update_process_data()
        # Emit data as JSON
        socketio.emit('cpu_data', process_data)
        time.sleep(SLEEP_INTERVAL)
        process_data = [proc for proc in process_data if proc['pid'] not in killed_processes]

        # print(json.dumps(process_data, indent=2))  # Print to stdout
        # time.sleep(1)  # Refresh every second


@socketio.on('connect')
def on_connect():
    print("Client connected.")

@socketio.on('disconnect')
def on_disconnect():
    print("Client disconnected.")

if __name__ == '__main__':
    # Start the CPU monitor in a separate thread
    threading.Thread(target=monitor_cpu, daemon=True).start()
    # Run the Flask-SocketIO app
    socketio.run(app, host='0.0.0.0', port=5000)

