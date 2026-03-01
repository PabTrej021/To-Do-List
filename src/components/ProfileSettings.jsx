import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../context/I18nContext';

const CameraIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>;
const TrashIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>;
const XIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
const AlertTriangleIcon = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--danger-color)', marginBottom: '1rem' }}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>;

export default function ProfileSettings({ onClose, session, onToast, handleSignOut }) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    const confirmDeletion = async () => {
        setLoading(true);
        try {
            // Llama a la funcion SQL RPC en Supabase para el Auto-Borrado
            const { error } = await supabase.rpc('delete_user_account');

            if (error) {
                throw new Error("Error eliminando cuenta, revisa el RPC en Supabase.");
            }

            // Redirige
            await handleSignOut();
            setTimeout(() => {
                onToast('Cuenta Eliminada', 'Tu cuenta ha sido eliminada exitosamente.');
            }, 500);

        } catch (error) {
            onToast('Error', error.message);
        } finally {
            setLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="profile-overlay" onClick={onClose}>
            <div
                className="profile-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="profile-header">
                    <button className="profile-close-btn" onClick={onClose} aria-label="Cerrar Panel"><XIcon /></button>
                </div>

                <div className="profile-body">
                    <h2 className="text-title" style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem' }}>Configuración</h2>

                    {/* Avatar Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem' }}>
                        <div className="profile-avatar-large">
                            {displayInitials}
                            <button className="avatar-edit-btn" aria-label="Cambiar foto de perfil">
                                <CameraIcon />
                            </button>
                            <input type="file" style={{ display: 'none' }} accept="image/*" />
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontSize: '1rem' }}>{session?.user?.email}</p>
                    </div>

                    <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '3rem', width: '100%', maxWidth: '400px', margin: '0 auto 3rem auto' }}>
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

                        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', padding: '1rem' }}>
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </form>

                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                        <button
                            onClick={handleSignOut}
                            className="btn-secondary"
                            style={{ padding: '1rem', borderRadius: '16px', background: 'var(--bg-color-secondary)', color: 'var(--text-primary)', fontWeight: 600, border: '1px solid var(--glass-border)' }}
                        >
                            Cerrar Sesión
                        </button>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn-danger-text"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--danger-color)', padding: '1rem', background: 'transparent', fontWeight: 600 }}
                        >
                            <TrashIcon /> Eliminar Cuenta Permanente
                        </button>
                    </div>
                </div>
            </div>

            {/* CUSTOM DELETE CONFIRMATION MODAL */}
            {showDeleteConfirm && (
                <div className="delete-modal-overlay" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>
                    <div className="delete-modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <AlertTriangleIcon />
                            <h3 className="text-title" style={{ fontSize: '1.3rem' }}>¿Eliminar cuenta permanentemente?</h3>
                            <p className="text-subtitle" style={{ marginTop: '0.5rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                                Todas tus tareas se borrarán y esto no se puede deshacer.
                            </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className="btn-delete-confirm"
                                onClick={confirmDeletion}
                                disabled={loading}
                            >
                                {loading ? 'Eliminando...' : 'Sí, eliminar cuenta'}
                            </button>
                            <button
                                className="btn-delete-cancel"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .profile-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background-color: var(--glass-bg);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            z-index: 300;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeInOverlay 0.3s ease-out;
        }

        .profile-content {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            padding: 2rem;
            overflow-y: auto;
        }

        .profile-header {
            display: flex;
            justify-content: flex-end;
            padding-bottom: 2rem;
        }

        .profile-close-btn {
            background: var(--bg-color-secondary);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform var(--transition-fast);
            box-shadow: var(--shadow-sm);
        }

        .profile-close-btn:hover {
            transform: scale(1.1);
            background: var(--glass-bg);
        }

        .profile-body {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .profile-avatar-large {
           width: 110px;
           height: 110px;
           border-radius: 50%;
           background: linear-gradient(135deg, #5e5ce6, #bf5af2);
           color: white;
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 3rem;
           font-weight: 700;
           box-shadow: 0 8px 30px rgba(94, 92, 230, 0.4);
           position: relative;
        }

        .avatar-edit-btn {
           position: absolute;
           bottom: -2px;
           right: -2px;
           width: 40px;
           height: 40px;
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

        /* CUSTOM MODAL OVERLAY */
        .delete-modal-overlay {
            position: fixed;
            top: 0; left: 0;
            width: 100vw; height: 100vh;
            background-color: rgba(0,0,0,0.5);
            backdrop-filter: blur(10px);
            z-index: 400;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
            animation: fadeInOverlay 0.2s;
        }

        .delete-modal-content {
            width: 100%;
            max-width: 350px;
            padding: 2rem;
            text-align: center;
            animation: scaleInModal 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .btn-delete-confirm {
            background-color: var(--danger-color);
            color: white;
            padding: 0.85rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            transition: all var(--transition-fast);
            border: none;
            box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
            cursor: pointer;
        }

        .btn-delete-confirm:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 59, 48, 0.4);
        }

        .btn-delete-cancel {
            background-color: transparent;
            color: var(--text-secondary);
            padding: 0.85rem;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            transition: all var(--transition-fast);
            border: 1px solid transparent;
            cursor: pointer;
        }

        .btn-delete-cancel:hover {
            background-color: var(--bg-color-secondary);
            color: var(--text-primary);
        }

        @keyframes fadeInOverlay {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes scaleInModal {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

      `}</style>
        </div>
    );
}
