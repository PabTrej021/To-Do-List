import { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import useSound from 'use-sound';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../lib/supabase';

const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="check-svg"><path d="M20 6 9 17l-5-5" /></svg>;
const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>;
const CheckCircleIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
const PencilIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
const TimerIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const FocusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>;
const SparklesIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" /><path d="M20 3v4" /><path d="M22 5h-4" /><path d="M4 17v2" /><path d="M5 18H3" /></svg>;
const BulbIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>;
const SpinnerIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spinA 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;

// Base64 short pop sound for completion - Replaced directly with Web Audio API

const getTimeRemaining = (dueDate) => {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due - now;

  if (diffMs < 0) return { text: 'Vencida ⚠️', color: '#ff3b30', urgent: true };

  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHrs > 24) return { text: `${Math.floor(diffHrs / 24)}d restantes`, color: '#34c759', urgent: false };
  if (diffHrs > 0) return { text: `${diffHrs}h ${diffMins}m`, color: '#ffcc00', urgent: false };
  return { text: `${diffMins}m 🔥`, color: '#ff3b30', urgent: true };
};

export default function TaskItem({
  task, onToggle, onDelete, onEdit, onFocus,
  onToggleSubtask, onUpdateSubtask, onDeleteSubtask, onSaveAiNotes
}) {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteInline, setConfirmDeleteInline] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 }); // 3D Tilt Effect
  const [isThinking, setIsThinking] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);

  const handleAIBreakdown = async (e) => {
    e.stopPropagation();
    if (isThinking) return;
    setIsThinking(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key de Gemini no encontrada. Verifica tu archivo .env");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Eres un experto en productividad. Divide esta tarea en 3 pasos pequeños y accionables. Tarea: '${task.title}'. Responde ÚNICAMENTE con un arreglo de strings en formato JSON válido, sin Markdown extra ni comillas invertidas. Ejemplo: ["Paso 1", "Paso 2", "Paso 3"]`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      // Limpiar markdown si Gemini lo inyecta
      const jsonString = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const steps = JSON.parse(jsonString);

      if (!Array.isArray(steps)) throw new Error("El formato devuelto no es un arreglo válido.");

      const { data: { session } } = await supabase.auth.getSession();

      const subtasksToInsert = steps.map(paso => ({
        task_id: task.id,
        title: paso,
        completed: false
      }));

      await supabase.from('subtasks').insert(subtasksToInsert);
    } catch (err) {
      console.error("Error en AI Breakdown:", err);
      alert("Error al desglosar tarea: " + err.message);
    } finally {
      setIsThinking(false);
    }
  };

  const handleAICoach = async (e) => {
    e.stopPropagation();
    if (isCoaching) return;
    setIsCoaching(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key de Gemini no encontrada.");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Dame 2 consejos muy breves, prácticos y motivadores para empezar esta tarea: "${task.title}". Devuélvelos sin saludos, directo al grano.`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().trim();

      if (onSaveAiNotes) onSaveAiNotes(task.id, responseText);
    } catch (err) {
      console.error("Error en AI Coach:", err);
      alert("Error pidiendo consejo a la IA: " + err.message);
    } finally {
      setIsCoaching(false);
    }
  };

  const touchStartRef = useRef(null);
  const itemRef = useRef(null);

  // Pomodoro local state
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isPomodoroRunning && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime(prev => prev - 1), 1000);
    } else if (pomodoroTime === 0 && isPomodoroRunning) {
      setIsPomodoroRunning(false);
      triggerHaptic([100, 100, 100, 100]); // intense success buzz
      playSound();
    }
    return () => clearInterval(interval);
  }, [isPomodoroRunning, pomodoroTime]);

  const SWIPE_LEFT_THRESHOLD = -80;
  const SWIPE_RIGHT_THRESHOLD = 80;

  const triggerHaptic = (pattern = 50) => {
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(pattern);
  };

  const playSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log("Web Audio not supported or blocked", e);
    }
  };

  const [playComplete] = useSound('/sounds/complete.mp3', { volume: 0.5 });
  const [playSwoosh] = useSound('/sounds/swoosh.mp3', { volume: 0.5 });

  const handleToggle = () => {
    if (!task.completed) {
      playSound(); // Fallback web audio
      playComplete();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff2d55', '#bf5af2', '#ffcc00', '#32ade6', '#34c759']
      });
    } else {
      playSwoosh();
    }
    triggerHaptic(task.completed ? 30 : [30, 50, 30]);
    onToggle(task.id, task.completed);
    setSwipeOffset(0);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    triggerHaptic([50, 50, 50]);
    setTimeout(() => {
      onDelete(task.id);
    }, 300);
  };

  // Touch Events
  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartRef.current;

    if (diff < 0) {
      setSwipeOffset(diff < SWIPE_LEFT_THRESHOLD ? SWIPE_LEFT_THRESHOLD + (diff - SWIPE_LEFT_THRESHOLD) * 0.2 : diff);
    } else if (diff > 0) {
      setSwipeOffset(diff > SWIPE_RIGHT_THRESHOLD ? SWIPE_RIGHT_THRESHOLD + (diff - SWIPE_RIGHT_THRESHOLD) * 0.2 : diff);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (swipeOffset <= SWIPE_LEFT_THRESHOLD + 20) {
      setSwipeOffset(SWIPE_LEFT_THRESHOLD);
      triggerHaptic(20);
    } else if (swipeOffset >= SWIPE_RIGHT_THRESHOLD - 20) {
      handleToggle();
      setSwipeOffset(0);
    } else {
      setSwipeOffset(0);
    }
    touchStartRef.current = null;
  };

  // Extract from description (since we don't have DB schemas for these yet)
  const tagClass = `tag-${task.category ? task.category.toLowerCase() : 'other'}`;

  // Randomize priority if not set (Mock logic for priority badges depending roughly on title length, just to show UI)
  const priority = task.priority || (task.title?.length > 20 ? 'high' : task.title?.length > 10 ? 'medium' : 'low');

  // Random Progress if not set (Mock logic for UI display)
  const rawProgress = task.progress || (Math.random() * 100);
  const progress = task.completed ? 100 : rawProgress;

  return (
    <div className={`task-wrapper ${isDeleting ? 'deleting' : ''}`} ref={itemRef}>

      {/* Background Actions */}
      <div className="task-actions-bg">
        <div className="bg-action-complete" style={{ opacity: swipeOffset > 20 ? 1 : 0 }}>
          <CheckCircleIcon />
          <span>{task.completed ? '- Deshacer' : '+ Completar'}</span>
        </div>
        <div className="bg-action-delete" style={{ opacity: swipeOffset < -20 ? 1 : 0 }}>
          <button onClick={handleDelete} className="delete-btn">
            <TrashIcon />
            <span>Eliminar</span>
          </button>
        </div>
      </div>

      {/* Foreground Task Card */}
      <div
        className={`task-card glass-panel ${task.completed ? 'completed' : ''} ${tagClass}`}
        style={{
          transform: `translateX(${swipeOffset}px) perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button className="task-checkbox" onClick={handleToggle}>
          {task.completed && <CheckIcon />}
        </button>

        <div className="task-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '1rem', flex: 1, minWidth: 0 }}>
              <p className="task-title">{task.title}</p>
              {task.description && (
                <p className="task-description" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', marginBottom: '8px', lineHeight: '1.4' }}>
                  {task.description}
                </p>
              )}

              {/* AI Coaching Box */}
              {task.ai_notes && (
                <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', padding: '0.75rem', borderRadius: '12px', backgroundColor: 'rgba(191,90,242,0.1)', border: '1px solid rgba(191,90,242,0.3)', color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', lineHeight: 1.5, animation: 'fadeIn 0.5s ease-out' }}>
                  <div style={{ color: '#bf5af2', fontWeight: 'bold', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <BulbIcon /> Consejo AI
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{task.ai_notes}</div>
                </div>
              )}

              {/* Nested Subtasks Loop */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="subtasks-container" style={{ marginLeft: '15px', marginTop: '15px', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '10px', minWidth: 0 }}>
                  {task.subtasks.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map(subtask => (
                    <div key={subtask.id} className="subtask-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', width: '100%', minWidth: 0 }}>
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => onToggleSubtask(subtask.id, subtask.completed)}
                        style={{ accentColor: 'var(--accent-color)', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                      />
                      <textarea
                        value={subtask.title}
                        rows={1}
                        onChange={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          onUpdateSubtask(subtask.id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        ref={(el) => {
                          if (el) {
                            el.style.height = 'auto';
                            el.style.height = el.scrollHeight + 'px';
                          }
                        }}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          width: '100%',
                          background: 'transparent',
                          border: 'none',
                          color: subtask.completed ? 'rgba(255,255,255,0.4)' : '#fff',
                          textDecoration: subtask.completed ? 'line-through' : 'none',
                          fontSize: '13px',
                          fontFamily: 'inherit',
                          outline: 'none',
                          resize: 'none',
                          overflow: 'hidden',
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          lineHeight: '1.4',
                          padding: 0,
                          marginTop: '2px'
                        }}
                      />
                      {/* Botón sutil para eliminar subtarea */}
                      <button onClick={(e) => { e.stopPropagation(); onDeleteSubtask(subtask.id); }} style={{ background: 'none', border: 'none', color: 'rgba(255,60,60,0.6)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem' }}>
                        <TrashIcon width="14" height="14" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {task.due_date && (
                <span className="task-date-badge" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '6px' }}>
                  📅 {new Date(task.due_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              )}
            </div>
            {/* Priority Badge, Countdown, Edit & Delete */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
              {!task.completed && (() => {
                const countdown = getTimeRemaining(task.due_date);
                return countdown ? (
                  <span style={{
                    fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px',
                    fontWeight: 700, letterSpacing: '0.03em',
                    backgroundColor: `${countdown.color}20`,
                    color: countdown.color,
                    border: `1px solid ${countdown.color}40`,
                    animation: countdown.urgent ? 'pulse 2s infinite' : 'none',
                    whiteSpace: 'nowrap'
                  }}>
                    {countdown.text}
                  </span>
                ) : null;
              })()}
              {!task.completed && (
                <span className={`priority-badge priority-${priority}`}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
              )}
              {/* Pomodoro, Edit, Focus & Inline Delete (Hover on Desktop) */}
              {confirmDeleteInline ? (
                <div style={{ display: 'flex', gap: '0.4rem', animation: 'fadeIn 0.2s ease-out' }}>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteInline(false); }} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.3rem 0.5rem', borderRadius: '8px', color: '#fff', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    ❌ Cancelar
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} style={{ background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.4)', padding: '0.3rem 0.5rem', borderRadius: '8px', color: '#ff3b30', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', boxShadow: '0 0 10px rgba(255,59,48,0.2)' }}>
                    ✅ Eliminar
                  </button>
                </div>
              ) : (
                <div className="hover-actions" style={{ display: 'flex', gap: '0.4rem' }}>
                  {!task.completed && (
                    <>
                      <button className="edit-btn" onClick={handleAICoach} aria-label="Pedir Consejo AI" style={{ color: '#ffcc00', borderColor: 'rgba(255, 204, 0, 0.3)' }}>
                        {isCoaching ? <SpinnerIcon /> : <BulbIcon />}
                      </button>
                      <button className="edit-btn" onClick={handleAIBreakdown} aria-label="Desglose Inteligente" style={{ color: '#bf5af2', borderColor: 'rgba(191, 90, 242, 0.3)' }}>
                        {isThinking ? <SpinnerIcon /> : <SparklesIcon />}
                      </button>
                    </>
                  )}
                  {onFocus && (
                    <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onFocus(task); }} aria-label="Modo Enfoque">
                      <FocusIcon />
                    </button>
                  )}
                  <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setShowPomodoro(!showPomodoro); }} aria-label="Pomodoro">
                    <TimerIcon />
                  </button>
                  <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(task); }} aria-label="Editar tarea">
                    <PencilIcon />
                  </button>
                  <button className="edit-btn" onClick={(e) => { e.stopPropagation(); setConfirmDeleteInline(true); }} aria-label="Eliminar tarea" style={{ color: '#ff3b30' }}>
                    <TrashIcon width="16" height="16" />
                  </button>
                </div>
              )}
            </div>
          </div>



          {/* Pomodoro Timer Feature */}
          {showPomodoro && (
            <div style={{ marginTop: '0.2rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--glass-border)' }}>
              <span style={{ fontWeight: 800, color: isPomodoroRunning ? 'var(--accent-color)' : 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                {isPomodoroRunning && <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', animation: 'pulseMic 1s infinite' }}></span>}
                {Math.floor(pomodoroTime / 60).toString().padStart(2, '0')}:{(pomodoroTime % 60).toString().padStart(2, '0')}
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setIsPomodoroRunning(!isPomodoroRunning)} style={{ background: isPomodoroRunning ? 'var(--glass-bg)' : 'var(--accent-color)', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: isPomodoroRunning ? 'var(--text-primary)' : 'white', border: isPomodoroRunning ? '1px solid var(--glass-border)' : 'none', cursor: 'pointer' }}>
                  {isPomodoroRunning ? 'Pausar' : 'Iniciar'}
                </button>
                <button onClick={() => { setIsPomodoroRunning(false); setPomodoroTime(25 * 60); }} style={{ background: 'transparent', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Inline Progress Bar */}
          <div className="task-progress-track">
            <div className="task-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <style>{`
        .task-wrapper { position: relative; width: 100%; overflow: hidden; margin-bottom: 0.85rem; transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1); border-radius: var(--border-radius-lg); }
        .task-wrapper.deleting { opacity: 0; transform: scale(0.9) translateX(-100%); height: 0; margin-bottom: 0; }
        .task-actions-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; justify-content: space-between; border-radius: var(--border-radius-lg); overflow: hidden; }
        .bg-action-complete { background-color: var(--success-color); color: white; display: flex; align-items: center; padding-left: 1.5rem; width: 50%; font-weight: 700; font-size: 0.85rem; gap: 0.5rem; transition: opacity var(--transition-fast); }
        .bg-action-delete { background-color: var(--danger-color); color: white; display: flex; align-items: center; justify-content: flex-end; padding-right: 1.5rem; width: 50%; transition: opacity var(--transition-fast); }
        .delete-btn { color: white; display: flex; flex-direction: column; align-items: center; gap: 0.15rem; font-size: 0.8rem; font-weight: 700; }
        .task-card { position: relative; z-index: 10; display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem 1.5rem; min-height: 80px; cursor: grab; border-left: 4px solid transparent; }
        .task-card:active { cursor: grabbing; }

        .tag-health { border-left-color: var(--tag-health); box-shadow: -2px 0 10px rgba(255, 59, 48, 0.2); }
        .tag-work { border-left-color: var(--tag-work); box-shadow: -2px 0 10px rgba(94, 92, 230, 0.2); }
        .tag-home { border-left-color: var(--tag-home); box-shadow: -2px 0 10px rgba(255, 204, 0, 0.2); }
        .tag-study { border-left-color: var(--tag-study); box-shadow: -2px 0 10px rgba(50, 173, 230, 0.2); }
        .tag-other { border-left-color: var(--tag-other); }

        .task-checkbox { flex-shrink: 0; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid var(--text-secondary); display: flex; align-items: center; justify-content: center; transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); color: white; background-color: transparent; margin-top: 0.25rem; }
        .task-card.completed .task-checkbox { background-color: var(--success-color); border-color: var(--success-color); box-shadow: 0 0 15px rgba(52, 199, 89, 0.6); transform: scale(1.1); }
        .check-svg { stroke-dasharray: 24; stroke-dashoffset: 24; animation: drawCheck 0.4s 0.1s forwards ease-out; }
        @keyframes drawCheck { to { stroke-dashoffset: 0; } }

        .task-content { flex: 1; min-width: 0; }
        .task-title { font-weight: 600; font-size: 1.05rem; color: var(--text-primary); transition: all var(--transition-normal); word-wrap: break-word; overflow-wrap: break-word; }
        .task-description { font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; margin-bottom: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        /* Badges */
        .priority-badge { font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
        .priority-high { background-color: rgba(255, 59, 48, 0.15); color: #ff3b30; border: 1px solid rgba(255,59,48,0.3); }
        .priority-medium { background-color: rgba(50, 173, 230, 0.15); color: #32ade6; border: 1px solid rgba(50,173,230,0.3); }
        .priority-low { background-color: rgba(52, 199, 89, 0.15); color: #34c759; border: 1px solid rgba(52,199,89,0.3); }

        /* Inline Progress */
        .task-progress-track { width: 100%; height: 4px; background-color: var(--bg-color-secondary); border-radius: 99px; overflow: hidden; }
        .task-progress-fill { height: 100%; background: linear-gradient(90deg, var(--accent-color), #ffcc00); border-radius: 99px; transition: width 0.8s ease-out; }

        /* Edit Button */
        .edit-btn { background: var(--bg-color-secondary); border: 1px solid var(--glass-border); color: var(--text-secondary); border-radius: 8px; padding: 0.35rem; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all var(--transition-fast); }
        .edit-btn:hover { color: var(--accent-color); background: var(--glass-bg); transform: scale(1.05); }

        /* Hover Inteligente para Escritorio */
        @media (hover: hover) and (pointer: fine) {
          .hover-actions {
            opacity: 0;
            transform: translateX(10px);
            transition: all 0.3s ease;
          }
          .task-card:hover .hover-actions {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .task-card.completed .task-title, .task-card.completed .task-description { color: var(--text-secondary); text-decoration: line-through; opacity: 0.5; }
        .task-card.completed .task-progress-fill { background: var(--text-secondary); }
        @keyframes spinA { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
