## Installation of virtual environment
```bash
sudo apt install python3-venv
# Navigate to project directory (backend in this case)
python3 -m venv venv_name # Create  virtual environment
source venv_name/bin/activate # Activate virtual environment
# Install required dependecies and work on project
deactivate # Exit virtual environment
```


## Dependencies Required.
1. `flask`
2. `socketio`
3. `psutil`

```bash
pip install flask
pip install flask-socketio
pip install psutil
```

## Running the Application
```bash
python3 app.py
```

## Viewing the information
In the url navigate to the following url to view respective information
1. `http://127.0.0.1:5000/` - Home page
2. `http://127.0.0.1:5000/task1` - `cpu_data`
3. `http://127.0.0.1:5000/task2` - `cpu_times`
4. `http://127.0.0.1:5000/task3` - `cpu_migrations`
5. `http://127.0.0.1:5000/task4` - `process_states`
6. `http://127.0.0.1:5000/task5` - `red-black_tree_cfs`