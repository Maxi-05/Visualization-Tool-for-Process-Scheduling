import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
import "./Plot3.css";

const SOCKET_URL = "http://127.0.0.1:5000";

const Plot3 = () => {
  const cores = [0, 1, 2, 3, 4, 5];
  const [processes, setProcesses] = useState({});
  const [processOrder, setProcessOrder] = useState([]); // Track process addition order
  const [processColors, setProcessColors] = useState({});
  const [animations, setAnimations] = useState({});
  const [staticPositions, setStaticPositions] = useState({});

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
          const { pid, to_core, cpu_percent } = process;
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

  return (
    <div className="plot3-container">
      <div className="containers">
        {cores.map((core) => (
          <div key={core} className="core-with-connection">
            <div className="vertical-connection"></div>
            <div className="container">
              {Object.values(processes)
                .filter((process) => process.core === core || animations[process.pid]?.fromCore === core)
                .map((process) => {
                  const color = getProcessColor(process.pid);
                  const radius = Math.sqrt(process.cpu_percent || 1) * 10;

                  const staticPosition = getStaticPosition(process.pid, radius);

                  // Determine animation class
                  let animationClass = "";
                  let top = staticPosition.top;
                  let left = staticPosition.left;

                  const animation = animations[process.pid];
                  if (animation) {
                    if (animation.fromCore === core) {
                      animationClass = "move-down";
                      top = undefined; // Let animation control the position
                    } else if (animation.toCore === core) {
                      animationClass = "move-up";
                      top = undefined; // Let animation control the position
                    }
                  }

                  return (
                    <div
                      key={process.pid}
                      className={`process-disc ${animationClass}`}
                      style={{
                        backgroundColor: color,
                        width: `${radius}px`,
                        height: `${radius}px`,
                        top: top !== undefined ? `${top}px` : undefined,
                        left: `${left}px`,
                      }}
                    ></div>
                  );
                })}
            </div>
            <div className="core-label">Core {core}</div>
          </div>
        ))}
      </div>
      <div className="horizontal-pipe"></div>
    </div>
  );
};

export default Plot3;