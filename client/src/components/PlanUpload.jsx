import { useState } from 'react';
import axios from 'axios';

const PlanUpload = ({ onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [mode, setMode] = useState('manual'); // 'manual' or 'auto'

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file');
            return;
        }

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('plan', file);
        formData.append('mode', mode);

        try {
            const res = await axios.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onUploadSuccess(res.data);
        } catch (err) {
            console.error(err);
            setError('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Upload Plan</h3>

            <div className="flex gap-2 mb-3">
                <button
                    onClick={() => setMode('manual')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${mode === 'manual' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Manual (Image)
                </button>
                <button
                    onClick={() => setMode('auto')}
                    className={`px-3 py-1 rounded text-xs font-medium transition ${mode === 'auto' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Auto (Coords)
                </button>
            </div>

            <label className={`
        cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 transition-all duration-200
        ${uploading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:bg-blue-50'}
      `}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="font-medium text-sm text-gray-600">{uploading ? 'Uploading...' : 'Select PDF'}</span>
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={uploading}
                />
            </label>

            {mode === 'auto' && <p className="text-[10px] text-gray-500 mt-1">Extracts UTM coords from PDF table.</p>}
            {mode === 'manual' && <p className="text-[10px] text-gray-500 mt-1">Overlays image for manual adjustment.</p>}

            {error && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-3 py-1 rounded text-xs shadow-sm mt-2">
                    {error}
                </div>
            )}
        </div>
    );
};

export default PlanUpload;
