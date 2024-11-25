import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import '../App.css';

function Plot2({ processes }) {
  return (
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
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="cpu_percent" fill="#8884d8" />
        </BarChart>
    </div>
  )
}

export default Plot2