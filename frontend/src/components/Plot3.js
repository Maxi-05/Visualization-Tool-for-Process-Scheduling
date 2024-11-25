import React, { useState, useEffect } from 'react';
import '../App.css';

const COLORS = ['red', 'blue', 'green', 'orange', 'purple', 'yellow', 'pink', 'brown', 'cyan', 'lime'];

// Function to generate fixed processes with unique colors
const generateProcesses = (numProcesses) => {
  return Array.from({ length: numProcesses }, (_, i) => ({
    id: `process${i + 1}`,
    color: COLORS[i % COLORS.length], // Ensure unique color for each process
    cpuUsage: 0, // Initial CPU usage
    core: Math.floor(Math.random() * 4) + 1, // Randomly assign to a core
  }));
};

// Function to update only CPU usage and core dynamically
const updateProcesses = (processes) => {
  return processes.map((process) => ({
    ...process,
    cpuUsage: Math.floor(Math.random() * 100) + 1, // Random CPU usage
    core: Math.floor(Math.random() * 4) + 1, // Randomly assign to a core
  }));
};

function Plot3() {
  const [processes, setProcesses] = useState(generateProcesses(10)); // Generate 10 processes

  useEffect(() => {
    const interval = setInterval(() => {
      setProcesses((prevProcesses) => updateProcesses(prevProcesses));
    }, 2000); // Update every 2 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h1>Process Migration Visualization</h1>
      <div className="cores-container">
        {[1, 2, 3, 4].map((core) => (
          <div key={core} className="core">
            <h3>Core {core}</h3>
            <div className="processes">
              {processes
                .filter((process) => process.core === core)
                .map((process) => {
                  // Compute size proportional to CPU usage (Area ∝ CPU)
                  const size = Math.sqrt(process.cpuUsage) * 10;
                  return (
                    <div
                      key={process.id}
                      className="process"
                      style={{
                        backgroundColor: process.color,
                        width: `${size}px`,
                        height: `${size}px`,
                      }}
                      title={`ID: ${process.id}, CPU: ${process.cpuUsage}%`}
                    ></div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Plot3;
