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

@app.route('/task5')
def task5():
    return '''
    <h1>Process Virtual Memory Times</h1>
    <p>Virtual memory times data will appear below:</p>
    <pre id="output"></pre>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.5.0/socket.io.js"></script>
    <script>
        const socket = io();
        socket.on('tree_data', function(data) {
            document.getElementById('output').innerText = JSON.stringify(data, null, 2);
        });
    </script>
    '''

### End of debugging

def get_current_time():
    """Returns the current timestamp as a formatted string."""
    return datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def update_process_data():
    global process_data, killed_processes
    
    processes = []
    current_pids = set()

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent',  'create_time']):
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
        else:
            process_data.append({
                'pid': pid,
                'name': proc['name'],
                'cpu_percent': proc['cpu_percent'],
                'create_time': proc['create_time'],
            })

    for proc in process_data:
        if proc['pid'] not in current_pids:
            proc['cpu_percent'] = 0
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
        killed_processes = set()
        # print(json.dumps(process_data, indent=2))  # Print to stdout
        # time.sleep(1)  # Refresh every second


def monitor_cpu():
    """Continuously monitor and emit top CPU processes."""
    global process_data, killed_processes
    while True:
        update_process_data()
        socketio.emit('cpu_data', process_data)  # Emit updated data to all clients
        time.sleep(SLEEP_INTERVAL)
        process_data = [proc for proc in process_data if proc['pid'] not in killed_processes]
        killed_processes.clear()  # Clear the set of killed processes

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

    # Get the number of CPU cores using psutil
    num_cores = psutil.cpu_count()

    while True:
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
                pid = proc.info['pid']
                name = proc.info['name']
                cpu_percent = proc.info['cpu_percent']
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
                            'num_cores': num_cores  # Add number of CPU cores
                        }
                        migration_data.append(migration_entry)

                # Update the tracked core state
                core_affinity_state[pid] = current_cpu

        except Exception as e:
            print(f"Error tracking CPU migrations: {e}")
        socketio.emit('cpu_migrations', migration_data)  # Send to clients
        time.sleep(SLEEP_INTERVAL)  # Avoid high CPU usage
        migration_data = []

process_states = {}  # Dictionary to store state intervals
TIME_RANGE = 1  # User-defined time range in seconds
SLEEP_INTERVAL1 = 0.1  # Sampling interval

def monitor_process_states():
    global process_states, TIME_RANGE
    last_emit_time = time.time()  # Initialize last_emit_time

    while True:
        current_time = time.time()  # Current timestamp
        start_time = current_time - TIME_RANGE  # Lower bound of time range

        # Update process state data
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
                current_time_s = time.time()
                if states :
                 states[-1]['end_time'] = current_time_s
                 states[-1]['duration'] = states[-1]['end_time'] - states[-1]['start_time']
                if states and states[-1]['state'] == state:
                    pass
                else:
                    # Add a new state entry

                    
                    states.append({
                        'state': state,
                        'start_time': current_time_s,
                        'end_time': current_time_s,
                        'duration': 0  # Initial duration
                    })
                    
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        emit_process_states = {}
        if time.time() - last_emit_time >= 1:
            for pid, data in process_states.items():
                total_duration = 0
                adjusted_states = []

                for state in data['states']:
                    duration = min(state['end_time'], start_time + TIME_RANGE) - max(state['start_time'], start_time)

                    if duration > 0:
                        total_duration += duration
                        # Adjust the state in the temporary variable
                        adjusted_states.append({
                            'state': state['state'],
                            'start_time': max(state['start_time'], start_time),
                            'end_time': min(state['end_time'], start_time + TIME_RANGE),
                            'duration': duration
                        })
                # if total_duration > 0 :
                #     scale_factor=TIME_RANGE/total_duration
                #     for adjusted_state in adjusted_states:
                #      adjusted_state['duration'] *= scale_factor
                #      # Adjust end_time based on normalized duration
                #      adjusted_state['end_time'] = adjusted_state['start_time'] + adjusted_state['duration']                  
                emit_process_states[pid] = {
                    'name': data['name'],
                    'states': adjusted_states
                }

            # Emit only running processes
            # running_processes = {
            #     pid: data for pid, data in emit_process_states.items()
            #     if any(s['state'] == psutil.STATUS_RUNNING for s in data['states'])
            # }
            running_processes = {
             pid: data for pid, data in emit_process_states.items()
             if any('running' in state['state'] for state in data['states'])
             }   


            # Emit the state data for Gantt chart
            socketio.emit('process_states', running_processes)  # Emit running processes
            last_emit_time = time.time()  # Update the last emission time

        time.sleep(SLEEP_INTERVAL1)  # Frequent polling


