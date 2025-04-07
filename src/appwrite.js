import { Client, Databases, ID, Query } from 'appwrite';

// ==============================================
// 1. KONFIGURASI DASAR APPWRITE
// ==============================================

// Inisialisasi client dengan pengecekan environment
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_URL || 'https://cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || '');

const database = new Databases(client);

// ==============================================
// 2. VALIDASI ENVIRONMENT VARIABLES
// ==============================================

const validateEnvironment = () => {
  const requiredVars = {
    databaseId: 'VITE_APPWRITE_DATABASE_ID',
    searchCollectionId: 'VITE_APPWRITE_COLLECTION_ID',
    savedCollectionId: 'VITE_APPWRITE_SAVED_COLLECTION_ID'
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, envVar]) => !import.meta.env[envVar])
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    const errorMessage = `Missing required Appwrite environment variables: ${missingVars.join(', ')}`;
    
    if (import.meta.env.MODE === 'production') {
      throw new Error(errorMessage);
    } else {
      console.warn('[DEV WARNING]', errorMessage);
    }
  }
};

validateEnvironment();

// ==============================================
// 3. KONSTANTA UTAMA
// ==============================================

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SEARCH_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;
const SAVED_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SAVED_COLLECTION_ID;

// ==============================================
// 4. FUNGSI UTILITAS
// ==============================================

const transformMovieDocument = (doc) => ({
  id: doc.tmdb_id,
  $id: doc.$id,
  title: doc.title,
  poster_path: doc.poster_path,
  vote_average: parseFloat(doc.vote_average) || 0,
  release_date: doc.release_date || 'Unknown',
  original_language: doc.original_language || 'en',
  poster_url: doc.poster_path 
    ? `https://image.tmdb.org/t/p/w500${doc.poster_path}`
    : '/no-movie.png',
  createdAt: doc.createdAt || new Date().toISOString()
});

const validateMovieData = (movie) => {
  if (!movie || typeof movie !== 'object') {
    throw new Error('Invalid movie data: must be an object');
  }

  return {
    id: String(movie.id || ''),
    title: String(movie.title || 'Untitled Movie'),
    poster_path: String(movie.poster_path || ''),
    vote_average: parseFloat(movie.vote_average) || 0,
    release_date: String(movie.release_date || ''),
    original_language: String(movie.original_language || 'en')
  };
};

// ==============================================
// 5. INISIALISASI COLLECTION (DEV ONLY)
// ==============================================

const initializeCollections = async () => {
  // Hanya jalankan di development
  if (import.meta.env.MODE !== 'development') {
    return;
  }

  try {
    // Cek apakah saved collection sudah ada
    await database.getCollection(DATABASE_ID, SAVED_COLLECTION_ID);
    console.log('[Appwrite] Saved collection already exists');
  } catch (error) {
    if (error.code === 404 || error.type === 'collection_not_found') {
      console.log('[Appwrite] Creating saved collection...');
      await createSavedCollection();
    }
  }
};

const createSavedCollection = async () => {
  try {
    // Buat collection baru
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
      { key: 'original_language', type: 'string', size: 2, required: false },
      { key: 'createdAt', type: 'string', size: 30, required: false }
    ];

    // Buat semua attributes
    for (const attr of attributes) {
      if (attr.type === 'string') {
        await database.createStringAttribute(
          DATABASE_ID,
          SAVED_COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
      } else if (attr.type === 'float') {
        await database.createFloatAttribute(
          DATABASE_ID,
          SAVED_COLLECTION_ID,
          attr.key,
          attr.required
        );
      }
    }

    console.log('[Appwrite] Saved collection created successfully');
  } catch (error) {
    console.error('[Appwrite] Failed to create collection:', error);
  }
};

// Jalankan inisialisasi saat module dimuat
initializeCollections().catch(console.error);

// ==============================================
// 6. FUNGSI UTAMA API
// ==============================================

