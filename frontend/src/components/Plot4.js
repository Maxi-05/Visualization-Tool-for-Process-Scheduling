import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, Title, Tooltip, LineElement, PointElement, CategoryScale, LinearScale, Filler } from 'chart.js';
import io from 'socket.io-client';

// Register the necessary chart elements
ChartJS.register(Title, Tooltip, LineElement, PointElement, CategoryScale, LinearScale, Filler);

const Plot4 = () => {
  const [cpuData, setCpuData] = useState([]);
  
  useEffect(() => {
    // Establish the socket connection
    const socket = io('http://localhost:5000');  // Adjust URL if necessary

    // Listen for incoming CPU data from the backend
    socket.on('cpu_times', (data) => {
      // Check if data is not empty and structure is correct
      if (Array.isArray(data) && data.length > 0) {
        setCpuData(data);
      }
    });

    // Cleanup when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  const generateChartData = () => {
    if (cpuData.length === 0) {
      return {};  // Return empty if no data
    }

    // Extract labels dynamically (using core names or 'Overall' for aggregation)
    const labels = cpuData.map(item => (item.core === 'all' ? 'Overall' : `Core ${item.core}`));

    // Build the chart data structure
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'User Time',
          data: cpuData.map(item => item.user_time || 0), // Default to 0 if data is missing
          borderColor: 'green',
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          fill: true,
        },
        {
          label: 'System Time',
          data: cpuData.map(item => item.system_time || 0),
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          fill: true,
        },
        {
          label: 'Nice Time',
          data: cpuData.map(item => item.nice_time || 0),
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.2)',
          fill: true,
        },
        {
          label: 'IRQ Time',
          data: cpuData.map(item => item.irq_time || 0),
          borderColor: 'orange',
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          fill: true,
        },
        {
          label: 'Soft IRQ Time',
          data: cpuData.map(item => item.softirq_time || 0),
          borderColor: 'magenta',
          backgroundColor: 'rgba(255, 0, 255, 0.2)',
          fill: true,
        },
        {
          label: 'I/O Wait Time',
          data: cpuData.map(item => item.iowait_time || 0),
          borderColor: 'grey',
          backgroundColor: 'rgba(169, 169, 169, 0.2)',
          fill: true,
        },
      ],
    };

    return chartData;
  };

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'CPU Cores',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Usage (Time in ms)',
        },
        beginAtZero: true, // Ensure the chart starts at 0 on the Y axis
      },
    },
  };

  return (
    <div>
      <h1>CPU Usage Graph</h1>
      {cpuData.length === 0 ? (
        <p>Loading data...</p>
      ) : (
        <Line data={generateChartData()} options={chartOptions} />
      )}
    </div>
  );
};

export default Plot4;
