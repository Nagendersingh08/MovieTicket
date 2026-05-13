import Booking from "../models/Booking.js"
import Show from "../models/Show.js";
import User from "../models/User.js";
import { syncClerkUserToMongo } from "../utils/userSync.js";


// API to check if user is admin
export const isAdmin = async (req, res) =>{
    res.json({success: true, isAdmin: true})
}

// API to get dashboard data
export const getDashboardData = async (req, res) =>{
    try {
        const bookings = await Booking.find({isPaid: true});
        const upcomingShows = await Show.find({showDateTime: {$gte: new Date()}})
            .populate('movie')
            .sort({ showDateTime: 1 });

        const seenMovieIds = new Set();
        const activeShows = upcomingShows.filter((show) => {
            if (!show.movie?._id) {
                return false;
            }

            const movieId = String(show.movie._id);
            if (seenMovieIds.has(movieId)) {
                return false;
            }

            seenMovieIds.add(movieId);
            return true;
        });

        const totalUser = await User.countDocuments();

        const dashboardData = {
            totalBookings: bookings.length,
            totalRevenue: bookings.reduce((acc, booking)=> acc + booking.amount, 0),
            activeShows,
            totalUser
        }

        res.json({success: true, dashboardData})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all shows
export const getAllShows = async (req, res) =>{
    try {
        const shows = await Show.find({showDateTime: { $gte: new Date() }}).populate('movie').sort({ showDateTime: 1 })
        res.json({success: true, shows})
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}

// API to get all bookings
export const getAllBookings = async (req, res) =>{
    try {
        const bookings = await Booking.find({}).populate({
            path: "show",
            populate: {path: "movie"}
        }).sort({ createdAt: -1 }).lean()

        const userIds = [...new Set(bookings.map((booking) => booking.user).filter(Boolean))]
        const users = await User.find({ _id: { $in: userIds } }).lean()
        const usersMap = new Map(users.map((user) => [user._id, user]))

        const missingUserIds = userIds.filter((userId) => !usersMap.has(userId))

        if (missingUserIds.length > 0) {
            const syncedUsers = await Promise.all(
                missingUserIds.map(async (userId) => {
                    try {
                        return await syncClerkUserToMongo(userId)
                    } catch (error) {
                        console.error(`Failed to sync user ${userId}:`, error.message);
                        return null;
                    }
                })
            )

            syncedUsers.filter(Boolean).forEach((user) => {
                usersMap.set(user._id, user)
            })
        }

        const bookingsWithUsers = bookings.map((booking) => ({
            ...booking,
            user: usersMap.get(booking.user) || null
        }))

        res.json({success: true, bookings: bookingsWithUsers })
    } catch (error) {
        console.error(error);
        res.json({success: false, message: error.message})
    }
}
