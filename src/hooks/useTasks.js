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
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log("📥 Datos recibidos de Supabase:", data);

            if (data) {
                setTasks(data);
            }
        } catch (error) {
            console.error("❌ ERROR LEYENDO TAREAS:", error.message, error.details);
            alert("Error al cargar tareas: " + error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Sincronización Real-time (Cross-Device)
    useEffect(() => {
        if (!session?.user?.id) {
            setTasks([]);
            setLoading(false);
            return;
        }

        fetchTasks(session.user.id);

        const subscription = supabase.channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` },
                (payload) => {
                    console.log('Cambio detectado en DB:', payload);
                    // Estrategia más segura: volver a traer todo para mantener el orden y filtros
                    fetchTasks(session.user.id);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(subscription);
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
            if (session) {
                const { error } = await supabase.from('tasks').update({ title, description, due_date: dueDate, category }).eq('id', updateId);
                if (error) {
                    console.error('ERROR ACTUALIZANDO TAREA:', error.message, error.details);
                    alert("Error al actualizar tarea: " + error.message);
                    fetchTasks(session.user.id); // Re-fetch para revertir si falló
                }
            }
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
        if (session) {
            const { error } = await supabase.from('tasks').insert([{
                id: newTask.id,
                title: newTask.title,
                description: newTask.description,
                user_id: newTask.user_id,
                due_date: newTask.due_date,
                priority: newTask.priority,
                category: newTask.category
            }]).select();

            if (error) {
                console.error("ERROR GUARDANDO TAREA:", error.message, error.details);
                alert("Error al guardar: " + error.message);
                fetchTasks(session.user.id); // Re-fetch para revertir
            }
        }
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

        if (session) {
            const { error } = await supabase.from('tasks').update({ completed: isCompleting }).eq('id', id);
            if (error) {
                console.error("ERROR AL COMPLETAR TAREA:", error.message, error.details);
                alert("Error al completar la tarea: " + error.message);
                fetchTasks(session.user.id);
            }
        }
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
            if (session) {
                const { error } = await supabase.from('tasks').delete().eq('id', id);
                if (error) {
                    console.error("ERROR AL ELIMINAR TAREA:", error.message, error.details);
                    alert("Error al eliminar la tarea: " + error.message);
                    fetchTasks(session.user.id);
                }
            }
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
            const { error } = await supabase.from('tasks').delete().in('id', completedIds);
            if (error) {
                console.error("ERROR AL VACIAR TAREAS:", error.message, error.details);
                alert("Error al vaciar tareas completadas: " + error.message);
                fetchTasks(session.user.id);
            }
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
