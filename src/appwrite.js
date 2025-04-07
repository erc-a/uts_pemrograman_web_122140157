import { Client, Databases, ID, Query } from 'appwrite';

// Initialize client with better error handling
const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

const database = new Databases(client);

// Validate environment variables
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const SEARCH_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || '';
const SAVED_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SAVED_COLLECTION_ID || '';

if (!DATABASE_ID || !SEARCH_COLLECTION_ID || !SAVED_COLLECTION_ID) {
  console.error('Missing required Appwrite environment variables');
}

// Helper function to validate movie structure
const validateMovie = (movie) => {
  if (!movie || typeof movie !== 'object') {
    throw new Error('Invalid movie object');
  }
  return {
    id: movie.id?.toString() || '',
    title: movie.title || 'Untitled',
    poster_path: movie.poster_path || '',
    vote_average: movie.vote_average || 0,
    release_date: movie.release_date || '',
    original_language: movie.original_language || 'en'
  };
};

export const updateSearchCount = async (searchTerm, movie) => {
  // 1. Use Appwrite SDK to check if the search term exists in the database
 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('searchTerm', searchTerm),
  ])

  // 2. If it does, update the count
  if(result.documents.length > 0) {
   const doc = result.documents[0];

   await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
    count: doc.count + 1,
   })
  // 3. If it doesn't, create a new document with the search term and count as 1
  } else {
   await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    searchTerm,
    count: 1,
    movie_id: movie.id,
    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
   })
  }
 } catch (error) {
  console.error(error);
 }
}


// Get trending movies with improved data validation
export const getTrendingMovies = async () => {
  try {
    const result = await database.listDocuments(DATABASE_ID, SEARCH_COLLECTION_ID, [
      Query.limit(5),
      Query.orderDesc("count")
    ]);
    
    return result.documents.map(doc => ({
      $id: doc.$id,
      searchTerm: doc.searchTerm || '',
      count: doc.count || 0,
      poster_url: doc.poster_url || ''
    }));
  } catch (error) {
    console.error('Error getting trending movies:', error);
    throw new Error('Failed to load trending movies');
  }
};

// Save a movie with enhanced validation
export const saveMovie = async (movie) => {
  try {
    const validatedMovie = validateMovie(movie);
    
    // Check if movie already exists
    const existing = await database.listDocuments(
      DATABASE_ID,
      SAVED_COLLECTION_ID,
      [Query.equal('tmdb_id', validatedMovie.id)]
    );

    if (existing.documents.length > 0) {
      throw new Error('Movie already saved');
    }

    return await database.createDocument(
      DATABASE_ID,
      SAVED_COLLECTION_ID,
      ID.unique(),
      {
        tmdb_id: validatedMovie.id,
        title: validatedMovie.title,
        poster_path: validatedMovie.poster_path,
        vote_average: validatedMovie.vote_average,
        release_date: validatedMovie.release_date,
        original_language: validatedMovie.original_language,
        createdAt: new Date().toISOString()
      }
    );
  } catch (error) {
    console.error('Error saving movie:', error);
    throw new Error(`Failed to save movie: ${error.message}`);
  }
};

export const initializeSavedCollection = async () => {
  try {
    // Cek apakah collection sudah ada
    await database.getCollection(DATABASE_ID, SAVED_COLLECTION_ID);
    console.log('Collection already exists');
  } catch (error) {
    if (error.code === 404) {
      // Buat collection jika tidak ditemukan
      await database.createCollection(
        DATABASE_ID,
        SAVED_COLLECTION_ID,
        'Saved Movies'
      );
      
      // Tambahkan attributes
      const attributes = [
        { key: 'tmdb_id', type: 'string', size: 255, required: true },
        { key: 'title', type: 'string', size: 255, required: true },
        { key: 'poster_path', type: 'string', size: 255, required: false },
        { key: 'vote_average', type: 'float', required: false },
        { key: 'release_date', type: 'string', size: 10, required: false },
        { key: 'original_language', type: 'string', size: 2, required: false }
      ];

      for (const attr of attributes) {
        await database.createStringAttribute(
          DATABASE_ID,
          SAVED_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
      }

      // Set permissions (contoh untuk development)
      await database.updateCollection(
        DATABASE_ID,
        SAVED_COLLECTION_ID,
        'Saved Movies',
        ['role:all'], // Read
        ['role:all']  // Write
      );

      console.log('Collection created successfully');
    } else {
      throw error;
    }
  }
};

// Panggil fungsi ini saat aplikasi dimulai
initializeSavedCollection().catch(console.error);

// Get saved movies with better error handling
export const getSavedMovies = async () => {
  try {
    const result = await database.listDocuments(
      DATABASE_ID,
      SAVED_COLLECTION_ID,
      [Query.orderDesc('createdAt')]
    );

    return result.documents.map(doc => ({
      // Pastikan struktur data sesuai dengan yang diharapkan MovieCard
      id: doc.tmdb_id,
      $id: doc.$id,
      title: doc.title,
      poster_path: doc.poster_path,
      vote_average: doc.vote_average,
      release_date: doc.release_date,
      original_language: doc.original_language,
      // Tambahkan properti lain yang mungkin diperlukan
      poster_url: doc.poster_path 
        ? `https://image.tmdb.org/t/p/w500${doc.poster_path}` 
        : null
    }));
  } catch (error) {
    console.error('Error getting saved movies:', error);
    if (error.code === 404) {
      // Jika koleksi tidak ditemukan, kembalikan array kosong
      return [];
    }
    throw error;
  }
};

// Delete a saved movie with existence check
export const deleteSavedMovie = async (documentId) => {
  try {
    if (!documentId) {
      throw new Error('Missing document ID');
    }

    // Verify document exists first
    await database.getDocument(DATABASE_ID, SAVED_COLLECTION_ID, documentId);
    
    await database.deleteDocument(DATABASE_ID, SAVED_COLLECTION_ID, documentId);
    return true;
  } catch (error) {
    if (error.code === 404) {
      console.error('Document not found:', documentId);
      return false;
    }
    console.error('Error deleting movie:', error);
    throw new Error(`Failed to delete movie: ${error.message}`);
  }
};