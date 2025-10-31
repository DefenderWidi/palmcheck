import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  const [locations, setLocations] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const containerStyle = {
    width: '100%',
    height: '500px'
  };

  useEffect(() => {
    // Ambil posisi user sekali
    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      err => console.error(err)
    );

    // Fungsi ambil data dari backend
    const fetchLocations = () => {
      fetch("http://172.20.10.3:5000/api/locations")
        .then(res => res.json())
        .then(data => setLocations(data))
        .catch(err => console.error("❌ Error fetching locations:", err));
    };

    // Panggil pertama kali
    fetchLocations();

    // Set interval untuk auto-refresh (saat ini 1 detik)
    const interval = setInterval(fetchLocations, 1000);

    // Bersihkan interval saat komponen unmount
    return () => clearInterval(interval);
  }, []);

  const ripeCount = locations.filter(loc => loc.status === 'ripe').length;
  const unripeCount = locations.filter(loc => loc.status === 'unripe').length;
  const overripeCount = locations.filter(loc => loc.status === 'overripe').length;

  // Total buat persentase akurasi (asumsi model akurat saat status valid)
  const totalCount = locations.length;
  const accuracy = totalCount > 0
    ? ((ripeCount + unripeCount + overripeCount) / totalCount) * 100
    : 0;

  return (
    <div className="min-h-screen bg-green-50 p-6">
      <header className="mb-6 flex justify-between items-start">
        <div className="px-6 mb-1">
          <div className="flex items-center gap-7">
            <div className="w-12 h-12 transform scale-[1.75]">
              <img src="/logo.png" alt="PalmCheck Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-green-800">
                PalmCheck: Palm Oil Fruit Detection Dashboard
              </h1>
              <p className="text-green-700 text-sm">Real-time monitoring and analytics</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <span className="h-2 w-2 bg-green-500 rounded-full inline-block" />
            System Online
          </span>
          <span>• Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative">
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Map: Palm Tree Locations</h2>
            </div>

            <MapContainer center={[-7.2778, 112.7920]} zoom={22} style={containerStyle} className="relative">
              <TileLayer
                url={`https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}`}
                subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              />
              {locations.map((location, index) => (
                <Marker
                  key={index}
                  position={[location.lat, location.lng]}
                  icon={new L.Icon({
                    iconUrl: location.status === 'ripe'
                      ? '/green-marker.png'
                      : location.status === 'unripe'
                      ? '/yellow-marker.png'
                      : '/red-marker.png',
                    iconSize: [32, 32]
                  })}
                  eventHandlers={{
                    click: () => setSelectedTree(location)
                  }}
                >
                  <Popup>
                    {location.status === 'ripe' ? 'Pohon Matang' :
                     location.status === 'unripe' ? 'Pohon Belum Matang' :
                     'Pohon Terlalu Matang'}
                  </Popup>
                </Marker>
              ))}
              {userLocation && (
                <Marker position={userLocation} icon={L.icon({
                  iconUrl: '/user-location.png',
                  iconSize: [25, 25]
                })}>
                  <Popup>Lokasi Anda</Popup>
                </Marker>
              )}

              <div className="absolute top-4 right-4 z-[1000] bg-white shadow-md rounded p-2 text-sm">
                <div><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span> Matang</div>
                <div><span className="inline-block w-3 h-3 bg-yellow-400 rounded-full mr-2"></span> Belum Matang</div>
                <div><span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span> Terlalu Matang</div>
              </div>
            </MapContainer>

            {selectedTree && (
              <div className="mt-4 p-4 bg-gray-50 border rounded shadow">
                <h3 className="font-bold text-lg text-green-700 mb-2">Detail Lokasi</h3>
                <p><strong>Status:</strong> {selectedTree.status}</p>
                <p><strong>Latitude:</strong> {selectedTree.lat}</p>
                <p><strong>Longitude:</strong> {selectedTree.lng}</p>
                <button onClick={() => setSelectedTree(null)} className="mt-2 text-sm text-red-500 underline">Tutup</button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-green-50 rounded-xl shadow p-4 transition duration-300 hover:scale-[1.03]">
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm mb-1">
              <span className="h-4 w-4 bg-green-600 rounded-full inline-block" />
              Ripe Fruits Detected
            </div>
            <div className="text-3xl font-bold text-gray-900">{ripeCount}</div>
            <div className="text-sm text-green-600 mt-1">Real-time count</div>
          </div>

          <div className="bg-yellow-50 rounded-xl shadow p-4 transition duration-300 hover:scale-[1.03]">
            <div className="flex items-center gap-2 text-yellow-600 font-medium text-sm mb-1">
              <span className="h-4 w-4 bg-yellow-400 rounded-full inline-block" />
              Unripe Fruits Detected
            </div>
            <div className="text-3xl font-bold text-gray-900">{unripeCount}</div>
            <div className="text-sm text-yellow-600 mt-1">Real-time count</div>
          </div>

          <div className="bg-orange-50 rounded-xl shadow p-4 transition duration-300 hover:scale-[1.03]">
            <div className="flex items-center gap-2 text-orange-600 font-medium text-sm mb-1">
              <span className="h-4 w-4 bg-red-500 rounded-full inline-block" />
              Overripe Fruits Detected
            </div>
            <div className="text-3xl font-bold text-gray-900">{overripeCount}</div>
            <div className="text-sm text-red-600 mt-1">Real-time count</div>
          </div>

          <div className="bg-blue-50 rounded-xl shadow p-4 transition duration-300 hover:scale-[1.03]">
            <div className="flex items-center gap-2 text-blue-600 font-medium text-sm mb-1">
              <span className="h-4 w-4 bg-blue-500 rounded-full inline-block" />
              Detection Accuracy
            </div>
            <div className="text-3xl font-bold text-gray-900">{accuracy.toFixed(1)}%</div>
            <div className="text-sm text-blue-500 mt-1">Based on {totalCount} data</div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <Link to="/daily">
              <button className="flex items-center gap-2 px-8 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition">
                📅 Daily Recap
              </button>
            </Link>

            {/* ⬇️ Tombol baru ke halaman Yield & ROI */}
            <Link to="/yield">
              <button className="flex items-center gap-2 px-8 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                📈 Yield & ROI
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
