import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MonthList from './components/MonthList';
import TimeSheet from './components/TimeSheet';
import { MonthProvider } from './context/MonthContext';
import './App.css';

function App() {
  return (
    <MonthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<MonthList />} />
            <Route path="/table/:monthIndex" element={<TimeSheet />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </MonthProvider>
  );
}

export default App;