import { MapContainer, TileLayer, Marker, Popup, Polyline, ImageOverlay, Polygon, useMap } from 'react-leaflet';
import { useState, useEffect, useRef, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';

// Fix marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Draggable Marker for Manual Calibration
function DraggableMarker({ position, onDragEnd }) {
    const markerRef = useRef(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    onDragEnd(marker.getLatLng());
                }
            },
        }),
        [onDragEnd],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
}

// Component to fit bounds
function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds);
        }
    }, [bounds, map]);
    return null;
}

const MapComponent = ({ planData }) => {
    const [tracks, setTracks] = useState([]);
    // Default bounds for manual image overlay (Guayaquil area)
    const [imageBounds, setImageBounds] = useState([
        [-2.18, -79.90],
        [-2.20, -79.88]
    ]);

    // Update bounds when markers are dragged
    const handleTopLeftDrag = (newLatLng) => {
        setImageBounds([
            [newLatLng.lat, newLatLng.lng],
            imageBounds[1]
        ]);
    };

    const handleBottomRightDrag = (newLatLng) => {
        setImageBounds([
            imageBounds[0],
            [newLatLng.lat, newLatLng.lng]
        ]);
    };

    useEffect(() => {
        const fetchTracks = async () => {
            try {
                const res = await axios.get('/tracks');
                setTracks(res.data);
            } catch (error) {
                console.error("Error fetching tracks:", error);
            }
        };

        fetchTracks();
        const interval = setInterval(fetchTracks, 5000);
        return () => clearInterval(interval);
    }, []);

    // Determine what to show based on planData
    const showPolygon = planData && planData.mode === 'auto' && planData.coordinates && planData.coordinates.length > 0;
    // Show image in Manual mode OR Auto mode (if image exists)
    const showImageOverlay = planData && planData.imagePath && (planData.mode === 'manual' || planData.mode === 'auto');

    const [opacity, setOpacity] = useState(0.7);
    const [clipToPolygon, setClipToPolygon] = useState(false);
    const imageOverlayRef = useRef(null);

    // Effect to set initial image bounds based on Polygon bounds in Auto mode OR saved bounds
    useEffect(() => {
        if (planData && planData.savedBounds) {
            // Restore saved bounds
            setImageBounds(planData.savedBounds);
        } else if (showPolygon && planData.coordinates.length > 0) {
            const polygonBounds = L.latLngBounds(planData.coordinates);
            // Set image bounds to slightly larger than polygon or match it
            setImageBounds([
                [polygonBounds.getSouthWest().lat, polygonBounds.getSouthWest().lng],
                [polygonBounds.getNorthEast().lat, polygonBounds.getNorthEast().lng]
            ]);
        }
    }, [showPolygon, planData]);

    // Calculate Clip Path
    useEffect(() => {
        if (!imageOverlayRef.current || !showPolygon || !showImageOverlay) return;

        const imgLayer = imageOverlayRef.current;
        const imgElement = imgLayer.getElement();
        if (!imgElement) return;

        if (!clipToPolygon) {
            imgElement.style.clipPath = 'none';
            return;
        }

        // Bounds: [[South, West], [North, East]]
        const south = imageBounds[0][0];
        const west = imageBounds[0][1];
        const north = imageBounds[1][0];
        const east = imageBounds[1][1];

        const latSpan = north - south;
        const lngSpan = east - west;

        const points = planData.coordinates.map(([lat, lng]) => {
            // Calculate percentage position relative to image bounds
            // X: (lng - west) / span
            // Y: (north - lat) / span (Y is inverted in CSS)
            const x = ((lng - west) / lngSpan) * 100;
            const y = ((north - lat) / latSpan) * 100;
            return `${x}% ${y}%`;
        });

        const polygonString = `polygon(${points.join(', ')})`;
        imgElement.style.clipPath = polygonString;

    }, [clipToPolygon, imageBounds, planData, showPolygon, showImageOverlay]);

    // Calculate center/bounds
    const center = [-2.19, -79.89]; // Default

    // Save Map Handler
    const handleSaveMap = async () => {
        const name = prompt("Enter a name for this map:");
        if (!name) return;

        const mapData = {
            name,
            image_path: planData.imagePath,
            bounds: imageBounds,
            coordinates: planData.coordinates,
            mode: planData.mode
        };

        try {
            const token = localStorage.getItem('token');
            await axios.post('/maps', mapData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Map saved successfully!');
        } catch (error) {
            console.error('Error saving map:', error);
            alert('Failed to save map.');
        }
    };

    return (
        <div className="relative h-full w-full">
            <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution='Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                />

                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                    opacity={0.3}
                />

                {/* Auto Mode: Polygon from Coordinates */}
                {showPolygon && (
                    <>
                        <Polygon positions={planData.coordinates} pathOptions={{ color: 'lime', fillColor: 'lime', fillOpacity: 0.1, weight: 2 }} />
                        <FitBounds bounds={planData.coordinates} />
                    </>
                )}

                {/* Image Overlay (Manual & Auto) */}
                {showImageOverlay && (
                    <>
                        <ImageOverlay
                            ref={imageOverlayRef}
                            url={planData.imagePath}
                            bounds={imageBounds}
                            opacity={opacity}
                        />
                        {/* Calibration Markers - Always allow adjustment */}
                        <DraggableMarker position={imageBounds[0]} onDragEnd={handleTopLeftDrag} />
                        <DraggableMarker position={imageBounds[1]} onDragEnd={handleBottomRightDrag} />
                    </>
                )}

                {/* Tractor Tracks */}
                {tracks.length > 0 && (
                    <>
                        <Polyline
                            positions={tracks.map(t => [t.latitude, t.longitude])}
                            pathOptions={{ color: 'yellow', weight: 4 }}
                        />
                        <Marker position={[tracks[tracks.length - 1].latitude, tracks[tracks.length - 1].longitude]}>
                            <Popup>
                                Tractor ID: {tracks[tracks.length - 1].tractor_id} <br />
                                Last Update: {new Date(tracks[tracks.length - 1].timestamp).toLocaleTimeString()}
                            </Popup>
                        </Marker>
                    </>
                )}
            </MapContainer>

            {/* Controls Container */}
            <div className="absolute bottom-8 left-8 z-[1000] flex flex-col gap-4">
                {/* Opacity & Clipping Control */}
                {showImageOverlay && (
                    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg w-64 flex flex-col gap-3">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2">
                                Plan Opacity: {Math.round(opacity * 100)}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={opacity}
                                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        {showPolygon && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={clipToPolygon}
                                    onChange={(e) => setClipToPolygon(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-xs font-bold text-gray-700">Clip to Polygon</span>
                            </label>
                        )}
                    </div>
                )}

                {/* Save Button */}
                {(showImageOverlay || showPolygon) && (
                    <button
                        onClick={handleSaveMap}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                        <span>💾</span> Save Map
                    </button>
                )}
            </div>
        </div>
    );
};

export default MapComponent;
