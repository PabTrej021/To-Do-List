import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './lib/supabase';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskInput from './components/TaskInput';
import { Toaster, toast } from 'react-hot-toast';
import { Sun, Moon, LogOut, Search } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

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
    if (isDark) document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Supabase Data Management
  const fetchTasks = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('order_index', { ascending: true }); // We'll assume an order_index column

      // If table doesn't exist yet, we catch error but don't crash
      if (error && error.code !== '42P01') throw error;

      setTasks(data || []);
    } catch (error) {
      console.log('Using local state, Supabase table might not be ready:', error.message);
      // Fallback for demo without DB
    } finally {
      setLoading(false);
    }
  };

  // Real-time Subscription
  useEffect(() => {
    if (!session?.user) return;

    const channel = supabase.channel('postgres_changes')
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
            if (exists) return prev; // Optimistic update already handled it
            return [...prev, payload.new].sort((a, b) => a.order_index - b.order_index);
          });
        }
        if (payload.eventType === 'UPDATE') {
          setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t).sort((a, b) => a.order_index - b.order_index));
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


  // Actions
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleAddTask = async (title) => {
    const newTask = {
      id: crypto.randomUUID(), // Optimistic ID
      title,
      completed: false,
      user_id: session?.user?.id,
      order_index: tasks.length,
      created_at: new Date().toISOString()
    };

    // Optimistic Update
    setTasks(prev => [...prev, newTask]);

    if (session) {
      try {
        const { error } = await supabase.from('tasks').insert([newTask]);
        if (error) {
          // Rollback logic could go here
          if (error.code !== '42P01') toast.error('Error al guardar tarea');
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleToggleTask = async (id, currentCompleted) => {
    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentCompleted } : t));

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

    if (session) {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error && error.code !== '42P01') throw error;
      } catch (err) {
        console.log("Error deleting:", err);
      }
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(filteredTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update index for all shifted items
    const updatedTasks = items.map((t, index) => ({ ...t, order_index: index }));

    // Update local state (Optimistic)
    // We map back to the original full tasks array by matching IDs
    const newFullTasks = tasks.map(t => {
      const updated = updatedTasks.find(ut => ut.id === t.id);
      return updated ? updated : t;
    });

    setTasks(newFullTasks);

    if (session) {
      try {
        // En un caso real masivo, querrías una función RPC para reordenamiento de backend.
        // Aquí hacemos upsert en batch o updates individuales.
        const updates = updatedTasks.map(t => ({ id: t.id, order_index: t.order_index }));
        const { error } = await supabase.from('tasks').upsert(updates, { onConflict: 'id', ignoreDuplicates: false });
        // Ignoramos error de tabla no existente en demo
      } catch (e) {
        console.log(e);
      }
    }
  };

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading && !session) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (!session) {
    return (
      <div className="dark:bg-slate-900 min-h-screen transition-colors duration-300">
        <Toaster position="top-center" />
        <div className="absolute top-4 right-4 focus:outline-none">
          <button onClick={toggleTheme} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 pb-20">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            TaskMaster Pro
          </h1>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar... (Cmd+K)"
                className="pl-9 pr-4 py-2 text-sm rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-none focus:ring-2 focus:ring-blue-500 outline-none w-48 lg:w-64 transition-all"
              />
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <button onClick={handleSignOut} className="p-2 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-500 transition-colors" title="Cerrar sesión">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Search Mobile */}
        <div className="sm:hidden relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tareas..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
        </div>

        <Dashboard tasks={tasks} />

        {/* List Section */}
        <section className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-3xl p-4 md:p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Tus Tareas</h2>
            <TaskInput onAdd={handleAddTask} />
          </div>

          <TaskList
            tasks={filteredTasks}
            onToggle={handleToggleTask}
            onDelete={handleDeleteTask}
            onDragEnd={handleDragEnd}
          />
        </section>
      </main>

    </div>
  );
}