export const updateSearchCount = async (searchTerm, movie) => {
  try {
    if (!searchTerm || !movie) {
      throw new Error('Missing searchTerm or movie data');
    }

    const result = await database.listDocuments(DATABASE_ID, SEARCH_COLLECTION_ID, [
      Query.equal('searchTerm', searchTerm),
      Query.limit(1)
    ]);

    if (result.documents.length > 0) {
      const doc = result.documents[0];
      await database.updateDocument(DATABASE_ID, SEARCH_COLLECTION_ID, doc.$id, {
        count: (doc.count || 0) + 1,
        lastSearched: new Date().toISOString()
      });
    } else {
      await database.createDocument(DATABASE_ID, SEARCH_COLLECTION_ID, ID.unique(), {
        searchTerm,
        count: 1,
        movie_id: movie.id,
        poster_url: movie.poster_path 
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : '',
        firstSearched: new Date().toISOString(),
        lastSearched: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[Appwrite] Error updating search count:', error);
    throw new Error('Failed to update search history');
  }
};

export const getTrendingMovies = async (limit = 5) => {
  try {
    const result = await database.listDocuments(DATABASE_ID, SEARCH_COLLECTION_ID, [
      Query.orderDesc('count'),
      Query.orderDesc('lastSearched'),
      Query.limit(limit)
    ]);

    return result.documents.map(doc => ({
      id: doc.movie_id,
      searchTerm: doc.searchTerm,
      count: doc.count || 0,
      posterUrl: doc.poster_url || '',
      lastSearched: doc.lastSearched
    }));
  } catch (error) {
    console.error('[Appwrite] Error getting trending movies:', error);
    return [];
  }
};

export const saveMovie = async (movieData) => {
  try {
    const movie = validateMovieData(movieData);

    // Cek apakah movie sudah ada
    const existing = await database.listDocuments(
      DATABASE_ID,
      SAVED_COLLECTION_ID,
      [Query.equal('tmdb_id', movie.id)]
    );

    if (existing.documents.length > 0) {
      return { 
        success: false, 
        message: 'Movie already saved',
        document: transformMovieDocument(existing.documents[0])
      };
    }

    // Simpan movie baru
    const doc = await database.createDocument(
      DATABASE_ID,
      SAVED_COLLECTION_ID,
      ID.unique(),
      {
        tmdb_id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date,
        original_language: movie.original_language,
        createdAt: new Date().toISOString()
      }
    );

    return { 
      success: true, 
      message: 'Movie saved successfully',
      document: transformMovieDocument(doc)
    };
  } catch (error) {
    console.error('[Appwrite] Error saving movie:', error);
    throw new Error(`Failed to save movie: ${error.message}`);
  }
};

export const getSavedMovies = async () => {
  try {
    const result = await database.listDocuments(
      DATABASE_ID,
      SAVED_COLLECTION_ID,
      [Query.orderDesc('createdAt')]
    );

    return result.documents.map(transformMovieDocument);
  } catch (error) {
    console.error('[Appwrite] Error getting saved movies:', error);
    
    // Handle khusus untuk collection tidak ditemukan
    if (error.code === 404 || error.type === 'collection_not_found') {
      return [];
    }
    
    // Handle khusus untuk permission denied
    if (error.code === 401 || error.code === 403) {
      console.error('[Appwrite] Permission denied, check Appwrite settings');
      return [];
    }
    
    throw error;
  }
};

export const deleteSavedMovie = async (documentId) => {
  try {
    if (!documentId) {
      throw new Error('Missing document ID');
    }

    // Verifikasi dokumen ada sebelum menghapus
    await database.getDocument(DATABASE_ID, SAVED_COLLECTION_ID, documentId);
    
    await database.deleteDocument(DATABASE_ID, SAVED_COLLECTION_ID, documentId);
    
    return { 
      success: true,
      message: 'Movie deleted successfully'
    };
  } catch (error) {
    console.error('[Appwrite] Error deleting movie:', error);
    
    if (error.code === 404) {
      return {
        success: false,
        message: 'Movie not found'
      };
    }
    
    throw new Error(`Failed to delete movie: ${error.message}`);
  }
};

// ==============================================
// 7. EXPORT FUNGSI UTAMA
// ==============================================

export default {
  updateSearchCount,
  getTrendingMovies,
  saveMovie,
  getSavedMovies,
  deleteSavedMovie
};