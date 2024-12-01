import React, { useEffect, useState } from 'react';
import './App.css';
import { io } from "socket.io-client";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Plot1 from './components/Plot1';
import Plot2 from './components/Plot2';
import Plot3 from './components/Plot3';
import Plot6 from './components/Plot6';
import Plot4 from './components/Plot4';
import Plot5 from './components/Plot5';

function App() {
  const [processes, setProcesses] = useState([]);
  const [processStates, setProcessStates] = useState({});

  useEffect(() => {
    // Connect to the Flask Socket.IO server
    const socket = io('http://localhost:5000');

    // Listen for real-time data from the server
    socket.on('cpu_data', (data) => {
      console.log('Received CPU data:', data);
      setProcesses(data);
    });

    socket.on('process_states', (data) => {
      console.log('Received process states:', data);
      setProcessStates(data);
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <header>
          <h1 style={{ fontSize: '40px', color: '#00796b' }}>Process Scheduling Visualization Tool</h1>
          <nav className="nav">
            <Link to="/">Home</Link>|
            <Link to="/tree">View Full Tree</Link>
          </nav>
        </header>
        <main>
          <Routes>
            {/* Default Layout */}
            <Route
              path="/"
              element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: "100%" }}>
                  <div style={{ display: 'flex', width: '100%', gap: '20px' }}>
                    <div style={{ flex: 1, maxWidth: '100%' }}>
                      <Plot1 processes={processes} />
                    </div>
                    <div style={{ flex: 1, maxWidth: '100%' }}>
                      <Plot4 />
                    </div>
                  </div>
                  <div style={{ width: '100%', overflow: 'auto' }}>
                    <Plot3 />
                  </div>
                  <div style={{ display: 'flex', width: '100%', gap: '20px' }}>
                    <div style={{ width: '100%', overflow: 'auto' }}>
                      <Plot5 processStates={processStates} />
                    </div>
                    <div style={{ width: '100%', overflow: 'auto' }}>
                      <Plot2 processes={processes} />
                    </div>
                  </div>
                </div>
              }
            />

            {/* Separate Page for Full Tree */}
            <Route path="/tree" element={<Plot6 />} />
          </Routes>
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
    </Router>
  );
}

export default App;