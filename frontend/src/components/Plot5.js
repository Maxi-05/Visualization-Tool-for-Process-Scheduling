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

  // Transform processStates into chart data with proper time stacking
  const transformedData = Object.entries(processStates).map(([pid, process]) => {
    const dataEntry = { name: process.name }; // Initialize with process name
    const totalDuration = process.states.reduce((sum, state) => sum + state.duration, 0);
  
    // Add each state's normalized duration to the data entry
    process.states.forEach((state, index) => {
      const stateKey = `${state.state}-${index}`;
      dataEntry[stateKey] = totalDuration > 0 ? state.duration / totalDuration : 0;
    });
  
    return dataEntry;
  });
  

  return (
    <div className="process-states">
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

        {/* Dynamically generate bars for each state-index */}
        {transformedData.length > 0 &&
          Object.keys(transformedData[0])
            .filter(key => key !== 'name') // Exclude the name field
            .map((key) => {
              // Extract the state from the key (e.g., running-0 or sleeping-1)
              const [state, index] = key.split('-');
              return (
                <Bar
                  key={key}
                  dataKey={key}  // Use unique key based on state-index
                  stackId="a"    // Stack bars
                  fill={stateColors[state] || stateColors.default}  // Use color for the state
                  barSize={20}
                />
              );
            })}
      </BarChart>
    </div>
  );
}

export default Plot5;
