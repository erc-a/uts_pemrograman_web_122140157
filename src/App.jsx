// import React, { useEffect, useState } from "react";
// import Search from "./components/Search";
// import Spinners from "./components/Spinners";
// import MovieCard from "./components/MovieCard";
// import Navbar from "./components/navbar";
// import { useDebounce } from "react-use";
// import {
//   updateSearchCount,
//   getTrendingMovies,
//   saveMovie,
//   getSavedMovies,
//   deleteSavedMovie
// } from "./appwrite";

// // Konstanta API
// const API_BASE_URL = "https://api.themoviedb.org/3";
// const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// const API_OPTIONS = {
//   method: "GET",
//   headers: {
//     accept: "application/json",
//     Authorization: `Bearer ${API_KEY}` // pastikan ini adalah Bearer Token, bukan API key biasa
//   }
// };

// const App = () => {
//   const [currentView, setCurrentView] = useState("home");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
//   const [movieList, setMovieList] = useState([]);
//   const [savedMovies, setSavedMovies] = useState([]);
//   const [trendingMovies, setTrendingMovies] = useState([]);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);

//   // Fetch movie berdasarkan query
//   const fetchMovies = async (query = '') => {
//     setIsLoading(true);
//     setErrorMessage('');

//     try {
//       const endpoint = query
//         ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
//         : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

//       const response = await fetch(endpoint, API_OPTIONS);

//       if(!response.ok) {
//         throw new Error('Failed to fetch movies');
//       }

//       const data = await response.json();

//       if(data.Response === 'False') {
//         setErrorMessage(data.Error || 'Failed to fetch movies');
//         setMovieList([]);
//         return;
//       }

//       setMovieList(data.results || []);

//       if(query && data.results.length > 0) {
//         await updateSearchCount(query, data.results[0]);
//       }
//     } catch (error) {
//       console.error(`Error fetching movies: ${error}`);
//       setErrorMessage('Error fetching movies. Please try again later.');
//     } finally {
//       setIsLoading(false);
//     }
//   }

//   const fetchTopRatedMovies = async (totalPages = 5) => {
//     setIsLoading(true);
//     try {
//       let allResults = [];

//       for (let page = 1; page <= totalPages; page++) {
//         const response = await fetch(
//           `${API_BASE_URL}/movie/top_rated?page=${page}`,
//           API_OPTIONS
//         );

//         const data = await response.json();
//         allResults = [...allResults, ...data.results];
//       }

//       setMovieList(allResults);
//     } catch (error) {
//       setErrorMessage("Error fetching top rated movies");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchSavedMovies = async () => {
//     setIsLoading(true);
//     setErrorMessage("");

//     try {
//       const saved = await getSavedMovies();
//       const formatted = saved.map((movie) => ({
//         ...movie,
//         id: movie.id || movie.$id,
//         poster_path: movie.poster_path || ""
//       }));

//       setMovieList(formatted);
//       setSavedMovies(formatted.map((m) => m.id));

//       if (formatted.length === 0) {
//         setErrorMessage("No saved movies found.");
//       }
//     } catch (error) {
//       console.error("Error loading saved movies:", error);
//       setErrorMessage("Failed to load saved movies. Please try again.");
//       setMovieList([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSaveMovie = async (movie) => {
//     try {
//       await saveMovie(movie);
//       const movieId = movie.id || movie.$id;
//       if (!savedMovies.includes(movieId)) {
//         setSavedMovies((prev) => [...prev, movieId]);
//       }

//       if (currentView === "saved") {
//         fetchSavedMovies();
//       }
//     } catch (error) {
//       console.error("Failed to save movie:", error);
//     }
//   };

//   const handleDeleteMovie = async (documentId) => {
//     try {
//       await deleteSavedMovie(documentId);
//       setSavedMovies((prev) => prev.filter((id) => id !== documentId));

//       if (currentView === "saved") {
//         fetchSavedMovies();
//       }
//     } catch (error) {
//       console.error("Failed to delete movie:", error);
//     }
//   };

