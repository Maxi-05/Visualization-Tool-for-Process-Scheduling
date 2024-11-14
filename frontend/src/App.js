import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';

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
    <header className="header">
      <h1 className="title">Process Scheduling Visualisation Tool</h1>
    </header>
    <div className="content">
      {/* Other content can go here */}
    </div>
  </div>
  );
}

export default App;
