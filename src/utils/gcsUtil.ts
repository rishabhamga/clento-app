import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
let storage: Storage;

console.log('🔧 Initializing Google Cloud Storage...');
console.log('Environment check:', {
  hasProjectId: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
  hasBucket: !!process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
  hasServiceAccountKey: !!process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY,
  serviceAccountKeyLength: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY?.length || 0,
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET
});

try {
  if (process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
    console.log('📝 Using service account key from environment variable');
    
    let credentials;
    try {
      credentials = JSON.parse(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY);
      console.log('✅ Service account key parsed successfully');
      console.log('Service account email:', credentials.client_email);
      console.log('Project ID from key:', credentials.project_id);
      console.log('Service account type:', credentials.type);
      
      // Check if this is the default compute service account
      if (credentials.client_email?.includes('compute@developer.gserviceaccount.com')) {
        console.log('⚠️ WARNING: You are using the default compute service account!');
        console.log('⚠️ This account has limited permissions and may not work for storage operations.');
        console.log('⚠️ You need to create a custom service account with Storage permissions.');
      } else {
        console.log('✅ Using custom service account (good!)');
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY:', parseError);
      console.error('Key preview (first 100 chars):', process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY?.substring(0, 100));
      throw new Error('Invalid JSON in GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
    }
    
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || credentials.project_id,
      credentials: credentials,
    });
    
    console.log('✅ Storage initialized with service account key');
    
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('📁 Using service account key file path:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
    
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
    
    console.log('✅ Storage initialized with credentials file');
    
  } else {
    console.log('🔄 Using default credentials (Google Cloud environment)');
    
    storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });
    
    console.log('⚠️ Using default credentials - this may not work in local development');
  }
  
  console.log('🎉 Google Cloud Storage initialized successfully');
  
} catch (error) {
  console.error('❌ Failed to initialize Google Cloud Storage:', error);
  throw new Error(`Google Cloud Storage configuration error: ${error}`);
}

const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'leads-list';
const bucket = storage.bucket(bucketName);

export interface UploadResult {
  success: boolean;
  url?: string;
  publicUrl?: string;
  signedUrl?: string;
  fileName?: string;
  error?: string;
}

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadFileToGCS(
  file: Buffer,
  fileName: string,
  contentType: string = 'application/octet-stream',
  folder: string = ''
): Promise<UploadResult> {
  console.log('🚀 Starting file upload to GCS...');
  console.log('Upload parameters:', {
    fileName,
    contentType,
    folder,
    fileSize: file.length,
    bucketName
  });

  try {
    // Validate environment
    if (!process.env.GOOGLE_CLOUD_PROJECT_ID) {
      throw new Error('GOOGLE_CLOUD_PROJECT_ID environment variable is required');
    }

    if (!process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
      throw new Error('GOOGLE_CLOUD_STORAGE_BUCKET environment variable is required');
    }

    // Create full file path
    const fullFileName = folder ? `${folder}/${fileName}` : fileName;
    console.log('📁 Full file path:', fullFileName);
    
    // Get file reference
    const fileRef = bucket.file(fullFileName);
    console.log('📄 File reference created');

    // Check bucket exists and we have access
    console.log('🔍 Checking bucket access...');
    try {
      const [bucketExists] = await bucket.exists();
      console.log('Bucket exists:', bucketExists);
      
      if (!bucketExists) {
        throw new Error(`Bucket '${bucketName}' does not exist or is not accessible`);
      }
    } catch (bucketError: any) {
      console.error('❌ Bucket access error:', bucketError);
      throw new Error(`Cannot access bucket '${bucketName}': ${bucketError.message}`);
    }

    // Upload file
    console.log('⬆️ Starting file upload...');
    await fileRef.save(file, {
      metadata: {
        contentType: contentType,
        cacheControl: 'public, max-age=31536000', // 1 year cache
      },
      // Remove public: true since uniform bucket-level access is enabled
      // Files will be accessible based on bucket-level permissions
    });

    console.log('✅ File saved to bucket');

    // Generate public URL (works if bucket has public access)
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fullFileName}`;
    console.log('🌐 Generated public URL:', publicUrl);

    // Generate signed URL for secure access (works even with private buckets)
    let signedUrl = publicUrl; // fallback to public URL
    try {
      console.log('🔐 Attempting to generate signed URL...');
      const [generatedSignedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      signedUrl = generatedSignedUrl;
      console.log('✅ Successfully generated signed URL:', signedUrl.substring(0, 100) + '...');
      console.log('🔍 Signed URL contains auth params:', signedUrl.includes('X-Goog-Algorithm'));
    } catch (signedUrlError: any) {
      console.error('❌ Failed to generate signed URL:', signedUrlError.message);
      console.error('🔍 Signed URL error details:', {
        code: signedUrlError.code,
        message: signedUrlError.message,
        serviceAccount: process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY ? 'present' : 'missing'
      });
      console.log('⚠️ Falling back to public URL');
    }

    console.log(`✅ File uploaded successfully to GCS: ${publicUrl}`);
    console.log(`🎯 Primary URL for database storage: ${signedUrl === publicUrl ? 'PUBLIC' : 'SIGNED'}`);

    return {
      success: true,
      url: signedUrl, // Use signed URL as primary URL
      publicUrl: publicUrl,
      signedUrl: signedUrl,
      fileName: fullFileName,
    };

  } catch (error: any) {
    console.error('❌ Error uploading to Google Cloud Storage:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data || error.response
    });
    
    return {
      success: false,
      error: error.message || 'Unknown upload error',
    };
  }
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFileFromGCS(fileName: string): Promise<boolean> {
  try {
    const fileRef = bucket.file(fileName);
    await fileRef.delete();
    console.log(`✅ File deleted successfully from GCS: ${fileName}`);
    return true;
  } catch (error: any) {
    console.error('❌ Error deleting from Google Cloud Storage:', error);
    return false;
  }
}

/**
 * Check if a file exists in Google Cloud Storage
 */
export async function fileExistsInGCS(fileName: string): Promise<boolean> {
  try {
    const fileRef = bucket.file(fileName);
    const [exists] = await fileRef.exists();
    return exists;
  } catch (error: any) {
    console.error('❌ Error checking file existence in GCS:', error);
    return false;
  }
}

/**
 * Generate a signed URL for temporary access (optional)
 */
export async function generateSignedUrl(
  fileName: string,
  expirationMinutes: number = 60
): Promise<string | null> {
  try {
    const fileRef = bucket.file(fileName);
    const [url] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + expirationMinutes * 60 * 1000,
    });
    return url;
  } catch (error: any) {
    console.error('❌ Error generating signed URL:', error);
    return null;
  }
}

export { storage, bucket };
