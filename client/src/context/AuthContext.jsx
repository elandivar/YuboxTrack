import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        if (token && username) {
            setUser({ username, token });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const res = await axios.post('http://localhost:3005/auth/login', { username, password });
            const { token, username: user } = res.data;
            localStorage.setItem('token', token);
            localStorage.setItem('username', user);
            setUser({ username: user, token });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data || 'Login failed' };
        }
    };

    const register = async (username, password) => {
        try {
            await axios.post('http://localhost:3005/auth/register', { username, password });
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
