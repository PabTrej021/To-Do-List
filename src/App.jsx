import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskInput from './components/TaskInput';

// Inline Icons
const SunIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>;
const MoonIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>;
const LogOutIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;

export default function App() {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', message: '' });

  // Custom "Dynamic Island" Toast System
  const showToast = useCallback((title, message) => {
    setToast({ visible: true, title, message });
    // Trigger tiny haptic feedback for toast
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);

    setTimeout(() => {
      setToast(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  // Auth and Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchTasks(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchTasks(session.user.id);
      else setTasks([]);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Theme Management
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark-mode');
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark-mode');
  };

  // Supabase Data Management
  const fetchTasks = async (userId) => {
    try {
      setLoading(true);
      // Removed order_index logic for simplicity as requested (no hello-pangea used anymore for resorting)
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error && error.code !== '42P01') throw error;

      setTasks(data || []);
    } catch (error) {
      console.log('Error fetching:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Real-time Subscription
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase.channel('postgres_changes_app')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${session.user.id}`
      }, (payload) => {
        // Handle changes from other clients
        if (payload.eventType === 'INSERT') {
          setTasks(prev => {
            const exists = prev.find(t => t.id === payload.new.id);
            if (exists) return prev;
            return [payload.new, ...prev]; // Prepend new tasks
          });
        }
        if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        }
        if (payload.eventType === 'DELETE') {
          setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddTask = async (title) => {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      user_id: session?.user?.id,
      created_at: new Date().toISOString()
    };

    // Optimistic Update
    setTasks(prev => [newTask, ...prev]);

    if (session) {
      try {
        const { error } = await supabase.from('tasks').insert([newTask]);
        if (error && error.code !== '42P01') {
          showToast('Error', 'No se pudo guardar la tarea');
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleToggleTask = async (id, currentCompleted) => {
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentCompleted } : t));
    showToast(currentCompleted ? 'Pendiente' : 'Completado', 'Estado actualizado');

    if (session) {
      try {
        const { error } = await supabase.from('tasks').update({ completed: !currentCompleted }).eq('id', id);
        if (error && error.code !== '42P01') throw error;
      } catch (err) {
        console.log("Error toggling:", err);
      }
    }
  };

  const handleDeleteTask = async (id) => {
    // Optimistic update
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Eliminada', 'Tarea removida con éxito');

    if (session) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error && error.code !== '42P01') throw error;
      } catch (err) {
        console.log("Error deleting:", err);
      }
    }
  };

  // Loading State
  if (loading && !session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="text-secondary">Cargando...</p>
      </div>
    );
  }

  // Not Authenticated
  if (!session) {
    return (
      <div className="app-container">
        {toast.visible && (
          <div className="dynamic-island-container">
            <div className={`dynamic-island animate-enter`}>
              {toast.title}: {toast.message}
            </div>
          </div>
        )}
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem' }}>
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Cambiar tema">
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
        <Auth onToast={showToast} />
      </div>
    );
  }

  // Authenticated Dashboard
  return (
    <div className="app-container">

      {/* Dynamic Island Toast */}
      {toast.visible && (
        <div className="dynamic-island-container">
          <div className="dynamic-island animate-enter">
            <span style={{ opacity: 0.7, fontWeight: 400 }}>{toast.title}</span> {toast.message}
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="app-header">
        <h1 className="text-title" style={{ margin: 0, fontSize: '1.5rem' }}>Listas</h1>

        <div className="flex-row" style={{ gap: '1rem' }}>
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Cambiar tema">
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
          <button onClick={handleSignOut} className="theme-toggle-btn" style={{ color: 'var(--danger-color)' }} aria-label="Cerrar sesión">
            <LogOutIcon />
          </button>
        </div>
      </header>

      <main>
        <Dashboard tasks={tasks} />
        <TaskInput onAdd={handleAddTask} />
        <TaskList
          tasks={tasks}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
        />
      </main>

    </div>
  );
}
