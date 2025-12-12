import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const { login, register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (isRegistering) {
            const result = await register(username, password);
            if (result.success) {
                setSuccessMsg('Registration successful! Please login.');
                setIsRegistering(false);
            } else {
                setError(result.message);
            }
        } else {
            const result = await login(username, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message);
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-slate-900">
            <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl w-96 border border-white/20">
                <h2 className="text-3xl font-bold mb-2 text-center text-white">
                    {isRegistering ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-center text-blue-200 mb-8 text-sm">
                    {isRegistering ? 'Join the tractor tracking platform' : 'Login to monitor your fleet'}
                </p>

                {error && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">{error}</div>}
                {successMsg && <div className="bg-green-500/20 border border-green-500/50 text-green-200 p-3 rounded-lg mb-4 text-sm text-center">{successMsg}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-blue-200 text-xs font-bold mb-1 uppercase tracking-wider">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-blue-200 text-xs font-bold mb-1 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-3 rounded-lg shadow-lg hover:shadow-blue-500/30 transition duration-200 mt-6"
                    >
                        {isRegistering ? 'Sign Up' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                            setSuccessMsg('');
                        }}
                        className="text-blue-300 hover:text-white text-sm transition"
                    >
                        {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;
