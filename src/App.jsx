import { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './lib/supabase';
import { I18nProvider, useI18n } from './context/I18nContext';
import { useTasks } from './hooks/useTasks';

import Login from './components/Login';
import Register from './components/Register';
import TaskList from './components/TaskList';
import TaskItem from './components/TaskItem';
import CategoryCarousel from './components/CategoryCarousel';
import CalendarStrip from './components/CalendarStrip';
import FullCalendar from './components/FullCalendar';
import StatCharts from './components/StatCharts';

import Header from './components/Header';
import TaskInputModal from './components/TaskInputModal';
import DayTasksModal from './components/DayTasksModal';

const SearchIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const PlusIcon = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const HomeIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const BarChartIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>;
const CalendarIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>;

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
};

// Profile helpers (Local)
function getLocalProfile(userId) {
  const json = localStorage.getItem(`profile_${userId}`);
  return json ? JSON.parse(json) : { xp: 0, streak: 0, lastLogin: new Date().toDateString(), lastCompletedDate: null };
}
function saveLocalProfile(userId, data) {
  localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
}

// Level & Title System
function getUserTitleAndLevel(xp) {
  if (xp >= 1000) return { level: 4, title: 'Maestro del Tiempo', color: '#bf5af2', accent: 'linear-gradient(135deg, #bf5af2, #ffcc00)' };
  if (xp >= 500) return { level: 3, title: 'Ingeniero Productivo', color: '#5e5ce6', accent: 'linear-gradient(135deg, #5e5ce6, #32ade6)' };
  if (xp >= 200) return { level: 2, title: 'Aprendiz Disciplinado', color: '#32ade6', accent: 'linear-gradient(135deg, #32ade6, #34c759)' };
  return { level: 1, title: 'Novato del Enfoque', color: '#8e8e93', accent: 'linear-gradient(135deg, #ff2d55, #ff719a)' };
}

