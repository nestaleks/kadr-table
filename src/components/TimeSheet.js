import React, { useState } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import { useMonths } from '../context/MonthContext';
import * as XLSX from 'xlsx';
import './TimeSheet.css';

const MONTHS_UK = [
  'Квітень', 'Березень', 'Лютий', 'Січень', 'Грудень', 'Листопад',
  'Жовтень', 'Вересень', 'Серпень', 'Липень', 'Червень', 'Травень'
];

// Преобразование украинского названия месяца в номер месяца (0-11)
const getMonthNumber = (monthName) => {
  const monthMap = {
    'Січень': 0,
    'Лютий': 1,
    'Березень': 2,
    'Квітень': 3,
    'Травень': 4,
    'Червень': 5,
    'Липень': 6,
    'Серпень': 7,
    'Вересень': 8,
    'Жовтень': 9,
    'Листопад': 10,
    'Грудень': 11
  };
  return monthMap[monthName];
};

// Функция для определения количества дней в месяце
const getDaysInMonth = (monthName, year) => {
  const monthNumber = getMonthNumber(monthName);
  return new Date(year, monthNumber + 1, 0).getDate();
};

// Функция для определения является ли день выходным
const isWeekend = (year, monthName, day) => {
  const monthNumber = getMonthNumber(monthName);
  const date = new Date(year, monthNumber, day);
  return date.getDay() === 0 || date.getDay() === 6;
};

