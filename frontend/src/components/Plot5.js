import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import '../App.css';

function Plot5({ processStates }) {
  // Define static legend items
  const legendData = [
    { state: 'running', color: '#4caf50' },
    { state: 'sleeping', color: '#cfd8dc' },
    { state: 'idle', color: '#f5f5dc' },
    { state: 'default', color: '#8884d8' }
  ];

  // Transform the processStates data into a format suitable for the chart
  const transformedData = Object.entries(processStates).map(([pid, process]) => {
    const dataEntry = { name: process.name, totalTime: 0 };  // Track total time for each process

    process.states.forEach((state) => {
      const duration = state.end_time - state.start_time;  // Calculate the duration
      // Flatten the state data into a numeric value (duration) for the bar chart
      dataEntry[state.state] = duration;
      dataEntry.totalTime = Math.max(dataEntry.totalTime, state.end_time);  // Update the total time of the process
    });
    return dataEntry;
  });

  return (
    <div className="process-states">
      <h2>Process State Durations</h2>
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
        {/* Manually define the Legend based on the static legendData */}
        <Legend>
          {legendData.map((item) => (
            <span key={item.state} style={{ color: item.color }}>
              {item.state}
            </span>
          ))}
        </Legend>
        {/* Dynamically create bars for each state */}
        {transformedData.length > 0 &&
          Object.keys(transformedData[0])
            .filter((key) => key !== 'name' && key !== 'totalTime')
            .map((state) => (
              <Bar
                key={state}
                dataKey={state}
                fill={
                  state === 'running' ? '#4caf50' :    // Green for running
                  state === 'sleeping' ? '#FF0000' :   // Light gray for sleeping
                  state === 'idle' ? '#FFFF00' :       // Beige for idle
                  '#8884d8'                            // Default color for other states
                }
                barSize={20}
                stackId="a"
              />
            ))}
      </BarChart>
    </div>
  );
}

export default Plot5;