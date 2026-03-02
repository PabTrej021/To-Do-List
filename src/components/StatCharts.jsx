import React, { useState, useEffect } from 'react';

const CheckCircleIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="var(--success-color)"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>;
const ClockIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" color="var(--accent-color)"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;

export default function StatCharts({ tasks }) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const weeklyData = [
        { day: 'M', value: 30 },
        { day: 'T', value: 50 },
        { day: 'W', value: 80 }, // Active
        { day: 'T', value: 40 },
        { day: 'F', value: 60 },
        { day: 'S', value: 20 },
        { day: 'S', value: 10 },
    ];

    const [animatedBars, setAnimatedBars] = useState(weeklyData.map(() => 0));

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedBars(weeklyData.map(d => d.value));
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="stats-container">
            {/* 2 Cards: Completed vs Pending */}
            <div className="summary-cards">
                <div className="stat-card glass-panel-soft">
                    <div className="icon-rounded" style={{ backgroundColor: 'rgba(52, 199, 89, 0.15)' }}>
                        <CheckCircleIcon />
                    </div>
                    <div className="stat-info">
                        <h2>{completed}</h2>
                        <p>Completadas</p>
                    </div>
                </div>
                <div className="stat-card glass-panel-soft">
                    <div className="icon-rounded" style={{ backgroundColor: 'rgba(255, 45, 85, 0.15)' }}>
                        <ClockIcon />
                    </div>
                    <div className="stat-info">
                        <h2>{pending}</h2>
                        <p>Pendientes</p>
                    </div>
                </div>
            </div>

            {/* CSS Bar Chart */}
            <div className="chart-card glass-panel-soft" style={{ marginTop: '1.5rem' }}>
                <h3 className="section-title">Productividad Semanal</h3>
                <div className="css-chart-container">
                    {weeklyData.map((d, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '0.5rem' }}>
                            <div style={{ height: '100px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                <div
                                    className={`css-bar ${i === 2 ? 'active' : ''}`}
                                    style={{ height: `${animatedBars[i]}%`, width: '16px', borderRadius: '4px', transition: 'height 1s cubic-bezier(0.25, 1, 0.5, 1)' }}
                                ></div>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{d.day}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* SVG Smooth Curve Chart (You are on track) */}
            <div className="chart-card glass-panel-soft" style={{ marginTop: '1.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h3 className="section-title">Vas por buen camino</h3>
                    <h1 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{progressPercent}%</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>De tus tareas terminadas</p>
                </div>

                {/* Simple inline SVG to simulate a curve graphic sitting in the background bottom */}
                <svg
                    viewBox="0 0 200 100"
                    preserveAspectRatio="none"
                    style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '70px', opacity: 0.5, zIndex: 0 }}
                >
                    <defs>
                        <linearGradient id="gradientPath" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--accent-color)" />
                            <stop offset="100%" stopColor="#ff719a" />
                        </linearGradient>
                        <linearGradient id="fillArea" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--accent-color)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d="M0,80 Q50,20 100,50 T200,10 L200,100 L0,100 Z" fill="url(#fillArea)" />
                    <path d="M0,80 Q50,20 100,50 T200,10" fill="none" stroke="url(#gradientPath)" strokeWidth="4" />
                </svg>
            </div>

            <style>{`
        .stats-container {
          padding-top: 0.5rem;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .glass-panel-soft {
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--glass-border);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
          padding: 1.25rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-rounded {
          width: 48px; height: 48px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }

        .stat-info h2 {
          font-size: 1.5rem; line-height: 1; margin-bottom: 0.2rem;
        }
        
        .stat-info p {
          font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;
        }

        .section-title {
          font-size: 1.05rem;
          color: var(--text-primary);
        }
      `}</style>
        </div>
    );
}