const TimeSheet = () => {
  const { monthIndex } = useParams();
  const navigate = useNavigate();
  const { months, addMonth, deleteMonth, clearMonthData, updateCellData, addEmployee } = useMonths();
  const [editingCell, setEditingCell] = useState(null);
  
  const currentMonth = months.find(m => m.id === parseInt(monthIndex));
  
  if (!currentMonth) {
    return <Navigate to="/" />;
  }

  const handleCopy = () => {
    const currentMonthIdx = MONTHS_UK.indexOf(currentMonth.name);
    const nextMonthIdx = (currentMonthIdx - 1 + MONTHS_UK.length) % MONTHS_UK.length;
    const nextMonthName = MONTHS_UK[nextMonthIdx];
    const nextYear = nextMonthIdx >= currentMonthIdx ? currentMonth.year : currentMonth.year + 1;
    
    addMonth(nextMonthName, nextYear);
    navigate('/');
  };

  const handleDelete = () => {
    if (window.confirm(`Ви впевнені, що хочете видалити табель за ${currentMonth.name} ${currentMonth.year} року?`)) {
      deleteMonth(currentMonth.id);
      navigate('/');
    }
  };

  const handleClear = () => {
    if (window.confirm(`Ви впевнені, що хочете очистити табель за ${currentMonth.name} ${currentMonth.year} року?`)) {
      clearMonthData(currentMonth.id);
    }
  };

  const handleCellEdit = (employeeId, field, value) => {
    updateCellData(currentMonth.id, employeeId, field, value);
    setEditingCell(null);
  };

  const handleExportToExcel = () => {
    // Подготовка данных для экспорта
    const daysInMonth = getDaysInMonth(currentMonth.name, currentMonth.year);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const exportData = currentMonth.tableData.map((employee, index) => {
      const rowData = {
        '№ з/п': index + 1,
        'ПІБ': employee.name,
        'Посада': employee.position,
        'Табельний номер': employee.employeeNumber,
        'Стать': employee.gender,
      };

      // Добавляем данные по дням
      days.forEach(day => {
        const dayKey = `day_${day}`;
        rowData[`${day}`] = employee.daysData?.[dayKey] || '8';
      });

      rowData['Всього годин'] = employee.totalHours?.total || '';
      rowData['Надурочно'] = employee.totalHours?.overtime || '';
      rowData['Нічних'] = employee.totalHours?.night || '';
      rowData['Вечірніх'] = employee.totalHours?.evening || '';
      rowData['Святкових'] = employee.totalHours?.holiday || '';

      return rowData;
    });

    // Создаем новую книгу Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Табель');

    // Сохраняем файл
    XLSX.writeFile(wb, `Табель_${currentMonth.name}_${currentMonth.year}.xlsx`);
  };

  const daysInMonth = getDaysInMonth(currentMonth.name, currentMonth.year);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="timesheet">
      <div className="timesheet-header">
        <Link to="/" className="back-button">
          ← Назад до списку місяців
        </Link>
        <div className="header-buttons">
          <button onClick={handleCopy} className="copy-button">
            Копіювати в новий місяць
          </button>
          <button onClick={handleClear} className="clear-button">
            Очистити цей документ
          </button>
          <button onClick={handleDelete} className="delete-button">
            Видалити цей документ
          </button>
          <button onClick={handleExportToExcel} className="export-button">
            Експорт в Excel
          </button>
        </div>
      </div>
      
      <div className="timesheet-title">
        <h1>ТАБЕЛЬ ОБЛІКУ РОБОЧОГО ЧАСУ</h1>
        <div className="company-info">
          <h2>Підприємство: ТОВ "Назва підприємства"</h2>
          <h3>Структурний підрозділ: Головний офіс</h3>
        </div>
        <div className="period-info">
          <p>Період: {currentMonth.name} {currentMonth.year} року</p>
          
        </div>
      </div>
      
      <div className="timesheet-content">
        <table className="timesheet-table">
          <thead>
            <tr>
              <th className="number-column">№ з/п</th>
              <th className="name-position-column">ПІБ, посада</th>
              <th className="employee-number-column">Табельний номер</th>
              <th className="gender-column">Стать (ч/ж)</th>
              <th colSpan={daysInMonth} className="attendance-header">
                Відмітки про явки та неявки за числами місяця (годин)
              </th>
              <th colSpan={6} className="total-hours-header">
                Відпрацьовано за місяць
              </th>
            </tr>
            <tr>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              {days.map(day => (
                <th 
                  key={day} 
                  className={`day-column ${isWeekend(currentMonth.year, currentMonth.name, day) ? 'weekend' : ''}`}
                >
                  {day}
                </th>
              ))}
              <th colSpan={2}>годин</th>
              <th colSpan={4}>з них</th>
            </tr>
            <tr>
              <th></th>
              <th></th>
              <th></th>
              <th></th>
              {days.map(day => (
                <th key={day}></th>
              ))}
              <th className="hours-total">всього</th>
              <th className="hours-sub">надурочно</th>
              <th className="hours-sub">нічних</th>
              <th className="hours-sub">вечірніх</th>
              <th className="hours-sub">святкових</th>
            </tr>
          </thead>
          <tbody>
            {currentMonth.tableData.length > 0 ? (
              currentMonth.tableData.map((employee, index) => (
                <tr key={employee.id}>
                  <td className="number-column">{index + 1}</td>
                  <td className="name-position-column">
                    {editingCell?.id === employee.id && editingCell?.field === 'name' ? (
                      <input
                        type="text"
                        className="name-input"
                        defaultValue={employee.name}
                        onBlur={(e) => handleCellEdit(employee.id, 'name', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="employee-name"
                        onClick={() => setEditingCell({ id: employee.id, field: 'name' })}
                      >
                        {employee.name || 'Введіть ПІБ'}
                      </div>
                    )}
                    {editingCell?.id === employee.id && editingCell?.field === 'position' ? (
                      <input
                        type="text"
                        className="position-input"
                        defaultValue={employee.position}
                        onBlur={(e) => handleCellEdit(employee.id, 'position', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        className="employee-position"
                        onClick={() => setEditingCell({ id: employee.id, field: 'position' })}
                      >
                        {employee.position || 'Введіть посаду'}
                      </div>
                    )}
                  </td>
                  <td 
                    className="employee-number-column"
                    onClick={() => setEditingCell({ id: employee.id, field: 'employeeNumber' })}
                  >
                    {editingCell?.id === employee.id && editingCell?.field === 'employeeNumber' ? (
                      <input
                        type="text"
                        defaultValue={employee.employeeNumber}
                        onBlur={(e) => handleCellEdit(employee.id, 'employeeNumber', e.target.value)}
                        autoFocus
                      />
                    ) : employee.employeeNumber}
                  </td>
                  <td 
                    className="gender-column"
                    onClick={() => setEditingCell({ id: employee.id, field: 'gender' })}
                  >
                    {editingCell?.id === employee.id && editingCell?.field === 'gender' ? (
                      <select
                        defaultValue={employee.gender}
                        onBlur={(e) => handleCellEdit(employee.id, 'gender', e.target.value)}
                        autoFocus
                      >
                        <option value="ч">ч</option>
                        <option value="ж">ж</option>
                      </select>
                    ) : employee.gender}
                  </td>
                  {days.map(day => (
                    <td 
                      key={day}
                      className={`day-column ${isWeekend(currentMonth.year, currentMonth.name, day) ? 'weekend' : ''}`}
                    >
                      {editingCell?.id === employee.id && editingCell?.field === `day_${day}_text` ? (
                        <input
                          type="text"
                          className="day-text-input"
                          defaultValue={employee.daysData?.[`day_${day}`]?.text || ''}
                          onBlur={(e) => handleCellEdit(employee.id, `day_${day}_text`, e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="day-text"
                          onClick={() => setEditingCell({ id: employee.id, field: `day_${day}_text` })}
                        >
                          {employee.daysData?.[`day_${day}`]?.text || ''}
                        </div>
                      )}
                      {editingCell?.id === employee.id && editingCell?.field === `day_${day}_hours` ? (
                        <input
                          type="text"
                          className="day-hours-input"
                          defaultValue={employee.daysData?.[`day_${day}`]?.hours || '8'}
                          onBlur={(e) => handleCellEdit(employee.id, `day_${day}_hours`, e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="day-hours"
                          onClick={() => setEditingCell({ id: employee.id, field: `day_${day}_hours` })}
                        >
                          {employee.daysData?.[`day_${day}`]?.hours || '8'}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="hours-total">
                    {editingCell?.id === employee.id && editingCell?.field === 'total_hours' ? (
                      <input
                        type="text"
                        className="hours-input"
                        defaultValue={employee.totalHours?.total || ''}
                        onBlur={(e) => handleCellEdit(employee.id, 'total_hours', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingCell({ id: employee.id, field: 'total_hours' })}
                      >
                        {employee.totalHours?.total || ''}
                      </div>
                    )}
                  </td>
                  <td className="hours-sub">
                    {editingCell?.id === employee.id && editingCell?.field === 'overtime_hours' ? (
                      <input
                        type="text"
                        className="hours-input"
                        defaultValue={employee.totalHours?.overtime || ''}
                        onBlur={(e) => handleCellEdit(employee.id, 'overtime_hours', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingCell({ id: employee.id, field: 'overtime_hours' })}
                      >
                        {employee.totalHours?.overtime || ''}
                      </div>
                    )}
                  </td>
                  <td className="hours-sub">
                    {editingCell?.id === employee.id && editingCell?.field === 'night_hours' ? (
                      <input
                        type="text"
                        className="hours-input"
                        defaultValue={employee.totalHours?.night || ''}
                        onBlur={(e) => handleCellEdit(employee.id, 'night_hours', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingCell({ id: employee.id, field: 'night_hours' })}
                      >
                        {employee.totalHours?.night || ''}
                      </div>
                    )}
                  </td>
                  <td className="hours-sub">
                    {editingCell?.id === employee.id && editingCell?.field === 'evening_hours' ? (
                      <input
                        type="text"
                        className="hours-input"
                        defaultValue={employee.totalHours?.evening || ''}
                        onBlur={(e) => handleCellEdit(employee.id, 'evening_hours', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingCell({ id: employee.id, field: 'evening_hours' })}
                      >
                        {employee.totalHours?.evening || ''}
                      </div>
                    )}
                  </td>
                  <td className="hours-sub">
                    {editingCell?.id === employee.id && editingCell?.field === 'holiday_hours' ? (
                      <input
                        type="text"
                        className="hours-input"
                        defaultValue={employee.totalHours?.holiday || ''}
                        onBlur={(e) => handleCellEdit(employee.id, 'holiday_hours', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div 
                        onClick={() => setEditingCell({ id: employee.id, field: 'holiday_hours' })}
                      >
                        {employee.totalHours?.holiday || ''}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={daysInMonth + 9} className="empty-message">
                  Немає даних для відображення
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="table-actions">
          <button 
            onClick={() => addEmployee(currentMonth.id)} 
            className="add-employee-button"
          >
            Додати співробітника
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeSheet;