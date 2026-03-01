import React, { createContext, useContext, useState, useEffect } from 'react';

// Diccionario de Traducciones
const translations = {
    es: {
        hello: "Hola",
        yourTasks: "Tus Tareas",
        searchTasks: "Buscar tareas...",
        all: "Todas",
        personal: "Personal",
        study: "Estudio",
        important: "Importante",
        todaysTasks: "Tareas de Hoy",
        completed: "Completadas",
        pending: "Pendientes",
        weeklyProductivity: "Productividad Semanal",
        onTrack: "Vas por buen camino",
        ofCompletedTasks: "De tus tareas terminadas",
        newTask: "Nueva Tarea",
        cancel: "Cancelar",
        delete: "Eliminar",
        undo: "- Deshacer",
        completeAction: "+ Completar",
        whatNext: "¿Qué sigue en tu vida?",
        add: "Añadir",
        login: "Iniciar Sesión",
        register: "Registrarse",
        email: "Correo electrónico",
        password: "Contraseña",
        confirmPassword: "Confirmar Contraseña",
        name: "Nombre",
        surname: "Apellidos",
        rememberMe: "Recuérdame",
        noAccount: "¿No tienes cuenta? Regístrate",
        hasAccount: "¿Ya tienes cuenta? Inicia sesión",
        loading: "Cargando Aurora...",
        quickAddPlaceholder: "Añadir tarea rápida (Enter)...",
        dateOptional: "Fecha (Opcional)",
        health: "Salud",
        work: "Trabajo",
        home: "Hogar",
        other: "Otro",
        taskSingular: "1 Tarea",
        taskPlural: "Tareas"
    },
    en: {
        hello: "Hello",
        yourTasks: "Your Tasks",
        searchTasks: "Search tasks...",
        all: "All",
        personal: "Personal",
        study: "Study",
        important: "Important",
        todaysTasks: "Today's Tasks",
        completed: "Completed",
        pending: "Pending",
        weeklyProductivity: "Weekly Productivity",
        onTrack: "You are on track",
        ofCompletedTasks: "Of your completed tasks",
        newTask: "New Task",
        cancel: "Cancel",
        delete: "Delete",
        undo: "- Undo",
        completeAction: "+ Complete",
        whatNext: "What's next?",
        add: "Add",
        login: "Login",
        register: "Sign Up",
        email: "Email address",
        password: "Password",
        confirmPassword: "Confirm Password",
        name: "First Name",
        surname: "Last Name",
        rememberMe: "Remember me",
        noAccount: "Don't have an account? Sign up",
        hasAccount: "Already have an account? Login",
        loading: "Loading Aurora...",
        quickAddPlaceholder: "Quick add task (Enter)...",
        dateOptional: "Date (Optional)",
        health: "Health",
        work: "Work",
        home: "Home",
        other: "Other",
        taskSingular: "1 Task",
        taskPlural: "Tasks"
    },
    fr: {
        hello: "Bonjour",
        yourTasks: "Vos Tâches",
        searchTasks: "Rechercher des tâches...",
        all: "Tout",
        personal: "Personnel",
        study: "Étude",
        important: "Important",
        todaysTasks: "Tâches d'Aujourd'hui",
        completed: "Terminées",
        pending: "En attente",
        weeklyProductivity: "Productivité Hebdomadaire",
        onTrack: "Vous êtes sur la bonne voie",
        ofCompletedTasks: "De vos tâches terminées",
        newTask: "Nouvelle Tâche",
        cancel: "Annuler",
        delete: "Supprimer",
        undo: "- Annuler",
        completeAction: "+ Terminer",
        whatNext: "Quelle est la suite?",
        add: "Ajouter",
        login: "Connexion",
        register: "S'inscrire",
        email: "Adresse e-mail",
        password: "Mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        name: "Prénom",
        surname: "Nom",
        rememberMe: "Se souvenir de moi",
        noAccount: "Pas de compte ? S'inscrire",
        hasAccount: "Déjà un compte ? Connexion",
        loading: "Chargement d'Aurora...",
        quickAddPlaceholder: "Ajout rapide (Entrée)...",
        dateOptional: "Date (Optionnel)",
        health: "Santé",
        work: "Travail",
        home: "Maison",
        other: "Autre",
        taskSingular: "1 Tâche",
        taskPlural: "Tâches"
    },
    de: {
        hello: "Hallo",
        yourTasks: "Deine Aufgaben",
        searchTasks: "Aufgaben suchen...",
        all: "Alle",
        personal: "Persönlich",
        study: "Lernen",
        important: "Wichtig",
        todaysTasks: "Heutige Aufgaben",
        completed: "Abgeschlossen",
        pending: "Ausstehend",
        weeklyProductivity: "Wöchentliche Produktivität",
        onTrack: "Du bist auf dem richtigen Weg",
        ofCompletedTasks: "Deiner abgeschlossenen Aufgaben",
        newTask: "Neue Aufgabe",
        cancel: "Abbrechen",
        delete: "Löschen",
        undo: "- Rückgängig",
        completeAction: "+ Abschließen",
        whatNext: "Was steht als Nächstes an?",
        add: "Hinzufügen",
        login: "Anmelden",
        register: "Registrieren",
        email: "E-Mail-Adresse",
        password: "Passwort",
        confirmPassword: "Passwort bestätigen",
        name: "Vorname",
        surname: "Nachname",
        rememberMe: "Angemeldet bleiben",
        noAccount: "Kein Konto? Registrieren",
        hasAccount: "Bereits ein Konto? Anmelden",
        loading: "Lade Aurora...",
        quickAddPlaceholder: "Schnell hinzufügen (Enter)...",
        dateOptional: "Datum (Optional)",
        health: "Gesundheit",
        work: "Arbeit",
        home: "Zuhause",
        other: "Andere",
        taskSingular: "1 Aufgabe",
        taskPlural: "Aufgaben"
    }
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
    const [lang, setLang] = useState(() => {
        return localStorage.getItem('aurora_lang') || 'es';
    });

    useEffect(() => {
        localStorage.setItem('aurora_lang', lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const t = (key) => {
        return translations[lang]?.[key] || translations['es'][key] || key;
    };

    return (
        <I18nContext.Provider value={{ lang, setLang, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
