import { useState, useEffect, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SendIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>;
const BulbIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" /></svg>;
const BotIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M12 8v4" /><path d="M8 12h0" /><path d="M16 12h0" /></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 0 0-16 0" /></svg>;

export default function TaskChatModal({ task, onClose }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [chatSession, setChatSession] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        // Auto-scroll to bottom
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        // Initialize Gemini Chat Session via standard startChat
        const initChat = async () => {
            try {
                const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
                if (!apiKey) {
                    setMessages([{ role: 'model', text: 'Error: API Key de Gemini no encontrada en .env' }]);
                    return;
                }

                setIsTyping(true);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({
                    model: "gemini-1.5-flash",
                    systemInstruction: `Eres un asistente de productividad empático y motivador. Tu objetivo es ayudar al usuario con la siguiente tarea: "${task.title}". ${task.description ? 'Contexto adicional: ' + task.description : ''} 
Saluda al usuario y ofrécele ayuda para iniciar o destrabarse. Sé conciso, no uses formato Markdown complejo y mantén un tono conversacional amigable.`
                });

                const session = model.startChat({
                    history: [],
                    generationConfig: {
                        maxOutputTokens: 800,
                    },
                });

                setChatSession(session);

                // Send a local initial trigger to save API Quota
                const initialGreeting = `¡Hola! Veo que estás trabajando en "${task.title}". ¿En qué te puedo ayudar para empezar o destrabarte?`;
                setMessages([{ role: 'model', text: initialGreeting, id: Date.now() }]);
                setIsTyping(false);

                // Focus input
                setTimeout(() => inputRef.current?.focus(), 100);

            } catch (error) {
                console.error("Error iniciando chat:", error);
                setMessages([{ role: 'model', text: 'Ups, no me pude conectar al Asistente IA. Revisa tu conexión de red o API Key.', id: Date.now() }]);
                setIsTyping(false);
            }
        };

        initChat();
    }, [task]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !chatSession || isTyping) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage, id: Date.now() }]);
        setIsTyping(true);

        try {
            const result = await chatSession.sendMessage(userMessage);
            const botResponse = result.response.text();
            setMessages(prev => [...prev, { role: 'model', text: botResponse, id: Date.now() }]);
        } catch (error) {
            console.error("Error enviando mensaje:", error);
            setMessages(prev => [...prev, { role: 'model', text: 'Error al comunicarse con la IA. Vuelve a intentarlo.', id: Date.now(), isError: true }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4 animate-enter"
            onClick={onClose}
        >

            {/* Modal Container: Bottom Sheet on Mobile, Centered Floater on Desktop */}
            <div
                className="w-full h-[85vh] md:w-[500px] md:h-[600px] bg-[#14141e]/90 border border-white/10 rounded-t-3xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile handle indicator */}
                <div className="md:hidden bg-white/30 w-10 h-1 rounded-full mx-auto mt-3 mb-1"></div>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(255, 204, 0, 0.15)', color: '#ffcc00', padding: '0.4rem', borderRadius: '12px', display: 'flex' }}>
                            <BulbIcon />
                        </div>
                        <div>
                            <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Asistente IA</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{task.title}</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="close-btn" style={{ position: 'relative', top: 0, right: 0, padding: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Chat Area */}
                <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {messages.map((msg, index) => (
                        <div key={msg.id || index} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>

                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', maxWidth: '85%' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, rgba(255,204,0,0.2), rgba(191,90,242,0.2))',
                                    color: msg.role === 'user' ? 'rgba(255,255,255,0.8)' : '#bf5af2'
                                }}>
                                    {msg.role === 'user' ? <UserIcon /> : <BotIcon />}
                                </div>

                                <div style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    background: msg.role === 'user' ? 'linear-gradient(135deg, #5e5ce6, #bf5af2)' : 'rgba(255,255,255,0.1)',
                                    color: msg.isError ? '#ff3b30' : 'white',
                                    fontSize: '0.9rem',
                                    lineHeight: 1.5,
                                    whiteSpace: 'pre-wrap',
                                    wordWrap: 'break-word',
                                    boxShadow: msg.role === 'user' ? '0 4px 15px rgba(94, 92, 230, 0.3)' : 'none'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start', maxWidth: '85%' }}>
                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,204,0,0.2), rgba(191,90,242,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bf5af2' }}><BotIcon /></div>
                            <div style={{ padding: '0.75rem 1rem', borderRadius: '20px 20px 20px 4px', background: 'rgba(255,255,255,0.05)', display: 'flex', gap: '4px' }}>
                                <span className="dot-typing"></span>
                                <span className="dot-typing" style={{ animationDelay: '0.2s' }}></span>
                                <span className="dot-typing" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                    <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            placeholder="Escribe tu pregunta..."
                            rows={1}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '0.75rem 1rem',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                outline: 'none',
                                resize: 'none',
                                maxHeight: '120px',
                                minHeight: '44px',
                                fontFamily: 'inherit',
                                lineHeight: 1.4
                            }}
                            // Auto-resize
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                            }}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            style={{
                                background: input.trim() ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                width: '44px', height: '44px',
                                borderRadius: '50%',
                                border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0,
                                cursor: input.trim() ? 'pointer' : 'not-allowed',
                                transition: 'all 0.2s',
                                boxShadow: input.trim() ? '0 4px 15px rgba(255, 45, 85, 0.4)' : 'none'
                            }}
                        >
                            <SendIcon />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
