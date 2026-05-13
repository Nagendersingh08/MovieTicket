import express from 'express';
import { createBooking, getOccupiedSeats, verifyBookingPayment } from '../controllers/bookingController.js';

const bookingRouter = express.Router();


bookingRouter.post('/create', createBooking);
bookingRouter.post('/verify-payment', verifyBookingPayment);
bookingRouter.get('/seats/:showId', getOccupiedSeats);

export default bookingRouter;









