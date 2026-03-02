import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext';

// Genera los días consecutivos desde hoy
const generateDays = (numDays = 14, locale = 'es') => {
  const days = [];
  const today = new Date();

  for (let i = 0; i < numDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d,
      dayNumber: d.getDate(),
      dayName: d.toLocaleDateString(locale, { weekday: 'short' }), // Dinámico según idioma
      isToday: i === 0,
      fullDateStr: d.toDateString()
    });
  }
  return days;
};

export default function CalendarStrip({ onSelectDate }) {
  const { lang } = useI18n();
  const [days, setDays] = useState([]);
  const [activeDateStr, setActiveDateStr] = useState('');

  useEffect(() => {
    const generated = generateDays(14, lang);
    setDays(generated);
    setActiveDateStr(generated[0].fullDateStr);
  }, [lang]); // Rehacer si cambia el idioma

  const handleSelect = (day) => {
    setActiveDateStr(day.fullDateStr);
    onSelectDate(day.date);
  };

  return (
    <div className="calendar-section">
      <div className="horizontal-scroll" style={{ padding: '10px 24px 0.5rem 5px' }}>
        {days.map((day, idx) => {
          const isActive = day.fullDateStr === activeDateStr;
          return (
            <div
              key={idx}
              onClick={() => handleSelect(day)}
              className={`scroll-item calendar-card ${isActive ? 'active' : ''}`}
            >
              <span className="cal-day-name">{day.dayName}</span>
              <span className="cal-day-num">{day.dayNumber}</span>
              {day.isToday && <div className="cal-today-dot"></div>}
            </div>
          );
        })}
      </div>

      <style>{`
        .calendar-section {
          margin-bottom: 2rem;
        }

        .calendar-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 60px;
          height: 80px;
          margin-right: 0.75rem;
          border-radius: var(--border-radius-md);
          background-color: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(10px);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }

        .calendar-card:hover {
          transform: translateY(-2px);
          background-color: var(--bg-color-secondary);
        }

        .calendar-card.active {
          background: linear-gradient(135deg, var(--accent-color), #ff719a);
          color: white;
          border-color: transparent;
          box-shadow: 0 6px 15px rgba(255, 45, 85, 0.3);
          transform: translateY(-4px);
        }

        .cal-day-name {
          font-size: 0.8rem;
          font-weight: 500;
          opacity: 0.7;
          margin-bottom: 0.25rem;
          text-transform: capitalize;
        }

        .calendar-card.active .cal-day-name {
          opacity: 0.9;
        }

        .cal-day-num {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .cal-today-dot {
          width: 5px;
          height: 5px;
          background-color: var(--accent-color);
          border-radius: 50%;
          position: absolute;
          bottom: 6px;
        }

        .calendar-card.active .cal-today-dot {
          background-color: white;
        }
      `}</style>
    </div>
  );
}
