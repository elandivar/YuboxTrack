import { useState, useEffect } from 'react';
import axios from 'axios';

const SavedMaps = ({ onLoadMap }) => {
    const [maps, setMaps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchMaps = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/maps', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMaps(res.data);
        } catch (error) {
            console.error('Error fetching maps:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMaps();
        }
    }, [isOpen]);

    return (
        <div className="relative z-[1000]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-white hover:bg-gray-50 text-gray-800 font-medium py-2 px-4 rounded-lg shadow-lg transition duration-200 flex items-center gap-2"
            >
                <span>🗺️</span> Saved Maps
            </button>

            {isOpen && (
                <div className="absolute top-12 right-0 w-64 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-100 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700">Select a Map</h3>
                    </div>

                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
                    ) : maps.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No saved maps found.</div>
                    ) : (
                        <ul>
                            {maps.map((map) => (
                                <li key={map.id}>
                                    <button
                                        onClick={() => {
                                            onLoadMap(map);
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition duration-150 border-b border-gray-50 last:border-0"
                                    >
                                        <div className="font-medium text-gray-800 text-sm">{map.name}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {new Date(map.created_at).toLocaleDateString()} - {map.mode === 'auto' ? 'Auto' : 'Manual'}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default SavedMaps;
