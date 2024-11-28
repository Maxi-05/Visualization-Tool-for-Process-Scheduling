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
      name: `${node.name} (${node.pid})`,
      attributes: {
        vruntime: node.vruntime,
        color: node.color,
      },
      children: [formatTreeData(node.left), formatTreeData(node.right)].filter(
        (child) => child !== null
      ),
    };
  };

  // Render the tree
  return (
    <div style={{ width: "100%", height: "500px" }}>
      {treeData ? (
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="straight"
          nodeSvgShape={{
            shape: "circle",
            shapeProps: {
              r: 10,
              fill: "black",
            },
          }}
          styles={{
            nodes: {
              node: {
                circle: { fill: "black" },
                name: { fill: "white" },
                attributes: { fill: "lightgray" },
              },
              leafNode: {
                circle: { fill: "red" },
                name: { fill: "white" },
                attributes: { fill: "lightgray" },
              },
            },
          }}
        />
      ) : (
        <p>Loading tree data...</p>
      )}
    </div>
  );
};

export default Plot6;