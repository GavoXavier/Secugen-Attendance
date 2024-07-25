import React, { useState, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar1 from './components/Navbar1';
import AddEmployee from './components/AddEmployee';
import CheckList from './components/CheckList';
import EmployeeListContainer from './components/EmployeeListContainer';
import AdminDashboard from './components/AdminDashboard';
import Switch from './components/Switch';

export default function Admin() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`flex flex-col md:flex-row min-h-screen ${darkMode ? 'dark' : ''}`}>
      <Navbar1 />
      <div className="flex-grow bg-gray-100 dark:bg-gray-900 p-6">
        <div className="flex justify-end p-4">
          <Switch isOn={darkMode} handleToggle={() => setDarkMode(!darkMode)} />
        </div>
        <div className="container mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg backdrop-filter backdrop-blur-lg bg-opacity-70 dark:bg-opacity-70">
          <Routes>
            <Route path="admin-dashboard" element={<AdminDashboard />} />
            <Route path="add-employee" element={<AddEmployee />} />
            <Route path="check-list" element={<CheckList />} />
            <Route path="employee-list" element={<EmployeeListContainer />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
