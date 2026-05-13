import { inngest } from "../inngest/index.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js"
import stripe from 'stripe'
import { syncClerkUserToMongo } from "../utils/userSync.js";


// Function to check availability of selected seats for a movie
const checkSeatsAvailability = async (showId, selectedSeats)=>{
    try {
        const showData = await Show.findById(showId)
        if(!showData) return false;

        const occupiedSeats = showData.occupiedSeats;

        const isAnySeatTaken = selectedSeats.some(seat => occupiedSeats[seat]);

        return !isAnySeatTaken;
    } catch (error) {
        console.log(error.message);
        return false;
    }
}

export const createBooking = async (req, res)=>{
    try {
        const {userId} = req.auth();
        const {showId, selectedSeats} = req.body;
        const { origin } = req.headers;

        await syncClerkUserToMongo(userId);

        // Check if the seat is available for the selected show
        const isAvailable = await checkSeatsAvailability(showId, selectedSeats)

        if(!isAvailable){
            return res.json({success: false, message: "Selected Seats are not available."})
        }

        // Get the show details
        const showData = await Show.findById(showId).populate('movie');

        // Create a new booking
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        })

        selectedSeats.map((seat)=>{
            showData.occupiedSeats[seat] = userId;
        })

        showData.markModified('occupiedSeats');

        await showData.save();

         // Stripe Gateway Initialize
         const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        // Creating line items for Stripe
        const line_items = [{
            price_data: {
                currency: 'inr',   // changed to INR
                product_data:{
                    name: showData.movie.title
                },
                unit_amount: Math.floor(booking.amount) * 100  // INR requires paise
            },
            quantity: 1
        }]

         const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings?session_id={CHECKOUT_SESSION_ID}&bookingId=${booking._id.toString()}`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
         })

         booking.paymentLink = session.url
         booking.stripeSessionId = session.id
         await booking.save()

         // Run Inngest Sheduler Function to check payment status after 10 minutes
         await inngest.send({
            name: "app/checkpayment",
            data: {
                bookingId: booking._id.toString()
            }
         })

         res.json({success: true, url: session.url})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

export const verifyBookingPayment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { sessionId, bookingId } = req.body;

        if (!sessionId || !bookingId) {
            return res.json({ success: false, message: "Missing payment verification details." });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.json({ success: false, message: "Booking not found." });
        }

        if (booking.user !== userId) {
            return res.json({ success: false, message: "Unauthorized booking access." });
        }

        if (booking.isPaid) {
            return res.json({ success: true, paid: true });
        }

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

        if (session.metadata?.bookingId !== bookingId) {
            return res.json({ success: false, message: "Payment session does not match booking." });
        }

        if (session.payment_status !== 'paid') {
            return res.json({ success: true, paid: false });
        }

        await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            paymentLink: ""
        });

        await inngest.send({
            name: "app/show.booked",
            data: { bookingId }
        });

        res.json({ success: true, paid: true });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

export const getOccupiedSeats = async (req, res)=>{
    try {
        
        const {showId} = req.params;
        const showData = await Show.findById(showId)

        const occupiedSeats = Object.keys(showData.occupiedSeats)

        res.json({success: true, occupiedSeats})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