//   const loadTrendingMovies = async () => {
//     try {
//       const movies = await getTrendingMovies();
//       setTrendingMovies(movies);
//     } catch (error) {
//       console.error("Error fetching trending movies:", error);
//     }
//   };

//   useEffect(() => {
//     if (currentView === "home") {
//       fetchMovies(debouncedSearchTerm);
//     } else if (currentView === "top") {
//       fetchTopRatedMovies();
//     } else if (currentView === "saved") {
//       fetchSavedMovies();
//     }
//   }, [debouncedSearchTerm, currentView]);

//   useEffect(() => {
//     loadTrendingMovies();
//   }, []);

//   return (
//     <main>
//       <div className="pattern">
//         <div className="wrapper">
//           <Navbar currentView={currentView} setCurrentView={setCurrentView} />

//           {currentView === "home" && (
//             <header>
//               <img src="./hero.png" alt="Hero Banner" />
//               <h1>
//                 Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle
//               </h1>
//               <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
//             </header>
//           )}

//           {currentView === "home" && trendingMovies.length > 0 && (
//             <section className="trending">
//               <h2>Trending Movies</h2>
//               <ul>
//                 {trendingMovies.map((movie, index) => (
//                   <li key={movie.$id}>
//                     <p>{index + 1}</p>
//                     <img src={movie.poster_url} alt={movie.title} />
//                   </li>
//                 ))}
//               </ul>
//             </section>
//           )}

//           <section className="all-movies">
//             <h2>
//               {currentView === "home" && "All Movies"}
//               {currentView === "top" && "Top 100 Rated Movies"}
//               {currentView === "saved" && "Saved Movies"}
//             </h2>

//             {isLoading ? (
//               <Spinners />
//             ) : errorMessage ? (
//               <p className="text-red-500">{errorMessage}</p>
//             ) : (
//               <ul>
//                 {movieList.map((movie) => (
//                   <MovieCard
//                     key={movie.id || movie.$id}
//                     movie={movie}
//                     onSave={() => handleSaveMovie(movie)}
//                     onDelete={() => handleDeleteMovie(movie.$id)}
//                     isSaved={savedMovies.includes(movie.id || movie.$id)}
//                   />
//                 ))}
//               </ul>
//             )}
//           </section>
//         </div>
//       </div>
//     </main>
//   );
// };

// export default App;


