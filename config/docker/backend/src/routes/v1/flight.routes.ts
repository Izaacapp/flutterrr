import { strictDateExtraction } from "../utils/dateStrict";
import { safeStrictDateExtraction } from "../utils/dateStrict";
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import multer from 'multer';
import * as flightController from '../../controllers/flight.controller';

const router = Router();

// Configure multer for boarding pass uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDFs and images
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Upload boarding pass (PDF or image)
router.post('/upload-boarding-pass', upload.single('boardingPass'), flightController.uploadBoardingPass);

// Manual flight entry
router.post('/manual-entry', flightController.manualFlightEntry);

// Get user's flights with filtering
router.get('/my-flights', flightController.getMyFlights);

// Get flight statistics
router.get('/stats', flightController.getFlightStats);

// Get single flight
router.get('/:flightId', flightController.getFlightById);

// Update flight details
router.put('/:flightId', flightController.updateFlight);

// Update flight status
router.patch('/:flightId/status', flightController.updateFlightStatus);

// Delete flight
router.delete('/:flightId', flightController.deleteFlight);

export default router;