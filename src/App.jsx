import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { I18nProvider, useI18n } from './context/I18nContext';

import Login from './components/Login';
import Register from './components/Register';
import TaskList from './components/TaskList';
import CategoryCarousel from './components/CategoryCarousel';
import CalendarStrip from './components/CalendarStrip';
import StatCharts from './components/StatCharts';

import Header from './components/Header';
import TaskInputModal from './components/TaskInputModal';
import QuickAdd from './components/QuickAdd';

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

function AppContent() {
  const { t } = useI18n();
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // App UI State
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', message: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Dashboard Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Gamification
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);

  // Show Toast
  const showToast = useCallback((title, message) => {
    setToast({ visible: true, title, message });
    if (window.navigator?.vibrate) window.navigator.vibrate(20);
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3500);
  }, []);

  // Theme Init
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark-mode');
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark-mode');
  };

  // Session & Data Fetching
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
  const handleAddTask = async (title, category, dueDate) => {
    const newTask = {
      id: crypto.randomUUID(),
      title,
      description: `Categoria: ${category}`,
      priority: title.length > 20 ? 'high' : 'medium',
      progress: 0,
      completed: false,
      user_id: session?.user?.id,
      created_at: new Date().toISOString(),
      due_date: dueDate || null
    };
    newTask.category = category;

    setTasks(prev => [newTask, ...prev]);
    showToast(t('add'), t('onTrack'));
    setShowTaskModal(false);

    if (session) {
      const { error } = await supabase.from('tasks').insert([{
        id: newTask.id,
        title,
        description: category,
        user_id: newTask.user_id,
        due_date: newTask.due_date
      }]);
      if (error && error.code !== '42P01') console.warn('Supabase Insert Error:', error);
    }
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

  // Mapped & Filtered
  const mappedTasks = useMemo(() => tasks.map(t => ({
    ...t,
    category: t.category || (t.description?.includes('Categoria:') ? t.description.split(': ')[1] : 'other')
  })), [tasks]);

  const filteredTasks = useMemo(() => {
    let list = mappedTasks;
    if (activeTab === 'Personal') list = list.filter(t => t.category === 'home' || t.category === 'health');
    if (activeTab === 'Study') list = list.filter(t => t.category === 'study');
    if (activeTab === 'Important') list = list.filter(t => !t.completed && (t.priority === 'high' || t.title.length > 20));
    if (searchQuery) list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [mappedTasks, activeTab, searchQuery]);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';

  if (loading && !session) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('loading')}</div>;

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
          <Header
            userName={userName}
            handleSignOut={() => supabase.auth.signOut()}
            toggleTheme={toggleTheme}
            darkMode={darkMode}
          />

          <main style={{ paddingBottom: '7rem' }}>
            {currentView === 'home' ? (
              <>
                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><SearchIcon /></div>
                  <input
                    type="text"
                    placeholder={t('searchTasks')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '3rem', borderRadius: '30px' }}
                  />
                </div>

                <CategoryCarousel tasks={mappedTasks} onAddCategoryTask={(catId) => setShowTaskModal(true)} />

                {/* Horizontal Filter Pills */}
                <div className="horizontal-scroll" style={{ paddingBottom: '0.25rem', marginBottom: '1.5rem' }}>
                  {['All', 'Personal', 'Study', 'Important'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`scroll-item ${activeTab === tab ? 'pill-active' : 'pill-inactive'}`}
                      style={{ padding: '0.6rem 1.25rem', borderRadius: '30px', marginRight: '0.75rem', fontWeight: 600, fontSize: '0.9rem', transition: 'all var(--transition-fast)' }}
                    >
                      {t(tab.toLowerCase()) || tab}
                    </button>
                  ))}
                </div>

                <CalendarStrip onSelectDate={(date) => setSelectedDate(date)} />

                <h3 className="text-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('todaysTasks')}</h3>
                <TaskList tasks={filteredTasks} onToggle={handleToggleTask} onDelete={handleDeleteTask} />
              </>
            ) : (
              <StatCharts tasks={mappedTasks} />
            )}
          </main>

          {/* Quick Add Bar (Global bottom pinned) */}
          <QuickAdd onAdd={handleAddTask} />

          {/* FAB for Modals */}
          <div className="fab-container">
            <button className="fab-button" onClick={() => setShowTaskModal(true)}>
              <PlusIcon />
            </button>
          </div>

          {/* Bottom Navigation */}
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '800px', padding: '1rem', zIndex: 90 }}>
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-around', padding: '0.75rem', borderRadius: '30px', gap: '3rem' }}>
              <button onClick={() => setCurrentView('home')} style={{ color: currentView === 'home' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                <HomeIcon />
              </button>
              <button onClick={() => setCurrentView('stats')} style={{ color: currentView === 'stats' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                <BarChartIcon />
              </button>
            </div>
          </div>

          {showTaskModal && (
            <TaskInputModal
              onAdd={handleAddTask}
              onCancel={() => setShowTaskModal(false)}
            />
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

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