function AppContent() {
  const { t } = useI18n();
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App UI State
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState({ visible: false, title: '', message: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentView, setCurrentView] = useState('home');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [modalDefaultCategory, setModalDefaultCategory] = useState('other');
  const [isDragActive, setIsDragActive] = useState(false);
  const [zenMode, setZenMode] = useState(false);

  // Day Modal State
  const [showDayModal, setShowDayModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);

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
  const { tasks, loading, addTask, toggleTask, deleteTask, undoDelete, deletedTaskCache, clearCompleted } = useTasks(session, showToast, () => addXp(25));

  // Session & Data Fetching
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { initGamification(session.user.id); }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        initGamification(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setXp(0);
        setStreak(0);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is inside an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setTaskToEdit(null);
        setModalDefaultCategory('other');
        setShowTaskModal(true);
      }
      if (e.key === 'Escape') {
        setShowTaskModal(false);
        setShowDayModal(false);
        setZenMode(false);
        setTaskToEdit(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const initGamification = (userId) => {
    const profile = getLocalProfile(userId);
    const today = new Date().toDateString();
    if (profile.lastLogin !== today) {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      if (profile.lastLogin === yesterday.toDateString()) {
        profile.streak += 1; showToast('¡Racha Mantenida!', `Día ${profile.streak} 🔥`);
      } else {
        if (profile.streak > 1) showToast('Racha Perdida', 'Tu racha se reinició a 1 📉');
        profile.streak = 1;
      }
      profile.lastLogin = today;
      saveLocalProfile(userId, profile);
    }
    setXp(profile.xp); setStreak(profile.streak);

    // Inject level-based CSS variables
    const levelInfo = getUserTitleAndLevel(profile.xp);
    document.documentElement.style.setProperty('--level-accent', levelInfo.accent);
    document.documentElement.style.setProperty('--level-color', levelInfo.color);
  };

  // Smart XP: streak-aware algorithm
  const addXp = (amount) => {
    if (!session) return;
    const profile = getLocalProfile(session.user.id);
    const today = new Date().toDateString();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);

    let xpGain = amount; // Base: +10
    let newStreak = profile.streak;

    if (profile.lastCompletedDate === today) {
      // Same day: just add base XP, no streak change
    } else if (profile.lastCompletedDate === yesterday.toDateString()) {
      // Consecutive day: streak bonus!
      newStreak += 1;
      xpGain += 20; // Bonus for keeping the streak
      showToast('🔥 Racha +1', `${newStreak} días consecutivos (+${xpGain} XP)`);
    } else {
      // Streak broken
      if (newStreak > 1) showToast('📉 Racha reiniciada', 'Empezamos de nuevo');
      newStreak = 1;
    }

    const newXp = profile.xp + xpGain;
    const updatedProfile = { ...profile, xp: newXp, streak: newStreak, lastCompletedDate: today };
    saveLocalProfile(session.user.id, updatedProfile);
    setXp(newXp);
    setStreak(newStreak);

    // Update level CSS dynamically
    const levelInfo = getUserTitleAndLevel(newXp);
    document.documentElement.style.setProperty('--level-accent', levelInfo.accent);
    document.documentElement.style.setProperty('--level-color', levelInfo.color);
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

  const dateFilteredTasks = useMemo(() => {
    return mappedTasks.filter(t => t.due_date ? isSameDay(t.due_date, selectedDate) : isSameDay(new Date(), selectedDate));
  }, [mappedTasks, selectedDate]);

  const filteredTasks = useMemo(() => {
    let list = dateFilteredTasks;

    if (activeTab === 'Personal') list = list.filter(t => t.category === 'home' || t.category === 'health');
    if (activeTab === 'Study') list = list.filter(t => t.category === 'study');
    if (activeTab === 'Important') list = list.filter(t => !t.completed && (t.priority === 'high' || (t.title?.length > 20)));
    if (searchQuery) list = list.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    return list;
  }, [dateFilteredTasks, activeTab, searchQuery]);

  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'User';
  const topPriorityTask = filteredTasks[0];

  const loadEngineeringTemplates = async () => {
    showToast('Cargando Plantillas...', 'Preparando tus tareas de Ingeniería.');
    const templates = [
      { title: 'Revisar Arquitectura del Proyecto', cat: 'work' },
      { title: 'Estudiar Algoritmos Complejos', cat: 'study' },
      { title: 'Completar documentación API', cat: 'work' },
      { title: 'Pausa activa (Hidratación)', cat: 'health' }
    ];
    // Ejecutarlas seguidas
    for (const t of templates) {
      addTask(t.title, t.cat, '');
    }
  };

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

      {authLoading ? (
        <div className="auth-loader-container">
          <div className="loader-spinner"></div>
          <p className="loader-text">Cargando tu espacio...</p>
        </div>
      ) : !session ? (
        isRegistering
          ? <Register onToast={showToast} onSwitchToLogin={() => setIsRegistering(false)} toggleTheme={toggleTheme} darkMode={darkMode} />
          : <Login onToast={showToast} onSwitchToRegister={() => setIsRegistering(true)} toggleTheme={toggleTheme} darkMode={darkMode} />
      ) : (
        <div key={session?.user?.id || 'auth-home'} style={{ display: 'contents' }}>
          <Header
            userName={userName}
            session={session}
            handleSignOut={() => supabase.auth.signOut()}
            toggleTheme={toggleTheme}
            darkMode={darkMode}
            xp={xp}
            streak={streak}
            tasks={tasks}
          />

          {zenMode && (() => {
            const zenTask = filteredTasks.filter(t => !t.completed)[0];
            return zenTask ? (
              <div className="zen-mode-overlay" style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(30px)', zIndex: 9999, display: 'flex',
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
                  SALIR
                </button>

                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>MODO ENFOQUE</p>
                <h2 style={{ fontSize: '2rem', marginBottom: '2.5rem', textAlign: 'center', color: 'white', maxWidth: '500px', lineHeight: 1.4 }}>{zenTask.title}</h2>

                <button
                  onClick={() => { toggleTask(zenTask.id, zenTask.completed, triggerConfetti); setTimeout(() => setZenMode(false), 800); }}
                  style={{
                    padding: '1rem 2.5rem', borderRadius: '50px', fontSize: '1.1rem', fontWeight: 800,
                    background: 'linear-gradient(135deg, var(--accent-color), #ff719a)', color: 'white',
                    border: 'none', cursor: 'pointer', boxShadow: '0 8px 30px rgba(255,45,85,0.5)',
                    transition: 'all 0.3s', letterSpacing: '0.05em'
                  }}
                >
                  ✓ ¡Completar y Volver!
                </button>
                <style>{`@keyframes fadeInZen { from { opacity: 0; } to { opacity: 1; } }`}</style>
              </div>
            ) : null;
          })()}

          {/* Desktop Navigation Bar (Only visible on wide screens) */}
          <div className="desktop-nav">
            <button onClick={() => setCurrentView('home')} className={currentView === 'home' ? 'active' : ''}>
              <HomeIcon /> Inicio
            </button>
            <button onClick={() => setCurrentView('calendar')} className={currentView === 'calendar' ? 'active' : ''}>
              <CalendarIcon /> Calendario
            </button>
            <button onClick={() => setCurrentView('stats')} className={currentView === 'stats' ? 'active' : ''}>
              <BarChartIcon /> Estadísticas
            </button>
          </div>

          <main className="main-content">
            {currentView === 'home' ? (
              <>
                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: '1.5rem', padding: '0 20px' }}>
                  <div style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}><SearchIcon /></div>
                  <input
                    type="text"
                    placeholder={t('searchTasks')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ paddingLeft: '3rem', borderRadius: '30px' }}
                  />
                </div>

                <div className="no-scrollbar" style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                  <CategoryCarousel tasks={dateFilteredTasks} onAddCategoryTask={(catId) => { setModalDefaultCategory(catId); setShowTaskModal(true); }} />
                </div>

                {/* Horizontal Filter Pills */}
                <div className="horizontal-scroll no-scrollbar" style={{ padding: '5px 20px', marginBottom: '1.5rem' }}>
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

                <div className="no-scrollbar" style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
                  <CalendarStrip selectedDate={selectedDate} onSelectDate={(date) => setSelectedDate(date)} />
                </div>

                <div style={{ padding: '0 20px' }}>
                  {(() => {
                    const allPending = filteredTasks.filter(t => !t.completed);
                    const completed = filteredTasks.filter(t => t.completed);

                    // Group pending tasks by date
                    const grouped = {};
                    allPending.forEach(t => {
                      const key = t.due_date ? new Date(t.due_date).toDateString() : '__nodate__';
                      if (!grouped[key]) grouped[key] = [];
                      grouped[key].push(t);
                    });

                    // Sort group keys chronologically, "no date" first
                    const today = new Date();
                    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);

                    const sortedKeys = Object.keys(grouped).sort((a, b) => {
                      if (a === '__nodate__') return -1;
                      if (b === '__nodate__') return 1;
                      return new Date(a) - new Date(b);
                    });

                    const getDateLabel = (key) => {
                      if (key === '__nodate__') return 'Bandeja de Entrada';
                      if (key === today.toDateString()) return 'Hoy';
                      if (key === tomorrow.toDateString()) return 'Mañana';
                      const d = new Date(key);
                      return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                        .replace(/^\w/, c => c.toUpperCase());
                    };

                    if (allPending.length === 0 && !loading && tasks.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', marginTop: '2rem', padding: '2rem', background: 'var(--glass-bg)', border: '1px dashed var(--glass-border)', borderRadius: '15px' }}>
                          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 600 }}>Tus tareas están al día. ¡Empieza tu próxima etapa!</p>
                          <button onClick={loadEngineeringTemplates} className="btn-add" style={{ margin: '0 auto', fontSize: '0.9rem' }}>
                            Cargar Prácticas Base (Ingeniería)
                          </button>
                        </div>
                      );
                    }

                    return (
                      <>
                        {sortedKeys.map(key => (
                          <div key={key} style={{ marginBottom: '1.5rem' }}>
                            <h3 className="text-title" style={{
                              fontSize: key === today.toDateString() ? '1.25rem' : '1.05rem',
                              marginBottom: '0.75rem',
                              display: 'flex', alignItems: 'center', gap: '0.5rem',
                              color: key === '__nodate__' ? 'var(--text-secondary)' : 'var(--text-primary)'
                            }}>
                              {key === '__nodate__' && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                              )}
                              {getDateLabel(key)}
                            </h3>
                            <TaskList tasks={grouped[key]} onToggle={(id, c) => toggleTask(id, c, triggerConfetti)} onDelete={deleteTask} onEdit={handleEditTask} />
                          </div>
                        ))}

                        {/* Section: Completed */}
                        {completed.length > 0 && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <h3 className="text-title" style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>Completadas ({completed.length})</h3>
                              <button
                                onClick={() => { if (confirm('¿Vaciar todas las tareas completadas?')) clearCompleted(); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                                  fontSize: '0.8rem', color: 'var(--danger-color)', fontWeight: 600,
                                  background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255,59,48,0.2)',
                                  padding: '0.4rem 0.8rem', borderRadius: '20px', cursor: 'pointer',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                Vaciar
                              </button>
                            </div>
                            <div style={{ opacity: 0.5 }}>
                              <TaskList tasks={completed} onToggle={(id, c) => toggleTask(id, c, triggerConfetti)} onDelete={deleteTask} onEdit={handleEditTask} />
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            ) : currentView === 'calendar' ? (
              <FullCalendar tasks={mappedTasks} selectedDate={selectedDate} onSelectDate={(d) => { setSelectedDate(d); setCurrentView('home'); }} />
            ) : (
              <StatCharts tasks={mappedTasks} />
            )}
          </main>



          {/* FAB - Protagonista */}
          <button
            className="fab-button-main"
            onClick={() => { setTaskToEdit(null); setModalDefaultCategory('other'); setShowTaskModal(true); }}
          >
            <PlusIcon />
          </button>

          {/* Mobile Bottom Navigation Dock */}
          <nav className="bottom-nav-dock">
            <button className="nav-item" onClick={() => setCurrentView('home')} style={{ color: currentView === 'home' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
              <HomeIcon />
            </button>
            <button className="nav-item" onClick={() => setCurrentView('calendar')} style={{ color: currentView === 'calendar' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
              <CalendarIcon />
            </button>
            <button className="nav-item" onClick={() => setCurrentView('stats')} style={{ color: currentView === 'stats' ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
              <BarChartIcon />
            </button>
          </nav>

          {showTaskModal && (
            <TaskInputModal
              taskToEdit={taskToEdit}
              defaultCategory={modalDefaultCategory}
              onAdd={(title, cat, due) => { addTask(title, cat, due, taskToEdit?.id); setShowTaskModal(false); }}
              onCancel={() => { setShowTaskModal(false); setTaskToEdit(null); }}
            />
          )}

          {showDayModal && (
            <DayTasksModal
              tasks={mappedTasks}
              selectedDate={modalDate}
              onClose={() => setShowDayModal(false)}
              onToggle={(id, c) => toggleTask(id, c, triggerConfetti)}
              onDelete={deleteTask}
              onEdit={handleEditTask}
            />
          )}
        </div>
      )}

      <style>{`
        .auth-loader-container {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
          z-index: 99999; gap: 1.5rem;
        }
        .loader-spinner {
          width: 50px; height: 50px; border: 4px solid var(--glass-border);
          border-top-color: var(--accent-color); border-radius: 50%;
          animation: spin 1s cubic-bezier(0.25, 1, 0.5, 1) infinite;
        }
        .loader-text { font-size: 1.25rem; color: white; font-weight: 600; letter-spacing: 0.05em; text-shadow: 0 4px 10px rgba(0,0,0,0.3); }

        .pill-active { background: linear-gradient(135deg, var(--accent-color), #ff719a); color: white; border: none; box-shadow: 0 4px 15px rgba(255, 45, 85, 0.4); }
        .pill-inactive { background: var(--glass-bg); color: var(--text-secondary); border: 1px solid var(--glass-border); backdrop-filter: blur(10px); }
        .pill-inactive:hover { background: var(--bg-color-secondary); color: var(--text-primary); }

        .fab-button-main {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-color), #ff719a);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(255, 50, 100, 0.6);
          z-index: 100;
          transition: all 0.3s;
          animation: fabPulse 2s infinite;
        }
        .fab-button-main:hover {
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 0 30px rgba(255, 50, 100, 0.8);
        }
        .fab-button-main:active {
          transform: scale(0.95);
        }
        @keyframes fabPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 50, 100, 0.6); }
          50% { box-shadow: 0 0 35px rgba(255, 50, 100, 0.9); }
        }
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
