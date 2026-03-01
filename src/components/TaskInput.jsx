import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Plus } from 'lucide-react';

export default function TaskInput({ onAdd }) {
    const [title, setTitle] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Inicializar Web Speech API
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'es-ES'; // Podría ser configurado dinámicamente

            recognition.onresult = (event) => {
                const transcript = event.results[event.results.length - 1][0].transcript;
                setTitle((prev) => (prev ? prev + ' ' + transcript : transcript));
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleListen = () => {
        if (isListening) {
            recognitionRef.current?.stop();
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            onAdd(title.trim());
            setTitle('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <div className="flex-1 flex items-center gap-2 pl-3">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="¿Qué necesitas hacer hoy? (Cmd+K para enfocar buscar)"
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none"
                />
            </div>

            {recognitionRef.current && (
                <button
                    type="button"
                    onClick={toggleListen}
                    className={`p-3 rounded-xl transition-colors ${isListening
                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 animate-pulse'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    title="Dictar por voz"
                >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
            )}

            <button
                type="submit"
                disabled={!title.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Plus className="w-5 h-5" />
            </button>
        </form>
    );
}
