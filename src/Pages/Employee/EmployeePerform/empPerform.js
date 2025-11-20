import React, { useState, useEffect, useCallback } from 'react';
import EmployeeLayout from '../../../Layout/Employee_Layout/EmployeeL';
import './empPerform.css'; // Assuming this CSS file exists
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

// --- Chart Constants and Default Data ---
const PIE_COLORS = ['#b89d2e', '#bb7c2d'];
const BAR_COLORS = ['#C58940', '#ebd174ff', '#B09226'];

const DEFAULT_RATING = 0;
const DEFAULT_COMMENT = "No recent performance review.";
const DEFAULT_PIE_DATA = [
  { name: 'Complete Tasks', value: 60 }, // Using placeholder data until you integrate Task/Attendance system
  { name: 'Uncomplete Tasks', value: 40 },
];
const DEFAULT_BAR_DATA = [
  { name: 'Present', count: 22 },
  { name: 'Absent', count: 14 },
  { name: 'Leave', count: 7 },
];

function EmployeePerformance() {
  const auth = getAuth(app);
  const db = getDatabase(app);

  const [employeeId, setEmployeeId] = useState(null); // The short '004' ID
  const [performanceData, setPerformanceData] = useState({
    rating: DEFAULT_RATING,
    comment: DEFAULT_COMMENT,
    leaveCount: 8,
    attendanceCount: 25,
    pieChartData: DEFAULT_PIE_DATA,
    barChartData: DEFAULT_BAR_DATA,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to render stars based on rating (0 to 5)
  const renderStars = useCallback((rating) => {
    const stars = [];
    const normalizedRating = Math.round(rating); // Use rounded score for star display
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


  /**
   * STEP 2: Fetch the latest performance review using the retrieved employeeId.
   */
  useEffect(() => {
    if (!employeeId) return;

    const fetchReviewData = async () => {
      setLoading(true);
      setError(null);

      try {
        const performanceRef = ref(db, 'performanceReviews');
        
        // Query: Find all reviews where 'empId' matches the short employeeId (e.g., '004')
        const employeeQuery = query(
          performanceRef,
          orderByChild('empId'),
          equalTo(employeeId)
        );

        const snapshot = await get(employeeQuery);
        let latestReview = null;

        if (snapshot.exists()) {
          let latestDate = 0;
          
          // Iterate and find the most recent review by date
          snapshot.forEach((childSnapshot) => {
            const review = childSnapshot.val();
            // Assuming date is in 'YYYY-MM-DD' format, which Date can parse
            const reviewTimestamp = new Date(review.date).getTime(); 

            if (reviewTimestamp > latestDate) {
              latestDate = reviewTimestamp;
              latestReview = review;
            }
          });
        }

        if (latestReview) {
          setPerformanceData(prevData => ({
            ...prevData,
            // Rating might be stored as a string like "10.5" or a number like 4
            rating: parseFloat(latestReview.rating) || parseFloat(latestReview.score) || DEFAULT_RATING,
            comment: latestReview.comments || DEFAULT_COMMENT,
            // NOTE: Attendance/Task data is currently using static defaults.
            // If this data is stored in Firebase, you'd fetch it here.
          }));
        } else {
          setError("No performance reviews found for this employee.");
        }
      } catch (err) {
        console.error("Error fetching review data:", err);
        setError("Failed to fetch performance reviews.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
  }, [db, employeeId]); // Dependency on employeeId ensures this runs only after the ID is set.


  /**
   * STEP 1: Fetch the employee's short ID ('004') using their long Firebase UID.
   */
  useEffect(() => {
    const fetchEmployeeId = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        setError("No logged-in user found.");
        return;
      }
      
      try {
        // Query the employee profile to get the memberID (which is the empId '004')
        const employeeRef = ref(db, `createEmployee/newEmployee/${user.uid}`);
        const snapshot = await get(employeeRef);

        if (snapshot.exists() && snapshot.val().memberID) {
          setEmployeeId(snapshot.val().memberID); // Set the short ID (e.g., '004')
        } else {
          setError("Employee Profile data (memberID) not found.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching member ID:", err);
        setError("Failed to retrieve employee profile ID.");
        setLoading(false);
      }
    });

    return () => fetchEmployeeId();
  }, [auth, db]); // Dependencies: auth and db instances


  if (loading) {
    return (
      <EmployeeLayout>
        <p>Loading employee performance data...</p>
      </EmployeeLayout>
    );
  }

  if (error) {
    return (
      <EmployeeLayout>
        <p style={{ color: 'red', fontWeight: 'bold', padding: '20px' }}>
          Error: {error}
        </p>
        <p>Displaying static data for visualization.</p>
        {/* Continue to render the component with default data for visualization */}
      </EmployeeLayout>
    );
  }

  // Destructure the final data for cleaner rendering
  const { rating, comment, leaveCount, attendanceCount, pieChartData, barChartData } = performanceData;

  return (
    <EmployeeLayout>
      <div className="performance-container">
        <h2>Employee Performance Overview 📊</h2>
        
        <div className="performance-row">
          {/* Rating Box */}
          <div className="employee-rating-box">
            <div className="rating-header">
              <span>Employee Ratings</span>
              <span className="rating-score">{rating.toFixed(1)}</span>
            </div>

            <div className="rating-stars">
              {renderStars(rating)}
            </div>

            <div className="rating-comment-label">Latest HR Comment</div>
            <div className="rating-comment-text">
              {comment}
            </div>
          </div>

          {/* Leave and Attendance Stats */}
          <div className="employee-stats-container">
            <div className="stat-boxLeave">
              <div className="stat-labelLeave">Leave Count per Month</div>
              <div className="stat-valueLeave">{leaveCount}</div>
            </div>
            <div className="stat-boxAttendance">
              <div className="stat-labelAttendance">Attendance per Month</div>
              <div className="stat-valueAttendance">{attendanceCount}</div>
            </div>
          </div>
        </div>

        {/* --- Charts Section --- */}
        <div className="performance-graphs-row">
          {/* Left Box: Pie Chart (Task Completion) */}
          <div className="graph-box">
            <h3>Task Completion</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}`, 'Value']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Right Box: Bar Chart (Attendance Overview) */}
          <div className="graph-box">
            <h3>Attendance Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Days">
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
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