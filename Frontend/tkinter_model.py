import tkinter as tk

# Modified process data for 5 processes, ensuring at most 1 is running and 1 is in ready state at any given time.
processes = [
    {"name": "P3", "arrival_time": 10, "states": [("Ready", 2), ("Running", 5), ("Waiting", 2), ("Running", 1)]},
    {"name": "P1", "arrival_time": 5, "states": [("Running", 4), ("Waiting", 3), ("Running", 2)]},
    {"name": "P5", "arrival_time": 15, "states": [("Ready", 1), ("Running", 4), ("Waiting", 1), ("Running", 2)]},
    {"name": "P4", "arrival_time": 5, "states": [("Ready", 1), ("Running", 3), ("Waiting", 3), ("Running", 2)]},
    {"name": "P2", "arrival_time": 8, "states": [("Ready", 1), ("Running", 3), ("Waiting", 4), ("Running", 2)]}
]


# Constants for display
BAR_HEIGHT = 40
BAR_PADDING = 20
SCALE_FACTOR = 20  # Scale factor for the timeline on canvas
canvas_width = 1200
canvas_height = (BAR_HEIGHT + BAR_PADDING) * len(processes) + 50

# Initialize Tkinter window
root = tk.Tk()
root.title("Gantt Chart for Processes")
canvas = tk.Canvas(root, width=canvas_width, height=canvas_height, bg="white")
canvas.pack()

# Colors for each state
state_colors = {
    "Running": "#3a9ecb",   # Blue
    "Waiting": "#d3d3d3",   # Gray
    "Ready": "#90ee90"      # Light Green
}

# Draw each process with the appropriate states
for i, process in enumerate(processes):
    x = process["arrival_time"] * SCALE_FACTOR  # Start time based on arrival time
    process_name = process["name"]
    
    # Draw label for the process name on the left
    canvas.create_text(
        60, i * (BAR_HEIGHT + BAR_PADDING) + BAR_HEIGHT / 2 + BAR_PADDING,
        text=process_name, font=("Arial", 12, "bold")
    )
    
    # Draw each state with duration for the process
    for state, duration in process["states"]:
        duration_scaled = duration * SCALE_FACTOR
        canvas.create_rectangle(
            x, i * (BAR_HEIGHT + BAR_PADDING) + BAR_PADDING,
            x + duration_scaled, i * (BAR_HEIGHT + BAR_PADDING) + BAR_HEIGHT + BAR_PADDING,
            fill=state_colors[state], outline="black"
        )
        # Add label for each segment, center aligned
        canvas.create_text(
            x + duration_scaled / 2, i * (BAR_HEIGHT + BAR_PADDING) + BAR_HEIGHT / 2 + BAR_PADDING
        )
        x += duration_scaled  # Move x to the right for the next state

# Run the Tkinter main loop
root.mainloop()
