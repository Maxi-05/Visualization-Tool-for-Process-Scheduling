import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Tree from "react-d3-tree";

const Plot6 = () => {
  const [treeData, setTreeData] = useState(null);

  // Socket.IO client connection
  useEffect(() => {
    const socket = io("http://localhost:5000"); // Replace with your backend's URL

    socket.on("tree_data", (data) => {
      if (data && data.root) {
        setTreeData(formatTreeData(data.root));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Convert the backend tree structure to a format suitable for react-d3-tree
  const formatTreeData = (node) => {
    if (!node) return null;
    return {
      name: `${node.pid}`, // Display only PID in the circle
      attributes: {},
      children: [formatTreeData(node.left), formatTreeData(node.right)].filter(
        (child) => child !== null
      ),
      nodeColor: node.color === "black" ? "green" : node.color,
      nodeRadius: Math.max(10, String(node.pid).length * 10),
    };
  };

  return (
    <div className="processes" style={{ width: "100%", height: "500px", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <h1 style={{ marginBottom: "20px" }}>CFS - Process Scheduling Tree</h1> {/* Added margin to move the tree down slightly */}
      
      {treeData ? (
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="straight"
          translate={{ x: 920, y: 30 }} // Adjust to center the tree horizontally and move it slightly down
          nodeSize={{ x: 200, y: 100 }} // Adjust the node spacing
          renderCustomNodeElement={({ nodeDatum }) => (
            <g style={{ color: "white" }}>
              <circle
                r={nodeDatum.nodeRadius || 10}
                fill={nodeDatum.nodeColor}
              />
              <text className="node-text">{nodeDatum.name}</text>
            </g>
          )}
        />
      ) : (
        <p>Loading tree data...</p>
      )}
    </div>
  );
};

export default Plot6;
