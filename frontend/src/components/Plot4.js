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

  const aggregateOverallData = (data) => {
    const aggregatedData = {
      user_time: 0,
      system_time: 0,
      nice_time: 0,
      irq_time: 0,
      softirq_time: 0,
      iowait_time: 0,
    };

    // Aggregate data for 'Overall' core by summing up all individual core data
    data.forEach(item => {
      if (item.core !== 'all') {
        aggregatedData.user_time += item.user_time || 0;
        aggregatedData.system_time += item.system_time || 0;
        aggregatedData.nice_time += item.nice_time || 0;
        aggregatedData.irq_time += item.irq_time || 0;
        aggregatedData.softirq_time += item.softirq_time || 0;
        aggregatedData.iowait_time += item.iowait_time || 0;
      }
    });

    return aggregatedData;
  };

  const generateChartData = () => {
    if (cpuData.length === 0) {
      return {};  // Return empty if no data
    }

    // Aggregate the data for the "Overall" core
    const overallData = aggregateOverallData(cpuData);

    // Extract labels dynamically (using core names or 'Overall' for aggregation)
    const labels = cpuData.map(item => (item.core === 'all' ? 'Overall' : `Core ${item.core}`));

    // Build the chart data structure
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'User Time',
          data: [
            ...cpuData.map(item => item.user_time || 0),
            overallData.user_time, // Add "Overall" data
          ],
          borderColor: 'green',
          backgroundColor: 'rgba(0, 255, 0, 0.2)',
          fill: true,
        },
        {
          label: 'System Time',
          data: [
            ...cpuData.map(item => item.system_time || 0),
            overallData.system_time, // Add "Overall" data
          ],
          borderColor: 'red',
          backgroundColor: 'rgba(255, 0, 0, 0.2)',
          fill: true,
        },
        {
          label: 'Nice Time',
          data: [
            ...cpuData.map(item => item.nice_time || 0),
            overallData.nice_time, // Add "Overall" data
          ],
          borderColor: 'blue',
          backgroundColor: 'rgba(0, 0, 255, 0.2)',
          fill: true,
        },
        {
          label: 'IRQ Time',
          data: [
            ...cpuData.map(item => item.irq_time || 0),
            overallData.irq_time, // Add "Overall" data
          ],
          borderColor: 'orange',
          backgroundColor: 'rgba(255, 165, 0, 0.2)',
          fill: true,
        },
        {
          label: 'Soft IRQ Time',
          data: [
            ...cpuData.map(item => item.softirq_time || 0),
            overallData.softirq_time, // Add "Overall" data
          ],
          borderColor: 'magenta',
          backgroundColor: 'rgba(255, 0, 255, 0.2)',
          fill: true,
        },
        {
          label: 'I/O Wait Time',
          data: [
            ...cpuData.map(item => item.iowait_time || 0),
            overallData.iowait_time, // Add "Overall" data
          ],
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
          text: 'Percentage Used',
        },
        beginAtZero: true, // Ensure the chart starts at 0 on the Y axis
        max: 100, // Fix the maximum value of the y-axis to 100 (representing percentage)
      },
    },
  };

  return (
    <div>
      <h1>Per CORE Usage</h1>
      {cpuData.length === 0 ? (
        <p>Loading data...</p>
      ) : (
        <Line data={generateChartData()} options={chartOptions} />
      )}
    </div>
  );
};

export default Plot4;
