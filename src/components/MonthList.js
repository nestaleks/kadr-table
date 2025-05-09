import React from 'react';
import { Link } from 'react-router-dom';
import { useMonths } from '../context/MonthContext';
import './MonthList.css';

const MonthList = () => {
  const { months } = useMonths();

  return (
    <div className="month-list">
      <h1>Виберіть місяць</h1>
      <div className="months-grid">
        {months.map((month) => (
          <Link
            key={month.id}
            to={`/table/${month.id}`}
            className="month-item"
          >
            {month.name} {month.year}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MonthList;