export default function Dashboard({ tasks }) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;

    // Apple-style clean summary
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    return (
        <div className="dashboard-header glass-panel">
            <div>
                <h2 className="text-title">{getGreeting()}</h2>
                <p className="text-subtitle">
                    {total === 0
                        ? "No hay tareas programadas."
                        : completed === total
                            ? "¡Todo completado por hoy!"
                            : `Tienes ${total - completed} tareas pendientes de ${total}.`}
                </p>
            </div>

            {total > 0 && (
                <div className="progress-pill">
                    <div className="progress-fill" style={{ width: `${(completed / total) * 100}%` }}></div>
                </div>
            )}

            <style>{`
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .progress-pill {
          width: 120px;
          height: 12px;
          background-color: var(--bg-color);
          border-radius: 99px;
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid var(--glass-border);
        }
        .progress-fill {
          height: 100%;
          background-color: var(--accent-color);
          transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          border-radius: 99px;
        }
        @media (max-width: 600px) {
          .progress-pill {
            width: 100%;
          }
        }
      `}</style>
        </div>
    );
}
