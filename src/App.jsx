import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './lib/supabase';
import { I18nProvider, useI18n } from './context/I18nContext';
import { useTasks } from './hooks/useTasks';

import Login from './components/Login';
import Register from './components/Register';
import TaskList from './components/TaskList';
import CategoryCarousel from './components/CategoryCarousel';
import CalendarStrip from './components/CalendarStrip';
import FullCalendar from './components/FullCalendar';
import StatCharts from './components/StatCharts';

import Header from './components/Header';
import TaskInputModal from './components/TaskInputModal';
import QuickAdd from './components/QuickAdd';

const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const PlusIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const HomeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const BarChartIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>;
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;

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

  // App UI State
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', message: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [zenMode, setZenMode] = useState(false);

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

  // Theme & Time Init
  useEffect(() => {
    // 1. System Dark Mode
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark-mode');

    // 2. Time-Based Background 
    const hour = new Date().getHours();
    let timeClass = 'time-evening';
    if (hour >= 5 && hour < 12) timeClass = 'time-morning';
    else if (hour >= 12 && hour < 18) timeClass = 'time-afternoon';

    document.body.classList.add(timeClass);
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark-mode');
  };

  // Use tasks Hook
  const { tasks, loading, addTask, toggleTask, deleteTask, undoDelete, deletedTaskCache } = useTasks(session, showToast, () => addXp(25));

  // Session & Data Fetching
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { initGamification(session.user.id); }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        initGamification(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setXp(0);
        setStreak(0);
      }
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

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setShowTaskModal(true);
  };

  // Mapped & Filtered
  const mappedTasks = useMemo(() => tasks.map(t => ({
    ...t,
    category: t.category || (t.description?.includes('Categoria:') ? t.description.split(': ')[1] : 'other')
  })), [tasks]);

  const filteredTasks = useMemo(() => {
    let list = mappedTasks;

    const targetDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    list = list.filter(t => {
      if (!t.due_date) return true;
      return t.due_date.startsWith(targetDateStr);
    });

    if (activeTab === 'Personal') list = list.filter(t => t.category === 'home' || t.category === 'health');
    if (activeTab === 'Study') list = list.filter(t => t.category === 'study');
    if (activeTab === 'Important') list = list.filter(t => !t.completed && (t.priority === 'high' || t.title.length > 20));
    if (searchQuery) list = list.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [mappedTasks, activeTab, searchQuery, selectedDate]);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  const topPriorityTask = filteredTasks[0];

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.8 },
      colors: ['#ff2d55', '#5e5ce6', '#34c759', '#ffcc00']
    });
  };

  return (
    <div
      className="app-container"
      onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
      onDragLeave={(e) => { if (e.clientY <= 0 || e.clientX <= 0 || (e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) setIsDragActive(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragActive(false);
        const id = e.dataTransfer.getData('taskId');
        if (id) deleteTask(id);
      }}
    >
      {/* HTML5 Drag to Trash Dropzone */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100%',
          height: isDragActive ? '20vh' : '0vh',
          backgroundColor: 'rgba(255, 59, 48, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '800',
          fontSize: '1.5rem',
          transition: 'height 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          overflow: 'hidden',
          zIndex: 9999,
          pointerEvents: 'none'
        }}
      >
        {isDragActive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
            SUELTA AQUÍ PARA ELIMINAR
          </span>
        )}
      </div>

      {/* Toast Alert */}
      {toast.visible && (
        <div className="dynamic-island-container">
          <div className="dynamic-island animate-enter">
            <span style={{ opacity: 0.6, fontWeight: 400 }}>{toast.title}:</span> {toast.message}
          </div>
        </div>
      )}

      {/* Undo Delete Toast */}
      {deletedTaskCache && (
        <div className="dynamic-island-container" style={{ bottom: '2rem', top: 'auto', zIndex: 900 }}>
          <div className="dynamic-island animate-enter" style={{ background: 'var(--bg-color-secondary)', border: '1px solid var(--glass-border)', backdropFilter: 'blur(15px)' }}>
            <span>Elemento Eliminado</span>
            <button
              onClick={undoDelete}
              style={{ marginLeft: '1rem', color: 'var(--accent-color)', fontWeight: 700, padding: '0.4rem 0.8rem', borderRadius: '15px', background: 'rgba(255, 255, 255, 0.1)' }}
            >
              Deshacer
            </button>
          </div>
        </div>
      )}

      {!session ? (
        isRegistering
          ? <Register onToast={showToast} onSwitchToLogin={() => setIsRegistering(false)} toggleTheme={toggleTheme} darkMode={darkMode} />
          : <Login onToast={showToast} onSwitchToRegister={() => setIsRegistering(true)} toggleTheme={toggleTheme} darkMode={darkMode} />
      ) : (
        <>
          <Header
            userName={userName}
            session={session}
            handleSignOut={() => supabase.auth.signOut()}
            toggleTheme={toggleTheme}
            darkMode={darkMode}
            xp={xp}
          />

          {zenMode && topPriorityTask && (
            <div className="zen-mode-overlay" style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(30px)', zIndex: 9999, display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '2rem', animation: 'fadeInZen 0.5s ease-out forwards'
            }}>
              <button
                onClick={() => setZenMode(false)}
                style={{
                  position: 'absolute', top: '2rem', right: '2rem',
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                  color: 'white', padding: '0.6rem 1.2rem', borderRadius: '30px',
                  fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                SALIR DEL ZEN
              </button>

              <h2 style={{ fontSize: '2.5rem', marginBottom: '3rem', textAlign: 'center', color: 'white', letterSpacing: '0.1em' }}>MODO ENFOQUE</h2>

              <div style={{ width: '100%', maxWidth: '600px', pointerEvents: 'auto' }}>
                <TaskItem
                  task={topPriorityTask}
                  onToggle={(id, c) => { toggleTask(id, c, triggerConfetti); if (!c) setTimeout(() => setZenMode(false), 800); }}
                  onDelete={(id) => { deleteTask(id); setTimeout(() => setZenMode(false), 500); }}
                  onEdit={handleEditTask}
                />
              </div>
              <style>{`@keyframes fadeInZen { from { opacity: 0; } to { opacity: 1; } }`}</style>
            </div>
          )}

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
                  <button
                    onClick={() => setZenMode(true)}
                    className="scroll-item pill-inactive"
                    style={{ padding: '0.6rem 1.25rem', borderRadius: '30px', marginRight: '0.75rem', fontWeight: 600, fontSize: '0.9rem', transition: 'all var(--transition-fast)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#bf5af2' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                    Zen
                  </button>
                </div>

                <CalendarStrip onSelectDate={(date) => setSelectedDate(date)} />

                <h3 className="text-title" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{t('todaysTasks')}</h3>
                {tasks.length === 0 && !loading && (
                  <div style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '15px' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>Tus tareas están al día. ¡Empieza tu próxima etapa!</p>
                    <button onClick={loadEngineeringTemplates} className="btn-add" style={{ margin: '0 auto', fontSize: '0.9rem' }}>
                      Cargar Prácticas Base (Ingeniería)
                    </button>
                  </div>
                )}
                <TaskList tasks={filteredTasks} onToggle={(id, c) => toggleTask(id, c, triggerConfetti)} onDelete={deleteTask} onEdit={handleEditTask} />
              </>
            ) : currentView === 'calendar' ? (
              <FullCalendar tasks={mappedTasks} selectedDate={selectedDate} onSelectDate={(d) => { setSelectedDate(d); setCurrentView('home'); }} />
            ) : (
              <StatCharts tasks={mappedTasks} />
            )}
          </main>

          {/* Quick Add Bar (Global bottom pinned) */}
          <QuickAdd onAdd={(title, cat, due) => addTask(title, cat, due)} />

          {/* FAB for Modals */}
          <div className="fab-container">
            <button className="fab-button" onClick={() => { setTaskToEdit(null); setShowTaskModal(true); }}>
              <PlusIcon />
            </button>
          </div>

          {/* Bottom Navigation */}
          <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '800px', padding: '1rem', zIndex: 90 }}>
            <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-around', padding: '0.75rem', borderRadius: '30px', gap: '1rem' }}>
              <button onClick={() => setCurrentView('home')} style={{ color: currentView === 'home' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                <HomeIcon />
              </button>
              <button onClick={() => setCurrentView('calendar')} style={{ color: currentView === 'calendar' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                <CalendarIcon />
              </button>
              <button onClick={() => setCurrentView('stats')} style={{ color: currentView === 'stats' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                <BarChartIcon />
              </button>
            </div>
          </div>

          {showTaskModal && (
            <TaskInputModal
              taskToEdit={taskToEdit}
              onAdd={(title, cat, due) => { addTask(title, cat, due, taskToEdit?.id); setShowTaskModal(false); }}
              onCancel={() => { setShowTaskModal(false); setTaskToEdit(null); }}
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