class Node:
    def __init__(self, key, value, name):
        self.key = key
        self.value = value
        self.name = name  # Process name
        self.color = 'red'  # New nodes are always red
        self.left = None
        self.right = None
        self.parent = None

class RedBlackTree:
    def __init__(self):
        self.TNULL = Node(0, 0, "")
        self.TNULL.color = 'black'
        self.root = self.TNULL

    def insert(self, key, value, name):
        node = Node(key, value, name)
        node.parent = None
        node.left = self.TNULL
        node.right = self.TNULL
        node.color = 'red'

        parent = None
        current = self.root

        while current != self.TNULL:
            parent = current
            if node.value < current.value:  # Compare based on value (vtimes)
                current = current.left
            else:
                current = current.right

        node.parent = parent
        if parent is None:
            self.root = node
        elif node.value < parent.value:  # Compare based on value (vtimes)
            parent.left = node
        else:
            parent.right = node

        if node.parent is None:
            node.color = 'black'
            return

        if node.parent.parent is None:
            return

        self.fix_insert(node)

    def fix_insert(self, k):
        while k.parent.color == 'red':
            if k.parent == k.parent.parent.right:
                u = k.parent.parent.left
                if u.color == 'red':
                    u.color = 'black'
                    k.parent.color = 'black'
                    k.parent.parent.color = 'red'
                    k = k.parent.parent
                else:
                    if k == k.parent.left:
                        k = k.parent
                        self.right_rotate(k)
                    k.parent.color = 'black'
                    k.parent.parent.color = 'red'
                    self.left_rotate(k.parent.parent)
            else:
                u = k.parent.parent.right

                if u.color == 'red':
                    u.color = 'black'
                    k.parent.color = 'black'
                    k.parent.parent.color = 'red'
                    k = k.parent.parent
                else:
                    if k == k.parent.right:
                        k = k.parent
                        self.left_rotate(k)
                    k.parent.color = 'black'
                    k.parent.parent.color = 'red'
                    self.right_rotate(k.parent.parent)
            if k == self.root:
                break
        self.root.color = 'black'

    def left_rotate(self, x):
        y = x.right
        x.right = y.left
        if y.left != self.TNULL:
            y.left.parent = x

        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x == x.parent.left:
            x.parent.left = y
        else:
            x.parent.right = y
        y.left = x
        x.parent = y

    def right_rotate(self, x):
        y = x.left
        x.left = y.right
        if y.right != self.TNULL:
            y.right.parent = x

        y.parent = x.parent
        if x.parent is None:
            self.root = y
        elif x == x.parent.right:
            x.parent.right = y
        else:
            x.parent.left = y
        y.right = x
        x.parent = y

    def get_root(self):
        return self.root

    def inorder_helper(self, node):
        if node != self.TNULL:
            self.inorder_helper(node.left)
            print(f"{node.key}: {node.value} ({node.name})")
            self.inorder_helper(node.right)

    def inorder(self):
        self.inorder_helper(self.root)

def serialize_tree(node, TNULL):
    """
    Serializes the Red-Black Tree into a dictionary format.
    """
    if node == TNULL:
        return None

    return {
        'pid': node.key,
        'vruntime': node.value,
        'name': node.name,
        'color': node.color,
        'left': serialize_tree(node.left, TNULL),
        'right': serialize_tree(node.right, TNULL)
    }

def get_process_vtimes():
    """
    Collects the virtual memory times (vtimes) of all processes and inserts them into a Red-Black Tree.
    """
    rbt = RedBlackTree()

    while True:
        for proc in psutil.process_iter(['pid', 'name', 'cpu_times']):
            try:
                vtimes = proc.cpu_times()
                # Insert into Red-Black Tree
                rbt.insert(proc.info['pid'], vtimes.user + vtimes.system, proc.info['name'])
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # Serialize the tree and emit it
        tree_data = serialize_tree(rbt.get_root(), rbt.TNULL)
        socketio.emit('tree_data', {'root': tree_data})  # Emit the tree data to all clients
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
    threading.Thread(target=get_core_times, daemon=True).start()
    threading.Thread(target=track_cpu_migrations, daemon=True).start()
    threading.Thread(target=monitor_process_states, daemon=True).start()
    threading.Thread(target=get_process_vtimes, daemon=True).start()

    # Change port to avoid conflicts and handle exceptions gracefully.
    try:
        socketio.run(app, host='0.0.0.0', port=5000)
    except OSError as e:
        print(f"Error starting server: {e}. Trying a different port...")
        socketio.run(app, host='0.0.0.0', port=5001)  # Try a different port if 5000 is in use.
