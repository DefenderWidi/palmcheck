let locationData = [];

export const addLocation = (req, res) => {
  const { device_id, lat, lng, status } = req.body;

  if (!lat || !lng || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newEntry = {
    id: Date.now(), 
    device_id: device_id || 'raspi-01',
    lat,
    lng,
    status,
    timestamp: new Date()
  };

  locationData.push(newEntry);
  console.log('📍 Location received:', newEntry);

  res.status(201).json({ message: 'Location stored', data: newEntry });
};

export const getLocations = (req, res) => {
  // Kalau mau batasi 10 terbaru: locationData.slice(-10)
  res.json(locationData);
};
