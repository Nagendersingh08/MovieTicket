import axios from "axios"
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

const TMDB_HEADERS = {
    Authorization: `Bearer ${process.env.TMDB_API_KEY}`
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableTmdbError = (error) => {
    return [
        "ECONNRESET",
        "ECONNABORTED",
        "ETIMEDOUT",
        "ENOTFOUND",
        "EAI_AGAIN"
    ].includes(error.code) || (error.response?.status >= 500);
};

const fetchTmdbWithRetry = async (url, attempt = 1) => {
    try {
        return await axios.get(url, {
            headers: TMDB_HEADERS,
            timeout: 10000
        });
    } catch (error) {
        if (attempt < 3 && isRetryableTmdbError(error)) {
            await wait(700 * attempt);
            return fetchTmdbWithRetry(url, attempt + 1);
        }

        throw error;
    }
};

// API to get now playing movies from TMDB API
export const getNowPlayingMovies = async (req, res)=>{
    try {
        const { data } = await fetchTmdbWithRetry('https://api.themoviedb.org/3/movie/now_playing');

        const movies = data.results || [];
        res.json({success: true, movies})
    } catch (error) {
        console.error(error);

        try {
            const fallbackMovies = await Movie.find({})
                .sort({ release_date: -1, createdAt: -1 })
                .limit(20);

            if (fallbackMovies.length > 0) {
                return res.json({
                    success: true,
                    movies: fallbackMovies,
                    fallback: true
                });
            }
        } catch (fallbackError) {
            console.error(fallbackError);
        }

        res.json({
            success: false,
            message: 'Unable to load movies from TMDB right now. Please try again in a moment.'
        })
    }
}

// API to add a new show to the database
export const addShow = async (req, res) =>{
    try {
        const {movieId, showsInput, showPrice} = req.body

        let movie = await Movie.findById(movieId)

        if(!movie) {
            // Fetch movie details and credits from TMDB API
            const [movieDetailsResponse, movieCreditsResponse] = await Promise.all([
                fetchTmdbWithRetry(`https://api.themoviedb.org/3/movie/${movieId}`),
                fetchTmdbWithRetry(`https://api.themoviedb.org/3/movie/${movieId}/credits`)
            ]);

            const movieApiData = movieDetailsResponse.data;
            const movieCreditsData = movieCreditsResponse.data;

             const movieDetails = {
                _id: movieId,
                title: movieApiData.title,
                overview: movieApiData.overview,
                poster_path: movieApiData.poster_path,
                backdrop_path: movieApiData.backdrop_path,
                genres: movieApiData.genres,
                casts: movieCreditsData.cast,
                release_date: movieApiData.release_date,
                original_language: movieApiData.original_language,
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average,
                runtime: movieApiData.runtime,
             }

             // Add movie to the database
             movie = await Movie.create(movieDetails);
        }

        const showsToCreate = [];
        showsInput.forEach(show => {
            const showDate = show.date;
            show.time.forEach((time)=>{
                const dateTimeString = `${showDate}T${time}`;
                showsToCreate.push({
                    movie: movieId,
                    showDateTime: new Date(dateTimeString),
                    showPrice,
                    occupiedSeats: {}
                })
            })
        });

        if(showsToCreate.length > 0){
            await Show.insertMany(showsToCreate);
        }

         //  Trigger Inngest event
         await inngest.send({
            name: "app/show.added",
             data: {movieTitle: movie.title}
         })

        res.json({success: true, message: 'Show Added successfully.'})
    } catch (error) {
        console.error(error);
        res.json({
            success: false,
            message: isRetryableTmdbError(error)
                ? 'Movie service is temporarily unstable. Please try adding the show again.'
                : error.message
        })
    }
}

// API to get all shows from the database
export const getShows = async (req, res) =>{
    try {
        const shows = await Show.find({showDateTime: {$gte: new Date()}}).populate('movie').sort({ showDateTime: 1 });

        // filter unique shows
        const uniqueShows = new Set(shows.map(show => show.movie))

        res.json({success: true, shows: Array.from(uniqueShows)})
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get a single show from the database
export const getShow = async (req, res) =>{
    try {
        const {movieId} = req.params;
        // get all upcoming shows for the movie
        const shows = await Show.find({movie: movieId, showDateTime: { $gte: new Date() }})

        const movie = await Movie.findById(movieId);
        const dateTime = {};

        shows.forEach((show) => {
            const date = show.showDateTime.toISOString().split("T")[0];
            if(!dateTime[date]){
                dateTime[date] = []
            }
            dateTime[date].push({ time: show.showDateTime, showId: show._id })
        })

        res.json({success: true, movie, dateTime})
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
}
