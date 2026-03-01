import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export default function Dashboard({ tasks }) {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    useEffect(() => {
        if (percentage === 100 && total > 0) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b5cf6', '#d946ef', '#0ea5e9']
            });
        }
    }, [percentage, total]);

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        >
            <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">🚀 Dashboard Dinámico</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    {total === 0 ? "Comienza agregando tu primera tarea." :
                        percentage === 100 ? "¡Excelente trabajo! Has completado todas tus tareas." :
                            `Has completado ${completed} de ${total} tareas.`}
                </p>

                <div className="mt-4 flex gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl text-sm font-medium">
                        🎯 {total - completed} Pendientes
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-xl text-sm font-medium">
                        ✨ {completed} Completadas
                    </div>
                </div>
            </div>

            <div className="relative flex items-center justify-center">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                        className="text-slate-100 dark:text-slate-700"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="48"
                        cy="48"
                    />
                    <motion.circle
                        className="text-blue-500 drop-shadow-md"
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="48"
                        cy="48"
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-xl font-bold text-slate-700 dark:text-slate-200">{percentage}%</span>
                </div>
            </div>
        </motion.div>
    );
}
