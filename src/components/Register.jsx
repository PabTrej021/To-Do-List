import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../context/I18nContext';

const MailIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const LockIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const EyeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>;
const EyeOffIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

export default function Register({ onToast, onSwitchToLogin }) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!firstName.trim() || !lastName.trim()) return onToast('Error', 'Debes introducir tu nombre y apellido.');
        if (password.length < 6) return onToast('Error', 'Mínimo 6 caracteres.');
        if (password !== confirmPassword) return onToast('Error', 'Las contraseñas no coinciden.');

        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: `${firstName} ${lastName}`.trim()
                    }
                }
            });

            if (error) throw error;

            // If we don't have a session immediately, might need email confirm
            if (data?.user && !data?.session) {
                onToast('Revisa tu correo', 'Te hemos enviado un enlace.');
                onSwitchToLogin();
            } else {
                onToast('¡Bienvenido!', 'Registro exitoso.');
            }
        } catch (error) {
            onToast('Error', error.message || 'Error al crear cuenta.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="blob blob-purple" style={{ top: '10%', left: '10%' }}></div>
            <div className="blob blob-orange" style={{ bottom: '20%', right: '10%' }}></div>

            <div className="glass-panel" style={{ padding: '2.5rem 2rem', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2 className="text-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Aurora</h2>
                <p className="text-subtitle" style={{ marginBottom: '2rem' }}>{t('register')}</p>

                <form onSubmit={handleRegister} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div className="input-with-icon">
                            <UserIcon />
                            <input
                                type="text"
                                placeholder={t('name')}
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-with-icon">
                            <input
                                type="text"
                                placeholder={t('surname')}
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                                style={{ paddingLeft: '1rem' }}
                            />
                        </div>
                    </div>

                    <div className="input-with-icon">
                        <MailIcon />
                        <input
                            type="email"
                            placeholder={t('email')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-with-icon">
                        <LockIcon />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('password')}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                        <button
                            type="button"
                            className="eye-btn"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>

                    <div className="input-with-icon">
                        <LockIcon />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder={t('confirmPassword')}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        disabled={loading}
                    >
                        {loading ? t('loading') : t('register')}
                    </button>
                </form>

                <button
                    onClick={onSwitchToLogin}
                    className="btn-text"
                    style={{ marginTop: '1.5rem', color: 'var(--text-secondary)' }}
                >
                    {t('hasAccount')}
                </button>
            </div>

            <style>{`
        .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; position: relative; overflow: hidden; }
        .input-with-icon { position: relative; width: 100%; }
        .input-with-icon svg { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none; }
        .input-with-icon input { width: 100%; padding: 0.85rem 1rem 0.85rem 3rem; background-color: var(--bg-color-secondary); border: 2px solid transparent; border-radius: 12px; font-size: 0.95rem; color: var(--text-primary); transition: all var(--transition-fast); }
        .input-with-icon input:focus { outline: none; border-color: var(--accent-color); background-color: transparent; box-shadow: 0 0 15px rgba(255, 42, 95, 0.1); }
        .input-with-icon input::placeholder { color: var(--text-secondary); opacity: 0.7; }
        
        /* Modifiers for the double input row */
        .input-with-icon:nth-child(2) svg { display: none; }

        .eye-btn { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.2rem; }
        .eye-btn:hover { color: var(--text-primary); }
      `}</style>
        </div>
    );
}
