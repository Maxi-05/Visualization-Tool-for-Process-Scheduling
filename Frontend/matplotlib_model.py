from matplotlib import pyplot as plt
from matplotlib import patches as mpatches
import pandas as pd

# Modified process data for 5 processes
processes = [
    {"name": "P3", "arrival_time": 10, "states": [("Ready", 2), ("Running", 5), ("Waiting", 2), ("Running", 1)]},
    {"name": "P1", "arrival_time": 5, "states": [("Running", 4), ("Waiting", 3), ("Running", 2)]},
    {"name": "P5", "arrival_time": 15, "states": [("Ready", 1), ("Running", 4), ("Waiting", 1), ("Running", 2)]},
    {"name": "P4", "arrival_time": 5, "states": [("Ready", 1), ("Running", 3), ("Waiting", 3), ("Running", 2)]},
    {"name": "P2", "arrival_time": 8, "states": [("Ready", 1), ("Running", 3), ("Waiting", 4), ("Running", 2)]}
]

# Colors for each state
state_colors = {
    "Running": "#3a9ecb",   # Blue
    "Waiting": "#d3d3d3",   # Gray
    "Ready": "#90ee90"      # Light Green
}

# Plot parameters
fig, ax = plt.subplots(figsize=(12, 6))
y_ticks = []
y_labels = []
current_y = 0  # Starting Y position for each process
bar_height = 0.4  # Height of each bar

# Draw each process as a series of rectangles based on its states
for process in processes:
    x = process["arrival_time"]  # Start time based on arrival time
    y_ticks.append(current_y + bar_height / 2)
    y_labels.append(process["name"])
    
    # Draw each state with its duration for the process
    for state, duration in process["states"]:
        ax.barh(current_y, duration, left=x, height=bar_height, color=state_colors[state], edgecolor="black")
        ax.text(x + duration / 2, current_y + bar_height / 2, f"{state} ({duration})", ha="center", va="center", color="black", fontsize=8)
        x += duration  # Move x to the right for the next state
    
    current_y += 1  # Move to the next process

# Set labels and ticks
ax.set_yticks(y_ticks)
ax.set_yticklabels(y_labels)
ax.set_xlabel("Time")
ax.set_title("Gantt Chart for Processes")

# Create legend
handles = [mpatches.Patch(color=color, label=state) for state, color in state_colors.items()]
ax.legend(handles=handles, title="State")

# Show the plot
plt.tight_layout()
plt.show()
