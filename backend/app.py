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

migration_data = []  # Global list to store core migration data
core_affinity_state = {}  # Dictionary to track the previous core affinity of processes

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
@app.route('/task3')
def task3():
    return '''
    <h1>CPU Migrations Tracker</h1>
    <p>CPU migration data will appear below:</p>
    <pre id="output"></pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.0/socket.io.js"></script>
    <script>
        const socket = io();
        socket.on('cpu_migrations', function(data) {
            document.getElementById('output').innerText = JSON.stringify(data, null, 2);
        });
    </script>
    '''
@app.route('/task4')
def task4():
    """
    Debug route to display process state intervals.
    """
    return '''
    <h1>Gantt Chart Data</h1>
    <p>JSON data from socket.io will appear below:</p>
    <pre id="output"></pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.0/socket.io.js"></script>
    <script>
        const socket = io();
        socket.on('process_states', function(data) {
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
    num_cores = psutil.cpu_count(logical=False)
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
                    'user_time': (cpu_time.user - prev_per_core_cpu_times[i].user)*100,
                    'system_time': (cpu_time.system - prev_per_core_cpu_times[i].system)*100,
                    'nice_time': (cpu_time.nice - prev_per_core_cpu_times[i].nice)*100,
                    'irq_time': (cpu_time.irq - prev_per_core_cpu_times[i].irq)*100,
                    'softirq_time': (cpu_time.softirq - prev_per_core_cpu_times[i].softirq)*100,
                    'iowait_time': (cpu_time.iowait - prev_per_core_cpu_times[i].iowait)*100,
                    'steal_time': (cpu_time.steal - prev_per_core_cpu_times[i].steal)*100,
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
                'user_time': (user_all/num_cores),
                'system_time': (system_all/num_cores),
                'nice_time': (nice_all/num_cores),
                'irq_time': (irq_all/num_cores),
                'softirq_time': (softirq_all/num_cores),
                'iowait_time': (iowait_all/num_cores),
                'steal_time': (steal_all/num_cores),
            })
        #Emits the data to the client
        socketio.emit('cpu_times', cpu_times_info)
        time.sleep(SLEEP_INTERVAL)
        cpu_times_info = []


def track_cpu_migrations():
    """
    Continuously monitor processes for CPU core migrations and emit the data.
    """
    global core_affinity_state, migration_data

    while True:
        try:
            for proc in psutil.process_iter(['pid', 'name','cpu_percent']):
                pid = proc.info['pid']
                name = proc.info['name']
                cpu_percent=proc.info['cpu_percent']
                try:
                    # Read the current CPU/core the process is running on
                    with open(f"/proc/{pid}/stat", "r") as stat_file:
                        stat_data = stat_file.read().split()
                        current_cpu = int(stat_data[38])  # 39th value (index 38) is the CPU number
                except (FileNotFoundError, psutil.AccessDenied, IndexError):
                    # Process might have terminated or access denied
                    continue
                except psutil.NoSuchProcess:
                    # Remove process from tracking if it no longer exists
                    if pid in core_affinity_state:
                        del core_affinity_state[pid]
                    continue

                # Check if the process has a previous CPU core recorded
                if pid in core_affinity_state:
                    previous_cpu = core_affinity_state[pid]
                    if previous_cpu != current_cpu:
                        # Log the migration
                        migration_entry = {
                            'pid': pid,
                            'name': name,
                            'cpu_percent': cpu_percent,
                            'from_core': previous_cpu,
                            'to_core': current_cpu,
                        }
                        migration_data.append(migration_entry)

                # Update the tracked core state
                core_affinity_state[pid] = current_cpu

        except Exception as e:
            print(f"Error tracking CPU migrations: {e}")
        socketio.emit('cpu_migrations', migration_data)  # Send to clients
        time.sleep(SLEEP_INTERVAL)  # Avoid high CPU usage
        migration_data=[]

process_states = {}  # Dictionary to store state intervals
TIME_RANGE = 1  # User-defined time range in seconds
SLEEP_INTERVAL1 = 0.1  # Sampling interval

def monitor_process_states():
    """
    Monitor process state transitions and ensure durations match the time range.
    """
    global process_states, TIME_RANGE

    while True:
        current_time = time.time()  # Current timestamp
        start_time = current_time - TIME_RANGE  # Lower bound of time range

        for proc in psutil.process_iter(attrs=['pid', 'name', 'status', 'cpu_percent']):
            try:
                pid = proc.info['pid']
                state = proc.info['status']
                cpu_usage = proc.info['cpu_percent']

                # Initialize process entry if not present
                if pid not in process_states:
                    process_states[pid] = {
                        'name': proc.info['name'],
                        'states': []
                    }

                # Get the last recorded state for the process
                states = process_states[pid]['states']
                if states and states[-1]['state'] == state:
                    # Update the end time of the current state, capped at current_time
                    states[-1]['end_time'] = min(current_time, start_time + TIME_RANGE)
                    states[-1]['duration'] = states[-1]['end_time'] - states[-1]['start_time']
                else:
                    # Add a new state entry
                    states.append({
                        'state': state,
                        'start_time': max(current_time, start_time),  # Ensure start_time is within range
                        'end_time': current_time,
                        'duration': 0  # Initial duration
                    })

                # Filter and truncate states to stay within the time range
                process_states[pid]['states'] = [
                    {
                        **s,
                        'start_time': max(s['start_time'], start_time),  # Adjust start_time if earlier
                        'end_time': min(s['end_time'], start_time + TIME_RANGE),  # Adjust end_time if later
                        'duration': min(s['end_time'], start_time + TIME_RANGE) - max(s['start_time'], start_time)
                    }
                    for s in states if s['end_time'] > start_time
                ]

            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # Remove entries for terminated processes outside the time range
        process_states = {
            pid: data for pid, data in process_states.items()
            if any(s['end_time'] >= start_time for s in data['states'])
        }
        running_processes = {
            pid: data for pid, data in process_states.items()
            if any(s['state'] == psutil.STATUS_RUNNING for s in data['states'])
        }

        # Emit only running processes
        socketio.emit('process_states', running_processes)
        # Emit the state data for Gantt chart
        # socketio.emit('process_states', process_states)

        time.sleep(SLEEP_INTERVAL1)  # Frequent polling


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
    threading.Thread(target=track_cpu_migrations, daemon=True).start()
    threading.Thread(target=monitor_process_states, daemon=True).start()

    # Change port to avoid conflicts and handle exceptions gracefully.
    try:
        socketio.run(app, host='0.0.0.0', port=5000)
    except OSError as e:
        print(f"Error starting server: {e}. Trying a different port...")
        socketio.run(app, host='0.0.0.0', port=5001)  # Try a different port if 5000 is in use.
