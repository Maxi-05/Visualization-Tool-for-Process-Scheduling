import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import io from 'socket.io-client';

const socket = io('http://127.0.0.1:5000'); // Replace with your server address

function Plot5() {
  const [processStates, setProcessStates] = useState({});

  // Colors for different states
  const stateColors = {
    running: '#4caf50',  // Green
    sleeping: '#FF0000', // Red
    idle: '#FFFF00',     // Yellow
    default: '#8884d8',  // Default color for unknown states
  };

  useEffect(() => {
    socket.on('process_states', (data) => {
      setProcessStates(data);
    });

    return () => {
      socket.off('process_states'); // Cleanup listener
    };
  }, []);

  // Transform processStates into chart data
  const transformedData = Object.entries(processStates).map(([pid, process]) => {
    const dataEntry = { name: `${process.name}` }; // Include PID in the name for clarity

    process.states.forEach((state, index) => {
      // Create a unique key using state name, index, and pid
      const key = `${state.state}_${index}_pid${pid}`;
      dataEntry[key] = state.duration;
    });

    return dataEntry;
  });

  // Collect all unique state keys across all processes
  const allStateKeys = Array.from(
    new Set(transformedData.flatMap(data => Object.keys(data).filter(key => key !== 'name')))
  );


  return (
    <div className="processes" style={{ display: 'flex', justifyContent: 'center', height: '100vh' }}>
      <div style={{ textAlign: 'center', width: '80%', maxWidth: '800px' }}>
        <h1>Dynamic 'Process-State' Tracking</h1>

        {/* Custom Legend */}
        <div className="legend" style={{ marginBottom: '20px' }}>
          {Object.entries(stateColors).map(([state, color]) => (
            <span key={state} style={{ marginRight: '10px', display: 'inline-flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '20px',  // Set the width of the rectangle
                  height: '10px', // Set the height of the rectangle
                  backgroundColor: color, // Set the background color to the respective color
                  marginRight: '5px' // Space between the rectangle and the label
                }}
              ></div>
              {state}
            </span>
          ))}
        </div>

        {/* Render chart only if there's valid data */}
        {transformedData.length > 0 ? (
          <BarChart
            width={600}
            height={400}
            data={transformedData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" 
              angle={-45}
              textAnchor='end'
            />
            <YAxis domain={[0, 'auto']} />
            <Tooltip />

            {/* Dynamically generate bars for each unique state */}
            {allStateKeys.map((key) => {
              const stateType = key.split('_')[0]; // Extract state type (e.g., "running", "sleeping")
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={stateColors[stateType] || stateColors.default}
                  barSize={20}
                />
              );
            })}
          </BarChart>
        ) : (
          <p>No data available to display.</p> // Display message if no valid
        )}
      </div>
    </div>
  );
}

export default Plot5;
