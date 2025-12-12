import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { useState } from 'react';
import MapComponent from './components/MapComponent';
import PlanUpload from './components/PlanUpload';

import SavedMaps from './components/SavedMaps';

// Dashboard with Map
const Dashboard = () => {
  const [planData, setPlanData] = useState(null);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[999] p-4 pointer-events-none flex justify-end items-start">
        {/* Left side is handled by PlanUpload absolute positioning */}

        <div className="flex gap-4 pointer-events-auto">
          <SavedMaps onLoadMap={(map) => {
            setPlanData({
              imagePath: map.image_path,
              coordinates: map.coordinates,
              mode: map.mode,
              savedBounds: map.bounds
            });
          }} />
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="bg-red-500/90 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition backdrop-blur-sm"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-grow relative">
        <PlanUpload onUploadSuccess={setPlanData} />
        <MapComponent planData={planData} />
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
