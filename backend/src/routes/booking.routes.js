import { Router } from 'express';
import {
  createBooking, getBookings, cancelBooking, rescheduleBooking,
} from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// All authenticated users can book resources
router.get('/', getBookings);
router.post('/', createBooking);
router.patch('/:id/cancel', cancelBooking);
router.patch('/:id/reschedule', rescheduleBooking);

export default router;
