import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'timesheet_data';

const INITIAL_MONTHS = [
  { 
    id: 0, 
    name: 'Квітень', 
    year: 2025,
    tableData: []
  },
];

export const MonthContext = createContext();

export const MonthProvider = ({ children }) => {
  // Загрузка данных из localStorage при инициализации
  const loadInitialData = () => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return INITIAL_MONTHS;
  };

  const [months, setMonths] = useState(loadInitialData);
  const [nextId, setNextId] = useState(() => {
    // Находим максимальный id среди существующих месяцев
    const maxId = Math.max(...months.map(month => month.id));
    return maxId + 1;
  });

  // Сохраняем данные в localStorage при каждом изменении
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(months));
  }, [months]);

  const addMonth = (monthName, year) => {
    setMonths(prevMonths => [
      { 
        id: nextId, 
        name: monthName, 
        year,
        tableData: [] 
      },
      ...prevMonths
    ]);
    setNextId(prev => prev + 1);
  };

  const deleteMonth = (id) => {
    setMonths(prevMonths => prevMonths.filter(month => month.id !== id));
  };

  const updateCellData = (monthId, employeeId, field, value) => {
    setMonths(prevMonths => prevMonths.map(month => {
      if (month.id === monthId) {
        return {
          ...month,
          tableData: month.tableData.map(employee => {
            if (employee.id === employeeId) {
              if (field.includes('day_')) {
                const dayNumber = field.split('_')[1];
                const fieldType = field.split('_')[2]; // text или hours
                const dayData = { ...employee.daysData };
                
                if (!dayData[`day_${dayNumber}`]) {
                  dayData[`day_${dayNumber}`] = { text: '', hours: '8' };
                }
                
                dayData[`day_${dayNumber}`][fieldType] = value;
                return { ...employee, daysData: dayData };
              } else if (field === 'total_hours') {
                return { 
                  ...employee, 
                  totalHours: { ...employee.totalHours, total: value }
                };
              } else if (field === 'overtime_hours') {
                return { 
                  ...employee, 
                  totalHours: { ...employee.totalHours, overtime: value }
                };
              } else if (field === 'night_hours') {
                return { 
                  ...employee, 
                  totalHours: { ...employee.totalHours, night: value }
                };
              } else if (field === 'evening_hours') {
                return { 
                  ...employee, 
                  totalHours: { ...employee.totalHours, evening: value }
                };
              } else if (field === 'holiday_hours') {
                return { 
                  ...employee, 
                  totalHours: { ...employee.totalHours, holiday: value }
                };
              } else {
                return { ...employee, [field]: value };
              }
            }
            return employee;
          })
        };
      }
      return month;
    }));
  };

  const clearMonthData = (id) => {
    setMonths(prevMonths => prevMonths.map(month => 
      month.id === id 
        ? { ...month, tableData: [] }
        : month
    ));
  };

  // Функция для добавления нового сотрудника
  const addEmployee = (monthId) => {
    setMonths(prevMonths => prevMonths.map(month => {
      if (month.id === monthId) {
        const newEmployee = {
          id: Date.now(), // Используем временную метку как уникальный id
          name: '',
          position: '',
          employeeNumber: '',
          gender: 'ч',
          daysData: {},
          totalHours: {
            total: '',
            overtime: '',
            night: '',
            evening: '',
            holiday: ''
          }
        };
        return {
          ...month,
          tableData: [...month.tableData, newEmployee]
        };
      }
      return month;
    }));
  };

  return (
    <MonthContext.Provider value={{ 
      months, 
      addMonth, 
      deleteMonth, 
      clearMonthData,
      updateCellData,
      addEmployee
    }}>
      {children}
    </MonthContext.Provider>
  );
};

export const useMonths = () => {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonths must be used within a MonthProvider');
  }
  return context;
};