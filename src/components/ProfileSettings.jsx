import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../context/I18nContext';

const CameraIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>;
const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>;
const XIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;

export default function ProfileSettings({ onClose, session, onToast, handleSignOut }) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);

    // Parse Initial Name/Surname from Metadata
    const fullName = session?.user?.user_metadata?.full_name || '';
    const initialName = fullName.split(' ')[0] || '';
    const initialSurname = fullName.split(' ').slice(1).join(' ') || '';

    const [firstName, setFirstName] = useState(initialName);
    const [lastName, setLastName] = useState(initialSurname);

    const displayInitials = (firstName.charAt(0) + (lastName.charAt(0) || '')).toUpperCase() || 'U';

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const updates = {
                data: {
                    full_name: `${firstName} ${lastName}`.trim()
                }
            };

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;
            onToast('Perfil Actualizado', 'Los cambios se han guardado con éxito.');
            onClose(); // Cerrar modal después de guardar
        } catch (error) {
            onToast('Error', error.message || 'No se pudo actualizar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmDelete = window.confirm("¿Estás seguro de que deseas eliminar tu cuenta permanentemente? Todas tus tareas se borrarán y esto no se puede deshacer.");
        if (!confirmDelete) return;

        try {
            // Usualmente los usuarios no pueden eliminarse a si mismos por politicas de seguridad sin un server route (Edge Function)
            // Pero si se tiene configurado el RLS permitiendo borrar la propia id (RPC)
            const { error } = await supabase.rpc('delete_user');

            if (error) {
                throw new Error("Para eliminar la cuenta, cierra sesión y contacta a un administrador.");
            }
            handleSignOut();
            onToast('Cuenta Eliminada', 'Tu cuenta ha sido cerrada permanentemente.');
        } catch (error) {
            onToast('Privilegios insuficientes', error.message);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content profile-settings-modal"
                onClick={e => e.stopPropagation()}
                style={{ padding: '2rem 1.5rem', width: '100%', maxWidth: '400px' }}
            >
                <button className="close-btn" onClick={onClose} aria-label="Cerrar"><XIcon /></button>
                <div className="mobile-handle"></div> {/* Linea indicadora de swipe up en móviles */}

                <h2 className="text-title" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.5rem' }}>Perfil</h2>

                {/* Avatar Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div className="profile-avatar-large">
                        {displayInitials}
                        <button className="avatar-edit-btn" aria-label="Cambiar foto de perfil">
                            <CameraIcon />
                        </button>
                        <input type="file" style={{ display: 'none' }} accept="image/*" />
                    </div>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>{session?.user?.email}</p>
                </div>

                <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="input-group-auth">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '12px', marginBottom: '4px', display: 'block' }}>Nombre</span>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '1.25rem' }}
                            required
                        />
                    </div>
                    <div className="input-group-auth">
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '12px', marginBottom: '4px', display: 'block' }}>Apellidos</span>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="input-field"
                            style={{ paddingLeft: '1.25rem' }}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </form>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button
                        onClick={handleSignOut}
                        className="btn-secondary"
                        style={{ padding: '0.8rem', borderRadius: '12px', background: 'var(--bg-color-secondary)', color: 'var(--text-primary)', fontWeight: 600, border: '1px solid var(--glass-border)' }}
                    >
                        Cerrar Sesión
                    </button>

                    <button
                        onClick={handleDeleteAccount}
                        className="btn-danger-text"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--danger-color)', padding: '0.8rem', background: 'transparent', fontWeight: 600 }}
                    >
                        <TrashIcon /> Eliminar Cuenta
                    </button>
                </div>

            </div>

            <style>{`
        .profile-avatar-large {
           width: 90px;
           height: 90px;
           border-radius: 50%;
           background: linear-gradient(135deg, #5e5ce6, #bf5af2);
           color: white;
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 2.5rem;
           font-weight: 700;
           box-shadow: 0 8px 25px rgba(94, 92, 230, 0.4);
           position: relative;
        }

        .avatar-edit-btn {
           position: absolute;
           bottom: -5px;
           right: -5px;
           width: 36px;
           height: 36px;
           border-radius: 50%;
           background-color: var(--glass-bg);
           backdrop-filter: blur(10px);
           -webkit-backdrop-filter: blur(10px);
           border: 1px solid var(--glass-border);
           color: var(--text-primary);
           display: flex;
           align-items: center;
           justify-content: center;
           box-shadow: var(--shadow-sm);
           cursor: pointer;
           transition: all var(--transition-fast);
        }

        .avatar-edit-btn:hover {
           background-color: var(--bg-color-secondary);
           transform: scale(1.05);
        }
      `}</style>
        </div>
    );
}
