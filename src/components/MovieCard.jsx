import React, { useEffect, useState } from 'react';

const MovieCard = ({ movie, onSave, onDelete, isSaved: isSavedProp = false }) => {
  const {
    title,
    vote_average,
    poster_path,
    release_date,
    original_language,
  } = movie;

  const [isSaved, setIsSaved] = useState(isSavedProp);

  useEffect(() => {
    setIsSaved(isSavedProp);
  }, [isSavedProp]);

  const handleSaveClick = () => {
    if (isSaved) {
      onDelete?.(movie);
    } else {
      onSave?.(movie);
    }
    setIsSaved(!isSaved);
  };

  return (
    <div className='movie-card'>
      <img
        src={poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : './no-movie.png'}
        alt={title}
      />

      <div className='mt-4'>
        <h3>{title}</h3>

        <div className='content'>
          <div className='rating'>
            <img src='star.svg' alt='star' />
            <p>{vote_average ? vote_average.toFixed(1) : 'N/A'}</p>
          </div>

          <span>●</span>
          <p className='lang'>{original_language}</p>

          <span>●</span>
          <p className='year'>{release_date ? release_date.split('-')[0] : 'N/A'}</p>

          <span>●</span>
          <button 
            onClick={handleSaveClick} 
            className={`save-button ${isSaved ? 'saved' : ''}`}
            aria-label={isSaved ? 'Remove from saved' : 'Save movie'}
          >
            {isSaved ? (
              <img src='save-on.svg' alt='Saved' className="save-icon" />
            ) : (
              <img src='save.svg' alt='Save' className="save-icon" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;