import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import "./Plot3.css";

const SOCKET_URL = "http://127.0.0.1:5000";

const Plot3 = () => {
  const [processes, setProcesses] = useState({});
  const [processOrder, setProcessOrder] = useState([]); // Track process addition order
  const [processColors, setProcessColors] = useState({});
  const [animations, setAnimations] = useState({});
  const [staticPositions, setStaticPositions] = useState({});
  const [numCore, setNumCore] = useState(0);

  // Assign a unique color to each process based on its pid
  const getProcessColor = (pid) => {
    if (!processColors[pid]) {
      const hue = (pid * 137.5) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;
      setProcessColors((prev) => ({ ...prev, [pid]: color }));
    }
    return processColors[pid];
  };

  // Generate or get static position for non-migrating processes
  const getStaticPosition = (pid, radius) => {
    if (!staticPositions[pid]) {
      const containerWidth = 150;
      const containerHeight = 200;
      const top = Math.random() * (containerHeight - radius);
      const left = Math.random() * (containerWidth - radius);
      setStaticPositions((prev) => ({
        ...prev,
        [pid]: { top, left },
      }));
      return { top, left };
    }
    return staticPositions[pid];
  };

  // Prune old processes when exceeding limit
  const pruneOldProcesses = (updatedProcesses) => {
    const processKeys = Object.keys(updatedProcesses);

    if (processKeys.length > 20) {
      const excessCount = processKeys.length - 20;

      setProcessOrder((prevOrder) => {
        const toRemove = prevOrder.slice(0, excessCount);
        const newOrder = prevOrder.slice(excessCount);

        // Remove old processes from `processes`
        toRemove.forEach((pid) => {
          delete updatedProcesses[pid];
        });

        return newOrder;
      });
    }
  };

  // Socket connection to get the process data
  useEffect(() => {
    const socket = socketIOClient(SOCKET_URL);

    socket.on("cpu_migrations", (data) => {
      setProcesses((prev) => {
        const updatedProcesses = { ...prev };

        data.forEach((process) => {
          const { pid, to_core, cpu_percent, name, num_cores } = process;
          setNumCore(num_cores);
          const prevProcess = updatedProcesses[pid];

          if (prevProcess && prevProcess.core !== to_core) {
            setAnimations((prevAnimations) => ({
              ...prevAnimations,
              [pid]: {
                fromCore: prevProcess.core,
                toCore: to_core,
              },
            }));

            // Delay updating the core until after the animation
            setTimeout(() => {
              setProcesses((finalProcesses) => ({
                ...finalProcesses,
                [pid]: {
                  ...finalProcesses[pid],
                  core: to_core,
                },
              }));
              setAnimations((prev) => {
                const updated = { ...prev };
                delete updated[pid];
                return updated;
              });
            }, 800); // Match animation duration
          } else {
            updatedProcesses[pid] = {
              ...prevProcess,
              pid,
              core: to_core,
              cpu_percent,
              name,
            };

            // Update process order
            setProcessOrder((prevOrder) => {
              if (!prevOrder.includes(pid)) {
                return [...prevOrder, pid];
              }
              return prevOrder;
            });
          }
        });

        pruneOldProcesses(updatedProcesses);
        return updatedProcesses;
      });
    });

    return () => socket.disconnect();
  }, []);
  console.log(numCore);
  return (
    <div className="plot3-container">
      <h1>Process Migration Model</h1>
      <div className="containers">
        
        {Array.from({length: numCore}, (_ , core) => (
          <div key={core} className="core-with-connection">
            <div className="core-label">Core {core}</div>
            <div className="container">
              {[
                // Move-down animations first
                ...Object.values(processes)
                  .filter((process) => animations[process.pid]?.fromCore === core)
                  .map((process) => {
                    const color = getProcessColor(process.pid);
                    const radius = Math.sqrt(process.cpu_percent || 1) * 10;

                    return (
                      <div
                        key={`${process.pid}-down`}
                        className="process-disc move-down"
                        style={{
                          backgroundColor: color,
                          width: `${radius}px`,
                          height: `${radius}px`,
                          color: "white",
                          fontSize: `${radius / 6}px`,
                        }}
                      >
                        {radius > 20 ? process.name : ""}
                      </div>
                    );
                  }),
                // Move-up animations second
                ...Object.values(processes)
                  .filter(
                    (process) =>
                      (process.core === core ||
                        animations[process.pid]?.toCore === core) &&
                      !animations[process.pid] // Exclude animated processes
                  )
                  .map((process) => {
                    const color = getProcessColor(process.pid);
                    const radius = Math.sqrt(process.cpu_percent || 1) * 10;

                    const staticPosition = getStaticPosition(process.pid, radius);

                    return (
                      <div
                        key={process.pid}
                        className="process-disc"
                        style={{
                          backgroundColor: color,
                          width: `${radius}px`,
                          height: `${radius}px`,
                          top: `${staticPosition.top}px`,
                          left: `${staticPosition.left}px`,
                          color: "white",
                          fontSize: `${radius / 6}px`,
                        }}
                      >
                        {radius > 20 ? process.name : ""}
                      </div>
                    );
                  }),
                // Ensure only animations to this core are shown
                ...Object.values(processes)
                  .filter((process) => animations[process.pid]?.toCore === core)
                  .map((process) => {
                    const color = getProcessColor(process.pid);
                    const radius = Math.sqrt(process.cpu_percent || 1) * 10;

                    return (
                      <div
                        key={`${process.pid}-up`}
                        className="process-disc move-up"
                        style={{
                          backgroundColor: color,
                          width: `${radius}px`,
                          height: `${radius}px`,
                          color: "white",
                          fontSize: `${radius / 6}px`,
                        }}
                      >
                        {radius > 20 ? process.name : ""}
                      </div>
                    );
                  }),
              ]}
            </div>
            
            <div className="vertical-connection"></div>
          </div>
        ))}
      </div>
      <div className="horizontal-pipe" style={{width:`${numCore*200}px`}}></div>
    </div>
  );
};

export default Plot3;
