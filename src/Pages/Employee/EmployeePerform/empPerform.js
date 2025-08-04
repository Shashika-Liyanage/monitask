import React from 'react';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL';
import './empPerform.css';
import { FaStar } from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';


const pieData = [
  { name: 'Complete Tasks', value: 60 },
  { name: 'Uncomplete Tasks', value: 40 },
];

const COLORS = ['#b89d2e', '#bb7c2d'];

const barData = [
  { name: 'Present', count: 22 },
  { name: 'Absent', count: 14 },
  { name: 'Leave', count: 7 },
];
const COLORSBar = ['#C58940', '#ebd174ff', '#B09226']; // Your 3 colors


function EmployeePerformance() {
  return (
    <EmployeeLayout>
      <div className="performance-container">
        <h2>Employee Performance Overview</h2>

        <div className="performance-row">
          {/* Rating Box */}
          <div className="employee-rating-box">
            <div className="rating-header">
              <span>Employee Ratings</span>
              <span className="rating-score">5</span>
            </div>

            <div className="rating-stars">
              <FaStar className="star filled" />
              <FaStar className="star filled" />
              <FaStar className="star filled" />
              <FaStar className="star filled" />
              <FaStar className="star empty" />
            </div>

            <div className="rating-comment-label">Latest HR Comment</div>
            <div className="rating-comment-text">
              Great job on competing the task!
            </div>
          </div>

          {/* Leave and Attendance Stats */}
          <div className="employee-stats-container">
            <div className="stat-boxLeave">
              <div className="stat-labelLeave">Leave Count per Month</div>
              <div className="stat-valueLeave">8</div>
            </div>
            <div className="stat-boxAttendance">
              <div className="stat-labelAttendance">Attendance per Month</div>
              <div className="stat-valueAttendance">25</div>
            </div>
          </div>
        </div>
       <div className="performance-graphs-row">
  {/* Left Box: Pie Chart */}
  <div className="graph-box">
    <h3>Task Completion</h3>
    <PieChart width={250} height={250}>
  <Pie
    data={pieData}
    cx="50%"
    cy="50%"
    innerRadius={50}
    outerRadius={80}
    paddingAngle={5}
    dataKey="value"
  >
    {pieData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORS[index]} />
    ))}
  </Pie>
  <Tooltip /> {/* ← This enables count display on hover */}
  <Legend />
</PieChart>

  </div>

  {/* Right Box: Bar Chart */}
  <div className="graph-box">
    <h3>Attendance Overview</h3>
    <BarChart width={250} height={250} data={barData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Bar dataKey="count">
    {barData.map((entry, index) => (
      <Cell key={`cell-${index}`} fill={COLORSBar[index]} />
    ))}
  </Bar>
</BarChart>
  </div>
</div>


      </div>
    </EmployeeLayout>
  );
}

export default EmployeePerformance