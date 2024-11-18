import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './App.css';

function App() {
  const [processes, setProcesses] = useState([]);

  useEffect(() => {
    fetch('test_data.json')
      .then(response => response.json())
      .then(data => {
        // setCpuUsage(data.processes.priority);
        setProcesses(data.processes);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  return (
    <div className="App">
      <header>
        <h1>Process Scheduling Visualization Tool</h1>
      </header>
      <main>
        <div className="processes">
          <h2>Processes</h2>
          <BarChart
            width={600}
            height={300}
            data={processes}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            {console.log('Chart data:', processes)}{/* This is just to check the data */}
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="burstTime" fill="#8884d8" />
            <Bar dataKey="arrivalTime" fill="#82ca9d" />
            <Bar dataKey="priority" fill="#ffc658" />
          </BarChart>
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