import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${id}?language=en-US`,
          {
            method: 'GET',
            headers: {
              accept: 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const data = await response.json();
        setMovie(data);
      } catch (err) {
        setError(err.message);
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (isLoading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-white text-2xl">Loading movie details...</div>
    </div>
  );

  if (error) return (
    <div className="flex flex-col justify-center items-center h-screen text-red-500">
      <div className="text-2xl mb-4">Error loading movie</div>
      <div className="mb-4">{error}</div>
      <button 
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-red-600 text-white rounded"
      >
        Go Back
      </button>
    </div>
  );

  if (!movie) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-white text-2xl">Movie not found</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 text-white">
      <button 
        onClick={() => navigate(-1)} 
        className="mb-6 flex items-center gap-2 text-light-200 hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Back to Movies
      </button>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3 lg:w-1/4">
          <img
            src={movie.poster_path ? 
              `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 
              '/no-movie.png'
            }
            alt={movie.title}
            className="rounded-lg shadow-lg w-full"
          />
        </div>

        <div className="w-full md:w-2/3 lg:w-3/4">
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              <img src="/star.svg" alt="Rating" className="w-5 h-5" />
              <span>{movie.vote_average?.toFixed(1) || 'N/A'}</span>
            </div>
            <span>•</span>
            <span>{movie.release_date?.split('-')[0] || 'N/A'}</span>
            <span>•</span>
            <span className="uppercase">{movie.original_language || 'N/A'}</span>
            {movie.runtime && (
              <>
                <span>•</span>
                <span>{movie.runtime} min</span>
              </>
            )}
          </div>

          {movie.overview && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Overview</h2>
              <p className="text-light-200">{movie.overview}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {movie.genres?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map(genre => (
                    <span key={genre.id} className="px-3 py-1 bg-dark-100 rounded-full text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {movie.production_companies?.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Production Companies</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.production_companies.map(company => (
                    <span key={company.id} className="px-3 py-1 bg-dark-100 rounded-full text-sm">
                      {company.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {movie.homepage && (
              <div className="md:col-span-2">
                <a 
                  href={movie.homepage} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-light-200 hover:text-white transition"
                >
                  Visit Homepage
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;