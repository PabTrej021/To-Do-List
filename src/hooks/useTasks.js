import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useHaptics } from './useHaptics';
import { useAudio } from './useAudio';

export const useTasks = (session, showToast, onTaskComplete) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { triggerPop, triggerDelete, triggerSuccess } = useHaptics();
    const { playPop } = useAudio();

    // Soft delete state (Undo capability)
    const [deletedTaskCache, setDeletedTaskCache] = useState(null);
    const undoTimeoutRef = useRef(null);

    // Initial Fetch
    const fetchTasks = useCallback(async (userId) => {
        setLoading(true);
        const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId);
        if (!error) setTasks(data || []);
        setLoading(false);
    }, []);

    // Sincronización Real-time (Cross-Device)
    useEffect(() => {
        if (!session?.user?.id) {
            setTasks([]);
            setLoading(false);
            return;
        }

        fetchTasks(session.user.id);

        const channel = supabase.channel('public:tasks')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` }, payload => {
                setTasks(prev => {
                    if (prev.some(t => t.id === payload.new.id)) return prev;
                    return [payload.new, ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` }, payload => {
                setTasks(prev => prev.map(t => (t.id === payload.new.id ? payload.new : t)));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` }, payload => {
                setTasks(prev => prev.filter(t => t.id !== payload.old.id));
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [session?.user?.id, fetchTasks]);

    // 10. Auto-Ordenamiento (Prioridad y Fecha)
    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            // Uncompleted first
            if (a.completed !== b.completed) return a.completed ? 1 : -1;

            // Priority weight (High = 3, Medium = 2, Low = 1)
            const getPriorityWeight = (p) => p === 'high' ? 3 : p === 'medium' ? 2 : 1;
            const pwA = getPriorityWeight(a.priority);
            const pwB = getPriorityWeight(b.priority);
            if (pwA !== pwB) return pwB - pwA;

            // Date sorting
            if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
            if (a.due_date) return -1;
            if (b.due_date) return 1;

            return new Date(b.created_at) - new Date(a.created_at);
        });
    }, [tasks]);

    // CRUD Handlers
    const addTask = async (title, description, category, dueDate, updateId = null) => {
        if (updateId) {
            setTasks(prev => prev.map(t => t.id === updateId ? { ...t, title, category, description, due_date: dueDate } : t));
            showToast('Tarea Actualizada', 'Cambios guardados');
            if (session) await supabase.from('tasks').update({ title, description, due_date: dueDate, category }).eq('id', updateId);
            return;
        }

        const newTask = {
            id: crypto.randomUUID(),
            title,
            description,
            priority: title.length > 20 ? 'high' : 'medium',
            progress: 0,
            completed: false,
            user_id: session?.user?.id,
            created_at: new Date().toISOString(),
            due_date: dueDate || null,
            category: category
        };

        setTasks(prev => [newTask, ...prev]);
        showToast('Tarea agregada', 'En camino');
        if (session) await supabase.from('tasks').insert([{
            id: newTask.id,
            title: newTask.title,
            description: newTask.description,
            user_id: newTask.user_id,
            due_date: newTask.due_date,
            priority: newTask.priority
        }]);
    };

    const toggleTask = async (id, currentCompleted, onConfetti) => {
        const isCompleting = !currentCompleted;
        if (isCompleting) {
            playPop();
            if (onTaskComplete) onTaskComplete();
        }

        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: isCompleting } : t));

        if (isCompleting) {
            // Check if it's the last task of the day
            const remaining = tasks.filter(t => !t.completed && t.id !== id);
            if (remaining.length === 0 && tasks.length > 0) {
                triggerSuccess();
                if (onConfetti) onConfetti();
            }
        }

        if (session) await supabase.from('tasks').update({ completed: isCompleting }).eq('id', id);
    };

    // Soft Delete (Undo)
    const deleteTask = (id) => {
        triggerDelete();
        const taskToRemove = tasks.find(t => t.id === id);

        // Optimistic hide
        setTasks(prev => prev.filter(t => t.id !== id));

        // Cache it for undo
        setDeletedTaskCache(taskToRemove);

        // Auto-delete from DB after 5 seconds if not undone
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

        undoTimeoutRef.current = setTimeout(async () => {
            setDeletedTaskCache(null);
            if (session) await supabase.from('tasks').delete().eq('id', id);
        }, 5000); // 5 seconds to undo
    };

    const undoDelete = () => {
        if (!deletedTaskCache) return;
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

        // Restore to UI
        setTasks(prev => [deletedTaskCache, ...prev]);
        setDeletedTaskCache(null);
        showToast('Deshecho', 'La tarea ha sido restaurada');
    };

    // 13. Plantillas Ingeniería
    const loadEngineeringTemplates = async () => {
        const templates = [
            { title: 'Práctica de Simulación Montecarlo', category: 'study', priority: 'high' },
            { title: 'Reporte Lab. Principios Eléctricos', category: 'study', priority: 'high' },
            { title: 'Modelo E-R Base de Datos', category: 'work', priority: 'medium' }
        ];

        for (const t of templates) {
            await addTask(t.title, t.category, null);
        }
        showToast('Plantillas Cargadas', 'Listas para trabajar');
    };

    // Clear all completed tasks
    const clearCompleted = async () => {
        const completedIds = tasks.filter(t => t.completed).map(t => t.id);
        if (completedIds.length === 0) return;
        setTasks(prev => prev.filter(t => !t.completed));
        if (session) {
            await supabase.from('tasks').delete().in('id', completedIds);
        }
    };

    return {
        tasks: sortedTasks,
        rawTasks: tasks,
        loading,
        addTask,
        toggleTask,
        deleteTask,
        undoDelete,
        deletedTaskCache,
        loadEngineeringTemplates,
        clearCompleted
    };
};
