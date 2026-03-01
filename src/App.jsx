import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import Register from './components/Register';
import TaskList from './components/TaskList';
import TaskInput from './components/TaskInput';
import CategoryCarousel from './components/CategoryCarousel';
import CalendarStrip from './components/CalendarStrip';
import StatCharts from './components/StatCharts';

// Icons
const BellIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const PlusIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const HomeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const BarChartIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>;

// Profile helpers (Local)
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

  // App UI State
  const [toast, setToast] = useState({ visible: false, title: '', message: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'stats'
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Dashboard Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Gamification
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  const showToast = useCallback((title, message) => {
    setToast({ visible: true, title, message });
    if (window.navigator?.vibrate) window.navigator.vibrate(20);
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3500);
  }, []);

  // Sync / Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { initGamification(session.user.id); fetchTasks(session.user.id); }
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) { initGamification(session.user.id); fetchTasks(session.user.id); }
      else { setTasks([]); setXp(0); setStreak(0); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const initGamification = (userId) => {
    const profile = getLocalProfile(userId);
    const today = new Date().toDateString();
    if (profile.lastLogin !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      if (profile.lastLogin === yesterday.toDateString()) {
        profile.streak += 1; showToast('¡Racha Mantenida!', `Día ${profile.streak} 🔥`);
      } else profile.streak = 1;
      profile.lastLogin = today;
      saveLocalProfile(userId, profile);
    }
    setXp(profile.xp); setStreak(profile.streak);
  };

  const addXp = (amount) => {
    if (!session) return;
    const newXp = xp + amount; setXp(newXp);
    saveLocalProfile(session.user.id, { ...getLocalProfile(session.user.id), xp: newXp });
  };

  const fetchTasks = async (userId) => {
    setLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (!error) setTasks(data || []);
    setLoading(false);
  };

  // Handlers
  const handleAddTask = async (title, category) => {
    const newTask = {
      id: crypto.randomUUID(), title,
      description: `Categoria: ${category}`,
      priority: title.length > 20 ? 'high' : 'medium', // Mock UI data
      progress: 0,
      completed: false, user_id: session?.user?.id, created_at: new Date().toISOString()
    };
    newTask.category = category;

    setTasks(prev => [newTask, ...prev]);
    showToast('Añadida', 'Nueva tarea creada exitosamente.');
    setShowTaskModal(false);

    if (session) await supabase.from('tasks').insert([{ id: newTask.id, title, description: category, user_id: newTask.user_id }]);
  };

  const handleToggleTask = async (id, currentCompleted) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentCompleted } : t));
    if (!currentCompleted) addXp(25);
    if (session) await supabase.from('tasks').update({ completed: !currentCompleted }).eq('id', id);
  };

  const handleDeleteTask = async (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (session) await supabase.from('tasks').delete().eq('id', id);
  };

  // Extract real Category from DB payload
  const mappedTasks = useMemo(() => tasks.map(t => ({
    ...t,
    category: t.category || (t.description?.includes('Categoria:') ? t.description.split(': ')[1] : 'other')
  })), [tasks]);

  const filteredTasks = useMemo(() => {
    let list = mappedTasks;
    // Tab filtering
    if (activeTab === 'Personal') list = list.filter(t => t.category === 'home' || t.category === 'health');
    if (activeTab === 'Study') list = list.filter(t => t.category === 'study');
    if (activeTab === 'Important') list = list.filter(t => !t.completed && (t.priority === 'high' || t.title.length > 20));
    // Search
    if (searchQuery) list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

    return list;
  }, [mappedTasks, activeTab, searchQuery]);

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

      {!session ? (
        isRegistering
          ? <Register onToast={showToast} onSwitchToLogin={() => setIsRegistering(false)} />
          : <Login onToast={showToast} onSwitchToRegister={() => setIsRegistering(true)} />
      ) : (
        <>
          {/* Top Bar Navigation */}
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Hello, {session.user.email.split('@')[0]}</p>
              <h1 className="text-title" style={{ margin: 0, fontSize: '1.6rem' }}>Tus Tareas</h1>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button style={{ color: 'var(--text-primary)', position: 'relative' }}>
                <BellIcon />
                <span style={{ position: 'absolute', top: '2px', right: '3px', width: '8px', height: '8px', backgroundColor: 'var(--accent-color)', borderRadius: '50%' }}></span>
              </button>
              {/* Mock Avatar */}
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, #5e5ce6, #bf5af2)', boxShadow: 'vvar(--shadow-sm)', cursor: 'pointer' }} onClick={() => supabase.auth.signOut()} title="Cerrar sesión"></div>
            </div>
          </header>

          <main style={{ paddingBottom: '5rem' }}>
            {currentView === 'home' ? (
              <>
                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><SearchIcon /></div>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '3rem', borderRadius: '30px' }}
                  />
                </div>

                {/* Horizontal Category Carousel */}
                <CategoryCarousel tasks={mappedTasks} onAddCategoryTask={(catId) => { setShowTaskModal(true); }} />

                {/* Horizontal Filter Pills */}
                <div className="horizontal-scroll" style={{ paddingBottom: '0.25rem', marginBottom: '1.5rem' }}>
                  {['All', 'Personal', 'Study', 'Important'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`scroll-item ${activeTab === tab ? 'pill-active' : 'pill-inactive'}`}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '30px', marginRight: '0.75rem', fontWeight: 600, fontSize: '0.9rem', transition: 'all var(--transition-fast)' }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Calendar Strip */}
                <CalendarStrip onSelectDate={(date) => setSelectedDate(date)} />

                {/* Today's Tasks */}
                <h3 className="text-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Today's Tasks</h3>
                <TaskList
                  tasks={filteredTasks}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                />
              </>
            ) : (
              <StatCharts tasks={mappedTasks} />
            )}
          </main>

          {/* Floating Action Button (FAB) */}
          <div className="fab-container">
            <button className="fab-button" onClick={() => setShowTaskModal(true)}>
              <PlusIcon />
            </button>
          </div>

          {/* Bottom Navigation Bar */}
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '800px', padding: '1rem', zIndex: 90 }}>
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-around', padding: '0.75rem', borderRadius: '30px' }}>
              <button onClick={() => setCurrentView('home')} style={{ color: currentView === 'home' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                <HomeIcon />
              </button>
              <button onClick={() => setCurrentView('stats')} style={{ color: currentView === 'stats' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                <BarChartIcon />
              </button>
            </div>
          </div>

          {/* Quick Add Modal */}
          {showTaskModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '90%', maxWidth: '500px', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--border-radius-lg)', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.4rem' }}>Nueva Tarea</h3>
                <TaskInput onAdd={handleAddTask} />
                <button className="btn-text" style={{ marginTop: '1rem', width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }} onClick={() => setShowTaskModal(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .pill-active { background: linear-gradient(135deg, var(--accent-color), #ff719a); color: white; border: none; box-shadow: 0 4px 15px rgba(255, 45, 85, 0.4); }
        .pill-inactive { background: var(--glass-bg); color: var(--text-secondary); border: 1px solid var(--glass-border); backdrop-filter: blur(10px); }
        .pill-inactive:hover { background: var(--bg-color-secondary); color: var(--text-primary); }
      `}</style>
    </div>
  );
}
