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

```bash
pip install flask
pip install flask-socketio
```