import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminL from '../Layout/Admin_Layout/AdminL';
import EmployeeL from '../Layout/Employee_Layout/EmployeeL';
import EmployeeDashboard from '../Pages/Employee/Employeedash/employeedash';



const Routers= () => {
  return ( 
    <Routes>

        <Route path="/" element={<EmployeeL />}>
        <Route index element={<Navigate to="/view-home" />} />
        <Route path="/employeeDash" element={<EmployeeDashboard />}/>

      </Route>


        <Route path = "/admin" element = {<AdminL />} />
        
       

        
    </Routes>
    
  )
}

export default Routers;