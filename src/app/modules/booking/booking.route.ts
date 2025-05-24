import { Router } from "express";
import { bookingController } from "./booking.controller";

const router = Router();

router.get('/:id', bookingController.getAllUnavailableSeatsOfaBus)
router.post('/book-now', bookingController.createBooking)


export const BookingRouter = router