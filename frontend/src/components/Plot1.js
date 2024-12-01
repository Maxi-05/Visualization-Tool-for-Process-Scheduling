import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

function Plot1({ processes }) {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    if (processes && processes.length > 0) {
      const labels = processes.map((process) => process.name);
      const data = processes.map((process) => process.cpu_percent);

      setChartData({
        labels,
        datasets: [
          {
            label: "CPU Usage (%)",
            data,
            backgroundColor: "rgba(136, 132, 216, 0.8)", // Same color as before
            borderColor: "#8884d8",
            borderWidth: 1,
            borderRadius: 5, // Adding rounded corners to bars
          },
        ],
      });
    }
  }, [processes]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `CPU Usage: ${context.raw}%`, // Enhanced tooltip label
        },
      },
      legend: {
        display: true,
        position: "top",
        labels: {
          font: {
            family: "Arial", // Custom font for legend
            size: 14,        // Font size for legend
            weight: "bold",  // Font weight for legend
          },
          color: "#333", // Legend text color
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Processes", // X-axis label
          font: {
            family: "Arial",
            size: 16,
            weight: "bold",
            color: "#00796b", // X-axis title color
          },
        },
        ticks: {
          font: {
            family: "Arial",
            size: 14,
            weight: "normal",
          },
          color: "#555", // X-axis tick color
          padding: 10,
          maxRotation: 10,  // Rotate labels if they are long
          minRotation: 0,  // Adjust rotation of x-axis labels
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "CPU Usage (%)", // Y-axis label
          font: {
            family: "Arial",
            size: 16,
            weight: "bold",
            color: "#00796b", // Y-axis title color
          },
        },
        ticks: {
          font: {
            family: "Arial",
            size: 14,
            weight: "normal",
          },
          color: "#555", // Y-axis tick color
          padding: 10,
          callback: function (value) {
            return value + "%"; // Add percentage symbol to Y-axis ticks
          },
        },
      },
    },
  };

  return (
    <div className="processes" style={{ height: "400px", margin: "0 auto", width: "80%" }}>
      <h1 style={{ textAlign: "center", color: "#00796b" }}>CPU Usage by Process</h1>
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
}

export default Plot1;
