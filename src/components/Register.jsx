import { useState } from 'react';
import { supabase } from '../lib/supabase';

// Icons
const MailIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>;

export default function Register({ onToast, onSwitchToLogin }) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return onToast('Error', 'Las contraseñas no coinciden.');
        }
        if (password.length < 6) {
            return onToast('Error', 'La contraseña debe tener al menos 6 caracteres.');
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            onToast('¡Éxito!', 'Te has registrado. Revisa tu correo o inicia sesión ahora.');
            // Opcionalmente redirigir directo
            setTimeout(() => onSwitchToLogin(), 2000);
        } catch (error) {
            onToast('Error', error.message || 'Error durante el registro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h2 className="text-title">Crear Cuenta ✨</h2>
                    <p className="text-subtitle">Únete para desbloquear recompensas y llevar el control.</p>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    <div className="input-group">
                        <div className="input-icon"><MailIcon /></div>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input-field"
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    <div className="input-group">
                        <div className="input-icon"><LockIcon /></div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="Crea una contraseña"
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    <div className="input-group">
                        <div className="input-icon"><LockIcon /></div>
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="input-field"
                            placeholder="Confirma la contraseña"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem', height: '3rem' }}>
                        {loading ? <span className="loader"></span> : 'Registrarse Ahora'}
                    </button>
                </form>

                <p style={{ marginTop: '2rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    ¿Ya eres usuario?{' '}
                    <button onClick={onSwitchToLogin} className="btn-text">
                        Entra aquí
                    </button>
                </p>
            </div>
            {/* 
We reuse the same styles defined in Login.jsx or index.css for cleanliness, 
but if needed we can keep component-scoped ones here too.
The classes: .auth-container, .input-group, .input-icon, .password-toggle, .btn-text, .loader
Will be available if we append them to index.css or if they render exclusively. 
For safety, we redefine the needed ones below. 
*/}
            <style>{`
        .auth-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 85vh;
          padding: 1rem;
        }
        .input-group { position: relative; width: 100%; }
        .input-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); display: flex; align-items: center; pointer-events: none; }
        .input-field { padding-left: 3.5rem !important; padding-right: 3.5rem !important; }
        .password-toggle { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); padding: 0.25rem; border-radius: 50%; }
        .password-toggle:hover { color: var(--text-primary); background-color: var(--bg-color-secondary); }
        .btn-text { color: var(--accent-color); font-weight: 600; }
        .btn-text:hover { text-decoration: underline; }
        .loader { width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
