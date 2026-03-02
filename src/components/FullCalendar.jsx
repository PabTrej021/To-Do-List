import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext';

export default function FullCalendar({ tasks, selectedDate, onSelectDate }) {
    const { lang } = useI18n();
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const monthName = currentMonth.toLocaleDateString(lang, { month: 'long', year: 'numeric' });
    const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const renderCells = () => {
        const cells = [];
        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
        }
        for (let d = 1; d <= totalDays; d++) {
            const dateObj = new Date(year, month, d);
            // Formatear date string evitando problemas de zona horaria local al dividir
            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(d).padStart(2, '0');
            const dateStr = `${year}-${monthStr}-${dayStr}`;

            // Count tasks
            const dayTasks = tasks.filter(t => t.due_date && t.due_date.startsWith(dateStr));
            const hasTasks = dayTasks.length > 0;

            const isSelected = selectedDate.toDateString() === dateObj.toDateString();
            const isToday = new Date().toDateString() === dateObj.toDateString();

            cells.push(
                <div
                    key={d}
                    onClick={() => onSelectDate(dateObj)}
                    className={`calendar-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                >
                    <span className="date-number">{d}</span>
                    {hasTasks && <div className="task-dots">
                        {dayTasks.length > 3 ? <span className="dot-plus">+</span> : dayTasks.map((_, i) => <div key={i} className="task-dot"></div>)}
                    </div>}
                </div>
            );
        }
        return cells;
    }

    return (
        <div className="full-calendar glass-panel-soft">
            <div className="header">
                <button onClick={prevMonth}>&lt;</button>
                <h2>{monthName}</h2>
                <button onClick={nextMonth}>&gt;</button>
            </div>
            <div className="grid">
                {weekDays.map(wd => <div key={wd} className="weekday">{wd}</div>)}
                {renderCells()}
            </div>
            <style>{`
            .glass-panel-soft {
                background: var(--glass-bg);
                backdrop-filter: blur(12px);
                border: 1px solid var(--glass-border);
                border-radius: var(--border-radius-lg);
                box-shadow: var(--shadow-sm);
            }
            .full-calendar { padding: 1.5rem; margin-bottom: 2rem; animation: fadeIn 0.3s; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
            .header h2 { text-transform: capitalize; font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
            .header button { background: var(--bg-color-secondary); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
            .header button:hover { background: var(--accent-color); color: white; border-color: transparent;}
            .grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; }
            .weekday { text-align: center; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 0.5rem; }
            .calendar-cell { aspect-ratio: 1; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 5px; cursor: pointer; border: 1px solid var(--glass-border); background: rgba(0,0,0,0.02); transition: all 0.2s; position: relative; }
            .calendar-cell:hover { background: var(--bg-color-secondary); transform: translateY(-2px); }
            :root.dark-mode .calendar-cell { background: rgba(255,255,255,0.02); }
            .calendar-cell.today { background: rgba(255, 45, 85, 0.1); border-color: rgba(255,45,85,0.3); }
            .calendar-cell.selected { background: linear-gradient(135deg, var(--accent-color), #ff719a); border-color: transparent; box-shadow: 0 4px 10px rgba(255,45,85,0.3); }
            .calendar-cell.selected .date-number { color: white; }
            .date-number { font-size: 1rem; font-weight: 600; color: var(--text-primary); }
            .calendar-cell.empty { background: transparent; border-color: transparent; pointer-events: none; }
            .task-dots { display: flex; gap: 3px; margin-top: auto; padding-bottom: 5px; align-items: center; }
            .task-dot { width: 5px; height: 5px; background: var(--success-color); border-radius: 50%; }
            .calendar-cell.selected .task-dot { background: white; }
            .dot-plus { font-size: 0.6rem; color: var(--success-color); font-weight: bold; line-height: 1; }
            .calendar-cell.selected .dot-plus { color: white; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @media (max-width: 480px) {
               .grid { gap: 6px; }
               .full-calendar { padding: 1rem; }
               .date-number { font-size: 0.9rem; }
            }
        `}</style>
        </div>
    )
}
