import { useState } from 'react';
import { supabase } from '../lib/supabase';

// SVG Icons Inline for Zero Dependencies
const MailIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
);
const LockIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);

export default function Auth({ onToast }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                onToast('Success', 'Registro exitoso. Verifica tu correo.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onToast('Success', '¡Bienvenido de nuevo!');
            }
        } catch (error) {
            onToast('Error', error.message || 'Error de autenticación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
                <h2 className="text-title" style={{ marginBottom: '0.25rem' }}>
                    {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </h2>
                <p className="text-subtitle" style={{ marginBottom: '2rem' }}>
                    {isSignUp ? 'Organiza tu día con nosotros' : 'Continúa donde lo dejaste'}
                </p>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group">
                        <div className="input-icon"><MailIcon /></div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="correo@ejemplo.com"
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>

                    <div className="input-group">
                        <div className="input-icon"><LockIcon /></div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            style={{ paddingLeft: '3rem' }}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Cargando...' : isSignUp ? 'Registrarse' : 'Entrar'}
                    </button>
                </form>

                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="btn-text"
                >
                    {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
            </div>

            <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
        }
        .input-group {
          position: relative;
          width: 100%;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
        }
        .btn-text {
          margin-top: 1.5rem;
          color: var(--accent-color);
          font-weight: 500;
          font-size: 0.9rem;
        }
        .btn-text:hover { color: var(--accent-color-hover); }
      `}</style>
        </div>
    );
}
