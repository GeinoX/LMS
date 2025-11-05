import { createSlice } from '@reduxjs/toolkit';

// Ensure user objects always expose teachSubjects (array) and a
// backward-compatible teachSubject (first element) to avoid breaking
// many existing components that still reference currentUser.teachSubject.
function normalizeUser(u) {
    if (!u) return null;
    const user = { ...u };
    // If new array exists, keep it. If only legacy single exists, convert it.
    if (!Array.isArray(user.teachSubjects)) {
        if (user.teachSubject) {
            user.teachSubjects = [user.teachSubject];
        } else {
            user.teachSubjects = [];
        }
    }
    // Ensure teachSubject points to the first subject for compatibility
    user.teachSubject = user.teachSubjects && user.teachSubjects.length > 0 ? user.teachSubjects[0] : user.teachSubject || null;
    return user;
}

const savedUserRaw = JSON.parse(localStorage.getItem('user')) || null;
const currentSessionId = localStorage.getItem('sessionId');

// Validate session isolation - only load user if it matches current session
let savedUser = null;
if (savedUserRaw && savedUserRaw.sessionId === currentSessionId) {
    savedUser = normalizeUser(savedUserRaw);
    console.log('🔄 APP INIT: Loading user from localStorage (session validated):', savedUser);
} else if (savedUserRaw) {
    console.log('🔄 APP INIT: User data found but session mismatch - clearing stale data');
    console.log('🔄 APP INIT: Stored sessionId:', savedUserRaw.sessionId, 'Current sessionId:', currentSessionId);
    localStorage.removeItem('user');
} else {
    console.log('🔄 APP INIT: No user data in localStorage');
}

// Add session isolation - each tab should have its own session
let sessionId = currentSessionId;
if (!sessionId) {
    sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('sessionId', sessionId);
    console.log('🔄 APP INIT: Created new session ID:', sessionId);
} else {
    console.log('🔄 APP INIT: Using existing session ID:', sessionId);
}

const initialState = {
    status: 'idle',
    userDetails: [],
    tempDetails: [],
    loading: false,
    currentUser: savedUser,
    // Active subject id (teacher's selected subject) used across teacher pages
    activeSubjectId: (savedUser && (savedUser.teachSubject && savedUser.teachSubject._id)) || (savedUser && savedUser.teachSubjects && savedUser.teachSubjects[0]?._id) || null,
    currentRole: (savedUser || {}).role || null,
    error: null,
    response: null,
    darkMode: true
};

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        authRequest: (state) => {
            state.status = 'loading';
            state.loading = true;
            state.response = null;
            state.error = null;
        },
        underControl: (state) => {
            state.status = 'idle';
            state.response = null;
            state.error = null;
            state.loading = false;
        },
        stuffAdded: (state, action) => {
            state.status = 'added';
            state.response = action.payload;
            state.error = null;
            state.loading = false;
            state.tempDetails = action.payload;
        },
        authSuccess: (state, action) => {
            console.log('✅ LOGIN SUCCESS: Processing user data');
            console.log('✅ LOGIN SUCCESS: Raw payload:', action.payload);
            state.status = 'success';
            const normalized = normalizeUser(action.payload);
            console.log('✅ LOGIN SUCCESS: Normalized user:', normalized);
            state.currentUser = normalized;
            state.currentRole = normalized.role;
            // set active subject id to first subject if not explicitly set
            state.activeSubjectId = (normalized && (normalized.teachSubject && normalized.teachSubject._id)) || (normalized && normalized.teachSubjects && normalized.teachSubjects[0]?._id) || null;
            console.log('✅ LOGIN SUCCESS: Active subject ID set to:', state.activeSubjectId);

            // Store user data with session isolation
            const sessionId = localStorage.getItem('sessionId');
            const userData = {
                ...normalized,
                sessionId: sessionId,
                timestamp: Date.now()
            };
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ LOGIN SUCCESS: User saved to localStorage with session ID:', sessionId);
            state.response = null;
            state.error = null;
            state.loading = false;
        },

        // Set currently active subject id (used by teacher pages)
        setActiveSubject: (state, action) => {
            state.activeSubjectId = action.payload;
        },
        authFailed: (state, action) => {
            state.status = 'failed';
            state.response = action.payload;
            state.error = null;
            state.loading = false;
        },
        authError: (state, action) => {
            state.status = 'error';
            state.error = action.payload;
            state.response = null;
            state.loading = false;
        },
        authLogout: (state) => {
            console.log('🔐 LOGOUT: Clearing user session');
            console.log('🔐 LOGOUT: Current user before logout:', state.currentUser);

            // Clear session-specific data but keep sessionId for isolation
            const sessionId = localStorage.getItem('sessionId');
            localStorage.removeItem('user');
            console.log('🔐 LOGOUT: localStorage user data cleared, keeping sessionId:', sessionId);

            state.currentUser = null;
            state.status = 'idle';
            state.error = null;
            state.currentRole = null;
            state.response = null;
            state.loading = false;
            state.activeSubjectId = null;
            console.log('🔐 LOGOUT: Redux state reset complete');
        },

        doneSuccess: (state, action) => {
            state.userDetails = action.payload;
            state.loading = false;
            state.error = null;
            state.response = null;
        },
        // getDeleteSuccess a été supprimé car non utilisé

        getRequest: (state) => {
            state.loading = true;
            state.error = null;
            state.response = null;
        },
        getFailed: (state, action) => {
            state.response = action.payload;
            state.loading = false;
            state.error = null;
        },
        getError: (state, action) => {
            state.loading = false;
            state.error = action.payload;
            state.response = null;
        },
        toggleDarkMode: (state) => {
            state.darkMode = !state.darkMode;
        }
    },
});

export const {
    authRequest,
    underControl,
    stuffAdded,
    authSuccess,
    authFailed,
    authError,
    authLogout,
    doneSuccess,
    getRequest,
    getFailed,
    getError,
    toggleDarkMode,
    setActiveSubject
} = userSlice.actions;

export const userReducer = userSlice.reducer;