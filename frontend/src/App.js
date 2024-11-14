import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000'); // Adjust the port if necessary

function App() {
  const [pids, setPids] = useState([]);

  useEffect(() => {
    // Connect to Socket.IO and listen for 'process_data' events
    socket.on('process_data', (data) => {
      setPids(data.pids);
    });

    // Clean up on component unmount
    return () => {
      socket.off('process_data');
    };
  }, []);

  return (
    <div className="App">
      <h1>Running PIDs on Core 0</h1>
      <ul>
        {pids.map(pid => (
          <li key={pid}>PID: {pid}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
