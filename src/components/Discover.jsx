import Carusel from "./Carusel";
import Navbar from "./Navbar";
import Header from "./Header";
import MovieCard from "./MovieCard";
import { useState, useEffect } from "react";
import Overlay from "./Overlay";
import { getMovies, getMoviesWithGenres, getMovieDetails } from "../api/api";

const Discover = ({ movieData, setMovieData }) => {
    const [showOverlay, setShowOverlay] = useState(false);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [landingMovie, setLandingMovie] = useState(null);

    // Lyssna på URL-ändringar
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const movieIDFromURL = urlParams.get('jbv'); // Hämta filmens ID från URL

        if (movieIDFromURL && !selectedMovie) {
            const getMovie = async () => {
                try {
                    const movie = await getMovieDetails(parseInt(movieIDFromURL));
                    setSelectedMovie(movie);
                    setShowOverlay(true);
                } catch (error) {
                    console.error('Error fetching movie data:', error);
                }
            };
            getMovie();
        }
    }, [window.location.search, selectedMovie]);

    const handlePosterPress = (movie) => {
        setSelectedMovie(movie); // Sätt vald film
        setShowOverlay(true); // Visa overlay
        // Uppdatera URL utan att ladda om sidan
        window.history.pushState({}, '', `?jbv=${movie.id}`);
    };

    const closeOverlay = () => {
        setShowOverlay(false); // Stäng overlay
        setSelectedMovie(null); // Nollställ vald film
        // Återställ URL till standardvärdet
        window.history.pushState({}, '', window.location.pathname);
    };

    const fillHeader = (movieData) => {
        const randomIndex = Math.floor(Math.random() * movieData.results.length);
        const firstMovie = movieData.results[randomIndex];
        setLandingMovie(firstMovie); // Sätt första filmen som landningssidans film
    };

    useEffect(() => {
        if (Object.keys(movieData).length === 0) {
            const fetchAllData = async () => {
                try {
                    const data = await fetchMovieData();
                    fillHeader(data.popular);
                    setMovieData(data); // Uppdatera state med all genre-data
                } catch (error) {
                    console.error('Error fetching movie data:', error);
                }
            };
            fetchAllData();
        }
    }, [movieData]);

    const genres = [
        { id: 28, name: "Action" },
        { id: 12, name: "Adventure" },
        { id: 16, name: "Animation" },
        { id: 35, name: "Comedy" },
        { id: 80, name: "Crime" },
        { id: 99, name: "Documentary" },
        { id: 18, name: "Drama" },
        { id: 10751, name: "Family" },
    ];

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    const fetchMovieData = async () => {
        const data = { popular: await getMovies() };
        const promises = genres.map(async (genre) => {
            const genreData = await getMoviesWithGenres(genre.id);
            genreData.results = shuffleArray(genreData.results);
            data[genre.name] = genreData;
        });
        await Promise.all(promises);
        return data;
    };

    const renderCarusels = () => {
        if (!movieData || Object.keys(movieData).length === 0) {
            return <div>Loading...</div>;
        }

        const popularMovies = movieData.popular.results || [];
        const popularMovieCards = popularMovies.map((movie) => (
            <MovieCard
                url={movie.poster_path}
                key={movie.id}
                onPress={() => handlePosterPress(movie)}
                isSelected={selectedMovie !== null && movie.id === selectedMovie.id}
            />
        ));

        return (
            <>
                <div className="popular-movie-container">
                    <Carusel items={popularMovieCards} title="Popular" />
                </div>
                {genres.map((genre) => {
                    const movies = movieData[genre.name]?.results || [];
                    const movieCards = movies.map((movie) => (
                        <MovieCard
                            url={movie.poster_path}
                            key={movie.id}
                            onPress={() => handlePosterPress(movie)}
                            isSelected={selectedMovie !== null && movie.id === selectedMovie.id}
                        />
                    ));
                    return (
                        <div key={genre.id} className="popular-movie-container">
                            <Carusel items={movieCards} title={genre.name} />
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <>
            <div className="body-container">
                <div className="header-container">
                    <Navbar />
                    {landingMovie && (
                        <Header movie={landingMovie} />
                    )}
                </div>
                <div className="movie-genre-container">{renderCarusels()}</div>
            </div>
            {/* Overlay */}
            <Overlay show={showOverlay} onClose={closeOverlay}>
                {selectedMovie && (
                    <Header movie={selectedMovie} isOverlay={true} onClose={closeOverlay} />
                )}
            </Overlay>

        </>
    );
};

export default Discover;
