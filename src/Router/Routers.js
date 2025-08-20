import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import EmployeeDashboard from "../Pages/Employee/Employeedash/employeedash";
import EmployeeProfile from "../Pages/Employee/Employee_Profile/empProfile";
import EmployeeLayout from "../Layout/Employee_Layout/EmployeeL";
import EmployeeAttendance from "../Pages/Employee/EmployeeAttendance/empAttendance";
import Employeeleave from "../Pages/Employee/EmployeeLeave/empLeave";
import EmployeeTask from "../Pages/Employee/EmmployeeTask/empTask";
import EmployeePerformance from "../Pages/Employee/EmployeePerform/empPerform";
import AdminLayout from "../Layout/Admin_Layout/AdminL";
import AdminDashboard from "../Pages/AdminPage/AdminDash/adminDash";
import AdminProfileManage from "../Pages/AdminPage/Admin_ProfileManage/adminProfileM";
import MemberAdd from "../Pages/AdminPage/Admin_ProfileManage/ManageMem";
import AdminAttendanceReq from "../Pages/AdminPage/AdminAttendence/adminAttendence";
import AdminLeaveReq from "../Pages/AdminPage/AdminAttendence/adminLeave";
import AdminPerformance from "../Pages/AdminPage/AdminPerform/adminPerform";
import AdminTaskManage from "../Pages/AdminPage/AdminTask/adminTask";
import Login from "../Pages/Logins/login";

const Routers = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />}>
        <Route index element={<Navigate to="/adminDash" />} />
        
      </Route>
      <Route path="/employeeDash" element={<EmployeeDashboard />} />
      <Route path="/employeeProfile" element={<EmployeeProfile />} />
      <Route path="/employeeAttendance" element={<EmployeeAttendance />} />
      <Route path="/employeeLeave" element={<Employeeleave />} />
      <Route path="/employeePerformance" element={<EmployeePerformance />} />
      <Route path="/employeeTask" element={<EmployeeTask />} />
      <Route path="/adminLayout" element={<AdminLayout />}></Route>
      <Route path="/adminDash" element={<AdminDashboard />} />
      <Route path="/adminProfileManage" element={<AdminProfileManage />} />
      <Route path="/adminProfileadd" element={<MemberAdd />} />
      <Route path="/adminAttendance" element={<AdminAttendanceReq />} />
      <Route path="/adminLeave" element={<AdminLeaveReq />} />
      <Route path="/adminPerformance" element={<AdminPerformance />} />
      <Route path="/adminTask" element={<AdminTaskManage />} /> 
      <Route path="/dashboard" element={<EmployeeLayout />} /> 
    </Routes>
  );
};

export default Routers;
