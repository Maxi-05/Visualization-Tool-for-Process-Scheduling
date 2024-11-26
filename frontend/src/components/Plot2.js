import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels"; // Import data labels plugin

function Plot2({ processes }) {
  const [queue, setQueue] = useState([]);
  const [colorMap, setColorMap] = useState(new Map());

  // Helper function to generate unique, divergent colors using HSL
  const generateDistinctColor = (pid) => {
    const hash = pid * 2654435761 % 360; // Deterministic hash using Knuth's multiplication
    return `hsl(${hash}, 70%, 50%)`;
  };

  useEffect(() => {
    if (processes.length > 0) {
      setQueue((prevQueue) => {
        const newQueue = [...prevQueue, processes];
        if (newQueue.length > 6) newQueue.shift();
        return newQueue;
      });

      setColorMap((prevColorMap) => {
        const updatedMap = new Map(prevColorMap);
        processes.forEach((process) => {
          if (!updatedMap.has(process.pid)) {
            updatedMap.set(process.pid, generateDistinctColor(process.pid));
          }
        });
        return updatedMap;
      });
    }
  }, [processes]);

  // Prepare data for Chart.js
  const chartData = {
    labels: queue.map((_, index) => `Snapshot ${index}`),
    datasets: Array.from(colorMap.keys()).map((pid) => ({
      label: `PID: ${pid}`,
      data: queue.map((snapshot) =>
        snapshot.find((p) => p.pid === pid) ? 1 : 0
      ),
      backgroundColor: colorMap.get(pid),
      borderWidth: 1,
      datalabels: {
        display: true,
        color: "white", // PID label color
        align: "center",
        formatter: () => `PID: ${pid}`,
      },
    })),
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: "#fff",
        formatter: (value, context) => {
          // Show PID if the bar is active
          const datasetIndex = context.datasetIndex;
          const pid = chartData.datasets[datasetIndex].label.split(": ")[1];
          return value > 0 ? `PID: ${pid}` : "";
        },
        anchor: "center",
        align: "center",
        clip: true,
      },
      legend: {
        display: false, // Disable the legend completely
      },
    },
    scales: {
      x: {
        stacked: true,
        categoryPercentage: 0.01, // Reduce spacing between categories
      },
      y: {
        beginAtZero: true,
        stacked: true,
        title: {
          display: true,
          text: "Processes",
        },
      },
    },
  };

  return (
    <div className="processes" style={{ height: "400px" }}>
      <Bar data={chartData} options={chartOptions} plugins={[ChartDataLabels]} />
    </div>
  );
}

export default Plot2;
