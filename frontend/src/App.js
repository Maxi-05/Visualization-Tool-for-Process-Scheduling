import React, { useEffect, useState } from 'react';
import './App.css';
import { io } from "socket.io-client";
import Plot1 from './components/Plot1';
import Plot2 from './components/Plot2';
import Plot3 from './components/Plot3';
import Plot6 from './components/Plot6';
import Plot4 from './components/Plot4'; // Import Plot4 instead of CPUUsageGraph

function App() {
  const [processes, setProcesses] = useState([]);

  useEffect(() => {
    // Connect to the Flask Socket.IO server
    const socket = io('http://localhost:5000');

    // Listen for real-time data from the server
    socket.on('cpu_data', (data) => {
      console.log('Received CPU data:', data);
      setProcesses(data);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="App">
      <header>
        <h1>Process Scheduling Visualization Tool</h1>
      </header>
      <main style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: "100%" }}>
          <div style={{ display: 'flex', width: '100%', gap: '20px' }}>
            <div style={{ flex: 1, maxWidth: '100%' }}>
              <Plot1 processes={processes} />
            </div>
            <div style={{ flex: 1, maxWidth: '100%' }}>
              <Plot2 processes={processes} />
            </div>
          </div>
          <div style={{ width: '100%', overflow: 'auto' }}>
            <Plot3 />
          </div>
        </div>
        <div style={{ width: '100%', overflow: 'auto' }}>
          <Plot6 />
        </div>
        <div style={{ width: '100%', overflow: 'auto' }}>
          <Plot4 />
        </div>
      </main>
      <footer>
        <hr />
        <h3>Developed By</h3>
        <hr />
        <div className="footer-columns">
          <div className="column" style={{ flex: 3 }}>
            <p>Anjali Samudrala</p>
            <p>Chaitanya Sai Teja G</p>
            <p>Jwala Likitha Reddy M</p>
          </div>
          <div className="column" style={{ flex: 4 }}>
            <p>Karthikeya P</p>
            <p>Naveen Koushik Reddy E</p>
            <p>Navya Sree B</p>
            <p>Rushi Babu G</p>
          </div>
          <div className="column" style={{ flex: 3 }}>
            <p>Sravya Rangu</p>
            <p>Yashwanth Sai P</p>
            <p>Yaswanth Sai V</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
