import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
};

if (initialState.token) {
    initialState.user = JSON.parse(localStorage.getItem('user'));
    initialState.isAuthenticated = true;

}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token } = action.payload;
            state.user = user;
            state.token = token;
            state.isAuthenticated = true;
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.clear();
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;