import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Search from "./components/Search";
import Spinners from "./components/Spinners";
import MovieCard from "./components/MovieCard";
import MovieDetail from "./components/MovieDetail";
import Navbar from "./components/navbar";
import MainLayout from './layouts/MainLayout';
import { useDebounce } from "react-use";
import {
  updateSearchCount,
  getTrendingMovies,
  saveMovie,
  getSavedMovies,
  deleteSavedMovie
} from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`
  }
};

const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieList, setMovieList] = useState([]);
  const [savedMovies, setSavedMovies] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);

  // Fungsi untuk memuat daftar film yang disimpan
  const loadSavedMovies = async () => {
    try {
      const saved = await getSavedMovies();
      const formatted = saved.map(m => ({
        ...m,
        id: m.id || m.$id,
        poster_path: m.poster_path || ''
      }));
      setSavedMovies(formatted);
      return formatted;
    } catch (err) {
      console.error('Error loading saved movies:', err);
      setErrorMessage('Failed to load saved movies. Please try again.');
      return [];
    }
  };

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);
      if (!response.ok) throw new Error('Failed to fetch movies');

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        setErrorMessage('No movies found.');
        setMovieList([]);
        return;
      }

      setMovieList(data.results);

      if (query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setErrorMessage('Error fetching movies. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopRatedMovies = async (totalPages = 5) => {
    setIsLoading(true);
    try {
      let allResults = [];
      for (let page = 1; page <= totalPages; page++) {
        const res = await fetch(`${API_BASE_URL}/movie/top_rated?page=${page}`, API_OPTIONS);
        const data = await res.json();
        allResults = [...allResults, ...data.results];
      }
      setMovieList(allResults);
    } catch {
      setErrorMessage('Error fetching top rated movies');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedMovies = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const saved = await loadSavedMovies();
      setMovieList(saved);
      if (saved.length === 0) {
        setErrorMessage('No saved movies found.');
      }
    } catch (err) {
      console.error('Error loading saved movies:', err);
      setErrorMessage('Failed to load saved movies. Please try again.');
      setMovieList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMovie = async (movie) => {
    try {
      await saveMovie(movie);
      // Memuat ulang daftar film yang disimpan setelah menyimpan
      const updatedSavedMovies = await loadSavedMovies();
      
      // Jika di view home, perbarui status saved di movieList
      if (currentView === 'home') {
        setMovieList(prev => prev.map(m => 
          m.id === movie.id ? { ...m, isSaved: true } : m
        ));
      }
    } catch (err) {
      console.error('Failed to save movie:', err);
    }
  };

  const handleDeleteMovie = async (docId) => {
    try {
      await deleteSavedMovie(docId);
      // Memuat ulang daftar film yang disimpan setelah menghapus
      const updatedSavedMovies = await loadSavedMovies();
      
      // Jika di view home, perbarui status saved di movieList
      if (currentView === 'home') {
        setMovieList(prev => prev.map(m => 
          m.$id === docId ? { ...m, isSaved: false } : m
        ));
      }
      
      // Jika di view saved, perbarui movieList
      if (currentView === 'saved') {
        setMovieList(updatedSavedMovies);
      }
    } catch (err) {
      console.error('Failed to delete movie:', err);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      setTrendingMovies(movies);
    } catch (err) {
      console.error('Error fetching trending movies:', err);
    }
  };

  useEffect(() => {
    if (currentView === 'home') {
      fetchMovies(debouncedSearchTerm);
    } else if (currentView === 'top') {
      fetchTopRatedMovies();
    } else if (currentView === 'saved') {
      fetchSavedMovies();
    }
  }, [debouncedSearchTerm, currentView]);

  useEffect(() => {
    // Memuat daftar film yang disimpan dan trending saat komponen pertama kali dimuat
    loadSavedMovies();
    loadTrendingMovies();
  }, []);

  const isMovieSaved = (movie) => {
    return savedMovies.some(m => m.id === movie.id || m.$id === movie.$id);
  };

  return (
    <main>
      <div className="pattern">
        <div className="wrapper">
          <Navbar currentView={currentView} setCurrentView={setCurrentView} />
          <Routes>
            <Route
              path="/"
              element={
                <>
                  {currentView === 'home' && (
                    <header>
                      <img src="./Watchlyst.png" alt="Hero Banner" />
                      <h1>
                        Find What to <span className="text-gradient">Watch</span>, Then Enjoy the Best{' '}
                        <span className="text-gradient">Movies</span>
                      </h1>
                      <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                    </header>
                  )}
  
                  {currentView === 'home' && trendingMovies.length > 0 && (
                    <section className="trending">
                      <h2>Trending Movies</h2>
                      <ul>
                        {trendingMovies.map((movie, index) => (
                          <li key={movie.$id}>
                            <p>{index + 1}</p>
                            <img src={movie.poster_url} alt={movie.title} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
  
                  <section className="all-movies">
                    <h2>
                      {currentView === 'home' && 'All Movies'}
                      {currentView === 'top' && 'Top 100 Rated Movies'}
                      {currentView === 'saved' && 'Saved Movies'}
                    </h2>
  
                    {isLoading ? (
                      <Spinners />
                    ) : errorMessage ? (
                      <p className="text-red-500">{errorMessage}</p>
                    ) : movieList.length === 0 ? (
                      <p className="text-gray-500">No movies to display.</p>
                    ) : (
                      <ul>
                        {movieList.map((movie) => (
                          <MovieCard
                            key={movie.id || movie.$id}
                            movie={movie}
                            onSave={() => handleSaveMovie(movie)}
                            onDelete={() => handleDeleteMovie(movie.$id)}
                            isSaved={isMovieSaved(movie)}
                            showDelete={currentView === 'saved'}
                          />
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              }
            />
  
            <Route
              path="/movie/:id"
              element={
                <div className="pattern">
                  <div className="wrapper">
                    <MovieDetail />
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </div>
    </main>
  );
};

export default App;
