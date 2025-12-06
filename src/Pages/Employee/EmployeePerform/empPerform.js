import React, { useState, useEffect, useCallback } from 'react';
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
  ResponsiveContainer,
} from 'recharts';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, query, orderByChild, equalTo, get } from 'firebase/database';
import app from '../../../Service/FirebaseConfig';

const PIE_COLORS = ['#b89d2e', '#bb7c2d'];
const BAR_COLORS = ['#C58940', '#ebd174ff', '#B09226'];

const DEFAULT_RATING = 0.0;
const DEFAULT_COMMENT = "No recent performance review.";
const DEFAULT_PIE_DATA = [
  { name: 'Complete Tasks', value: 0 },
  { name: 'Incomplete Tasks', value: 0 },
];
const DEFAULT_BAR_DATA = [
  { name: 'Present', count: 0 },
  { name: 'Leave', count: 0 },
];

function EmployeePerformance() {
  const auth = getAuth(app);
  const db = getDatabase(app);

  const [employeeId, setEmployeeId] = useState(null);
  const [performanceData, setPerformanceData] = useState({
    rating: DEFAULT_RATING,
    comment: DEFAULT_COMMENT,
    leaveCount: 0,
    attendanceCount: 0,
    pieChartData: DEFAULT_PIE_DATA,
    barChartData: DEFAULT_BAR_DATA,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const renderStars = useCallback((rating) => {
    const stars = [];
    const normalizedRating = Math.max(0, Math.min(5, Math.round(rating)));
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar
          key={i}
          className={`star ${i <= normalizedRating ? 'filled' : 'empty'}`}
        />
      );
    }
    return stars;
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setError('No logged-in user found.');
        setLoading(false);
        return;
      }

      const EMP_PROFILE_PATH = 'createEmployee/newEmployee';

      try {
        const directRef = ref(db, `${EMP_PROFILE_PATH}/${user.uid}`);
        const directSnap = await get(directRef);
        if (directSnap.exists() && directSnap.val().memberID) {
          setEmployeeId(directSnap.val().memberID);
          return;
        }

        const employeesRef = ref(db, EMP_PROFILE_PATH);
        const q = query(employeesRef, orderByChild('firebaseId'), equalTo(user.uid));
        const empSnap = await get(q);

        let foundMemberId = null;
        empSnap.forEach((child) => {
          const val = child.val();
          if (val.memberID) foundMemberId = val.memberID;
        });

        if (foundMemberId) {
          setEmployeeId(foundMemberId);
          return;
        }

        setError('Employee Profile not found. Cannot fetch performance.');
      } catch (err) {
        console.error('Error fetching member ID:', err);
        setError('Failed to load Employee Profile');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  useEffect(() => {
    if (!employeeId) return;

    const fetchAllPerformanceData = async () => {
      setLoading(true);
      const newData = {
        rating: DEFAULT_RATING,
        comment: DEFAULT_COMMENT,
        leaveCount: 0,
        attendanceCount: 0,
        pieChartData: DEFAULT_PIE_DATA,
        barChartData: DEFAULT_BAR_DATA,
      };

      let hasError = false;

      // PERFORMANCE
      try {
        const performanceRef = ref(db, 'performanceReviews');
        const perfQuery = query(performanceRef, orderByChild('empId'), equalTo(employeeId));
        const snap = await get(perfQuery);

        let latestReview = null;
        let latestDate = 0;
        if (snap.exists()) {
          snap.forEach((child) => {
            const review = child.val();
            const timestamp = review.date ? new Date(review.date).getTime() : 0;
            if (timestamp > latestDate) {
              latestDate = timestamp;
              latestReview = review;
            }
          });
        }

        if (latestReview) {
          newData.rating = parseFloat(latestReview.rating ?? latestReview.score) || 0;
          newData.comment = latestReview.comments ?? latestReview.comment ?? DEFAULT_COMMENT;
        }
      } catch (err) {
        console.error('Error fetching review:', err);
        hasError = true;
      }

      // ATTENDANCE
      try {
        const attendanceRef = ref(db, 'attendanceRecords');
        const attQuery = query(attendanceRef, orderByChild('empId'), equalTo(employeeId));
        const attSnap = await get(attQuery);

        let totalPresent = 0, totalLeave = 0, totalAbsent = 0;
        let latestYear = null, latestMonth = null;

        attSnap.forEach((child) => {
          const dateStr = child.val().date || "";
          if (!dateStr.includes("-")) return;
          const y = dateStr.substring(0, 4);
          const m = dateStr.substring(5, 7);
          if (!latestYear || (y + m) > (latestYear + latestMonth)) {
            latestYear = y;
            latestMonth = m;
          }
        });

        attSnap.forEach((child) => {
          const record = child.val();
          const dateStr = record.date || "";
          if (!dateStr.includes("-")) return;
          const recordYear = dateStr.substring(0, 4);
          const recordMonth = dateStr.substring(5, 7);
          if (recordYear === latestYear && recordMonth === latestMonth) {
            const status = (record.attendance || "").toLowerCase();
            if (status === "present") totalPresent++;
            else if (status === "leave") totalLeave++;
            else totalAbsent++;
          }
        });

        newData.attendanceCount = totalPresent;
        newData.leaveCount = totalLeave;

        newData.barChartData = [
          { name: 'Present', count: totalPresent },
          { name: 'Leave', count: totalLeave },
        ];
      } catch (err) {
        console.error('Error fetching attendance:', err);
        hasError = true;
      }

      // TASKS
      try {
        const tasksRef = ref(db, 'tasks');
        const tQuery = query(tasksRef, orderByChild('empId'), equalTo(employeeId));
        const taskSnap = await get(tQuery);

        let completedTasks = 0, totalTasks = 0;
        if (taskSnap.exists()) {
          taskSnap.forEach((child) => {
            const task = child.val();
            const status = (task.status || "").toLowerCase();
            totalTasks++;
            if (status === 'complete' || status === 'completed') completedTasks++;
          });
        }

        const completedPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        newData.pieChartData = [
          { name: 'Complete Tasks', value: completedPercent },
          { name: 'Incomplete Tasks', value: 100 - completedPercent },
        ];
      } catch (err) {
        console.error('Error fetching tasks:', err);
        hasError = true;
      }

      setPerformanceData(newData);
      setError(hasError ? 'Some data failed to load!' : null);
      setLoading(false);
    };

    fetchAllPerformanceData();
  }, [employeeId, db]);

  if (loading) {
    return <EmployeeLayout><h3>Loading employee performance...</h3></EmployeeLayout>;
  }

  const { rating, comment, leaveCount, attendanceCount, pieChartData, barChartData } = performanceData;

  return (
    <EmployeeLayout>
      <div className="performance-container">
        <h2>Employee Performance Overview 📊</h2>

        <div className="performance-row">
          <div className="employee-rating-box">
            <div className="rating-header">
              <span>Employee Rating</span>
              <span className="rating-score">{rating.toFixed(1)}</span>
            </div>

            <div className="rating-stars">{renderStars(rating)}</div>
            <div className="rating-comment-label">Latest HR Comment</div>
            <div className="rating-comment-text">{comment}</div>
          </div>

          <div className="employee-stats-container">
            <div className="stat-boxLeave">
              <div className="stat-labelLeave">Leave Days</div>
              <div className="stat-valueLeave">{leaveCount}</div>
            </div>

            <div className="stat-boxAttendance">
              <div className="stat-labelAttendance">Present Days</div>
              <div className="stat-valueAttendance">{attendanceCount}</div>
            </div>
          </div>
        </div>

        <div className="performance-graphs-row">
          <div className="graph-box">
            <h3>Task Completion</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  outerRadius={80}
                  labelLine={true}
                  label={({ cx, cy, midAngle, outerRadius, percent, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 20;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#000"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                      >
                        {`${pieChartData[index].name}: ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" />
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="graph-box">
            <h3>Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count">
                  {barChartData.map((entry, index) => (
                    <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}

export default EmployeePerformance;
