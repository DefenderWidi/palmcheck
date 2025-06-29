import express from 'express';
import { addLocation, getLocations } from '../controllers/locationController.js';

const router = express.Router();

router.post('/', addLocation);  // Raspi kirim data
router.get('/', getLocations);  // Frontend ambil data

export default router;
