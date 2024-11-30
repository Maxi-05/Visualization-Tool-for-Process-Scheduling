import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import io from 'socket.io-client';

const socket = io('http://127.0.0.1:5000'); // Replace with your server address

function Plot5() {
  const [processStates, setProcessStates] = useState({}); // State to store data from the socket

  // Colors for different states
  const stateColors = {
    running: '#4caf50',  // Green
    sleeping: '#FF0000', // Red
    idle: '#FFFF00',     // Yellow
    default: '#8884d8',  // Default color for unknown states
  };

  // Fetch data from the socket
  useEffect(() => {
    socket.on('process_states', (data) => {
      setProcessStates(data); // Update process states when data is received
    });

    return () => {
      socket.off('process_states'); // Cleanup listener when component unmounts
    };
  }, []);

  // Transform processStates into chart data with valid durations
  const transformedData = Object.entries(processStates)
    .map(([pid, process]) => {
      const dataEntry = { name: process.name }; // Initialize with process name
      let validProcess = false;  // Flag to check if the process has valid durations
      
      process.states.forEach((state) => {
        if (state.duration > 0) {
          validProcess = true;
          dataEntry[state.state] = (dataEntry[state.state] || 0) + state.duration;
        }
      });

      // Include only processes with valid durations
      return validProcess ? dataEntry : null;
    })
    .filter(dataEntry => dataEntry !== null);  // Remove entries with no valid data

  return (
    <div className="processes">
      <h2>Process State Visualization</h2>

      {/* Custom Legend */}
      <div className="legend">
        {Object.entries(stateColors).map(([state, color]) => (
          <span key={state} style={{ color, marginRight: '10px' }}>
            ● {state}
          </span>
        ))}
      </div>

      {/* Bar Chart */}
      {transformedData.length > 0 ? (  // Render chart only if there's valid data
        <BarChart
          width={600}
          height={400}
          data={transformedData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 'auto']} />
          <Tooltip />
          {/* <Legend /> */}

          {/* Dynamically generate bars for each state */}
          {Object.keys(stateColors).map((state) => (
            <Bar
              key={state}
              dataKey={state}  // Use state name directly
              stackId="a"    // Ensure all bars stack within the same group
              fill={stateColors[state] || stateColors.default}  // Use color for the state
              barSize={20}
            />
          ))}
        </BarChart>
      ) : (
        <p>No data available to display.</p>  // Display message if no valid data
      )}
    </div>
  );
}

export default Plot5;