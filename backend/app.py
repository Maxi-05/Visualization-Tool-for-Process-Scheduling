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

# Global declarations for cpu times
cpu_times_info = []

### Print the data for debugging
@app.route('/task1')
def task1():
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
@app.route('/task2')
def task2():
    return '''
    <h1>CPU Times</h1>
    <p>JSON data from socket.io will appear below:</p>
    <pre id="output"></pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.0/socket.io.js"></script>
    <script>
        const socket = io();
        socket.on('cpu_times', function(data) {
            document.getElementById('output').innerText = JSON.stringify(data, null, 2);
        });
    </script>
    '''
### End of debugging

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
            cpu_percent = proc.info['cpu_percent'] if proc.info['cpu_percent'] is not None else 0.0
            processes.append({
                'pid': proc.info['pid'],
                'name': proc.info['name'],
                'cpu_percent': cpu_percent,
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

def get_core_times():
    global cpu_times_info
    per_core_cpu_times = None
    while True:
        prev_per_core_cpu_times = per_core_cpu_times
        try:
            per_core_cpu_times = psutil.cpu_times(percpu=True)
        except Exception as e:
            print(f"Error getting per-core CPU times: {e}")
            continue
        
        if prev_per_core_cpu_times is not None:
            user_all, system_all, nice_all, irq_all, softirq_all, iowait_all, steal_all = 0, 0, 0, 0, 0, 0, 0 
            for i, cpu_time in enumerate(per_core_cpu_times):
                cpu_times_info.append({
                    'core': i,
                    'user_time': cpu_time.user - prev_per_core_cpu_times[i].user,
                    'system_time': cpu_time.system - prev_per_core_cpu_times[i].system,
                    'nice_time': cpu_time.nice - prev_per_core_cpu_times[i].nice,
                    'irq_time': cpu_time.irq - prev_per_core_cpu_times[i].irq,
                    'softirq_time': cpu_time.softirq - prev_per_core_cpu_times[i].softirq,
                    'iowait_time': cpu_time.iowait - prev_per_core_cpu_times[i].iowait,
                    'steal_time': cpu_time.steal - prev_per_core_cpu_times[i].steal,
                })
                user_all += cpu_times_info[-1]['user_time']
                system_all += cpu_times_info[-1]['system_time']
                nice_all += cpu_times_info[-1]['nice_time']
                irq_all += cpu_times_info[-1]['irq_time']
                softirq_all += cpu_times_info[-1]['softirq_time']
                iowait_all += cpu_times_info[-1]['iowait_time']
                steal_all += cpu_times_info[-1]['steal_time']
            cpu_times_info.append({
                'core': 'all',
                'user_time': user_all,
                'system_time': system_all,
                'nice_time': nice_all,
                'irq_time': irq_all,
                'softirq_time': softirq_all,
                'iowait_time': iowait_all,
                'steal_time': steal_all,
            })
        #Emits the data to the client
        socketio.emit('cpu_times', cpu_times_info)
        time.sleep(SLEEP_INTERVAL)
        cpu_times_info = []




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
    threading.Thread(target=get_core_times, daemon=True).start()
    
    # Change port to avoid conflicts and handle exceptions gracefully.
    try:
        socketio.run(app, host='0.0.0.0', port=5000)
    except OSError as e:
        print(f"Error starting server: {e}. Trying a different port...")
        socketio.run(app, host='0.0.0.0', port=5001)  # Try a different port if 5000 is in use.
