import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskInput from './components/TaskInput';

// Inline Icons
const SunIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>;
const MoonIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>;
const LogOutIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;

// Helpers LocalStorage for Gamification Extrapolation
function getLocalProfile(userId) {
  const json = localStorage.getItem(`profile_${userId}`);
  return json ? JSON.parse(json) : { xp: 0, streak: 0, lastLogin: new Date().toDateString() };
}
function saveLocalProfile(userId, data) {
  localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
}

export default function App() {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme & UI State
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', message: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Todas');
  const [showConfetti, setShowConfetti] = useState(false);

  // Gamification State
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  // Toast System
  const showToast = useCallback((title, message) => {
    setToast({ visible: true, title, message });
    if (window.navigator?.vibrate) window.navigator.vibrate(20);
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3500);
  }, []);

  // Check Local Auth & Preferences
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        initGamification(session.user.id);
        fetchTasks(session.user.id);
      } else {
        setLoading(false);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        initGamification(session.user.id);
        fetchTasks(session.user.id);
      } else {
        setTasks([]);
        setXp(0);
        setStreak(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initGamification = (userId) => {
    const profile = getLocalProfile(userId);
    const today = new Date().toDateString();

    // Increment streak if last interaction was yesterday, reset if older
    if (profile.lastLogin !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (profile.lastLogin === yesterday.toDateString()) {
        profile.streak += 1;
        showToast('¡Racha Mantenida!', `Día ${profile.streak} 🔥`);
      } else {
        profile.streak = 1; // Start new streak
      }
      profile.lastLogin = today;
      saveLocalProfile(userId, profile);
    }

    setXp(profile.xp);
    setStreak(profile.streak);
  };

  const addXp = (amount) => {
    if (!session) return;
    const oldLevel = Math.floor(xp / 100) + 1;
    const newXp = xp + amount;
    const newLevel = Math.floor(newXp / 100) + 1;

    setXp(newXp);

    const profile = getLocalProfile(session.user.id);
    saveLocalProfile(session.user.id, { ...profile, xp: newXp });

    if (newLevel > oldLevel) {
      triggerLevelUp();
    }
  };

  const triggerLevelUp = () => {
    setShowConfetti(true);
    showToast('¡Nivel Aumentado!', 'Ganaste más XP y progresaste enormemente.');
    if (window.navigator?.vibrate) window.navigator.vibrate([100, 50, 100, 50, 100]);
    setTimeout(() => setShowConfetti(false), 5000);
  };

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

  // DB Fetch
  const fetchTasks = async (userId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error && error.code !== '42P01') throw error;
      setTasks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time
  useEffect(() => {
    if (!session?.user) return;
    const channel = supabase.channel('tasks_app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setTasks(prev => [payload.new, ...prev.filter(t => t.id !== payload.new.id)]);
          if (payload.eventType === 'UPDATE') setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
          if (payload.eventType === 'DELETE') setTasks(prev => prev.filter(t => t.id !== payload.old.id));
        })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  const handleSignOut = () => supabase.auth.signOut();

  // Handlers
  const handleAddTask = async (title, category) => {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      description: `Categoria: ${category}`, // Saving cat in description since we didn't alter db schema
      completed: false,
      user_id: session?.user?.id,
      created_at: new Date().toISOString()
    };

    // Store temporarily in 'category' field for client render
    newTask.category = category;

    setTasks(prev => [newTask, ...prev]);
    showToast('Añadida', 'Nueva tarea creada exitosamente.');

    if (session) {
      const { error } = await supabase.from('tasks').insert([{
        id: newTask.id, title, description: category, user_id: newTask.user_id
      }]);
      if (error && error.code !== '42P01') showToast('Error', 'No se pudo sincronizar');
    }
  };

  const handleToggleTask = async (id, currentCompleted) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentCompleted } : t));
    showToast(!currentCompleted ? '¡Excelente!' : 'Deshecha', !currentCompleted ? 'Has completado una tarea.' : 'Marcada como pendiente.');

    if (!currentCompleted) addXp(25); // +25 XP per task completed

    if (session) {
      const { error } = await supabase.from('tasks').update({ completed: !currentCompleted }).eq('id', id);
      if (error && error.code !== '42P01') console.error(error);
    }
  };

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    showToast('Eliminada', 'Tarea limpiada de la lista.');
    if (session) supabase.from('tasks').delete().eq('id', id);
  };

  // Filter Logic
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    // Map categories back from description if they exist (hack for db compat without altering schema)
    filtered = filtered.map(t => ({ ...t, category: t.category || (t.description?.includes('Categoria:') ? t.description.split(': ')[1] : 'other') }));

    if (activeFilter === 'Pendientes') return filtered.filter(t => !t.completed);
    if (activeFilter === 'Completadas') return filtered.filter(t => t.completed);
    return filtered;
  }, [tasks, activeFilter]);


  // Rendering
  if (loading && !session) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando Aurora...</div>;

  return (
    <div className="app-container">

      {/* Toast Alert */}
      {toast.visible && (
        <div className="dynamic-island-container">
          <div className="dynamic-island animate-enter">
            <span style={{ opacity: 0.6, fontWeight: 400 }}>{toast.title}:</span> {toast.message}
          </div>
        </div>
      )}

      {/* Confetti Animation (CSS fallback built in Dashboard? No, let's inject simple floating colored divs) */}
      {showConfetti && (
        <div className="confetti-overlay">
          {[...Array(30)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '-10px',
              left: Math.random() * 100 + 'vw',
              width: '10px', height: '10px',
              backgroundColor: ['#ff2a5f', '#ff9500', '#5e5ce6', '#34c759'][Math.floor(Math.random() * 4)],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `fall ${Math.random() * 3 + 2}s linear forwards`
            }} />
          ))}
        </div>
      )}

      {/* Header */}
      <header className="app-header glass-panel" style={{ padding: '0.75rem 1.5rem', marginBottom: '1.5rem', borderRadius: '40px' }}>
        <h1 className="text-title" style={{ margin: 0, fontSize: '1.4rem' }}>Aurora Plan</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Cambiar tema">{darkMode ? <SunIcon /> : <MoonIcon />}</button>
          {session && <button onClick={handleSignOut} className="theme-toggle-btn" style={{ color: 'var(--danger-color)' }}><LogOutIcon /></button>}
        </div>
      </header>

      {/* Auth Gates */}
      {!session ? (
        isRegistering
          ? <Register onToast={showToast} onSwitchToLogin={() => setIsRegistering(false)} />
          : <Login onToast={showToast} onSwitchToRegister={() => setIsRegistering(true)} />
      ) : (
        <main>
          <Dashboard
            tasks={tasks}
            xp={xp} level={Math.floor(xp / 100) + 1} streak={streak}
            activeFilter={activeFilter} onFilterChange={setActiveFilter}
          />
          <TaskInput onAdd={handleAddTask} />
          <TaskList
            tasks={filteredTasks}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
          />
        </main>
      )}

      <style>{`
         @keyframes fall {
           to { transform: translateY(110vh) rotate(720deg); }
         }
      `}</style>
    </div>
  );
}
