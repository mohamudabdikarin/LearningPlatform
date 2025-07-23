import { NhostClient } from '@nhost/nhost-js';

const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN;
const region = import.meta.env.VITE_NHOST_REGION;

if (!subdomain || !region) {
  console.warn('Nhost configuration missing. Please set VITE_NHOST_SUBDOMAIN and VITE_NHOST_REGION in your .env file');
}

export const nhost = new NhostClient({
  subdomain,
  region,
});

// Storage helper functions
export const nhostStorage = {
  // Upload file to Nhost storage
  upload: async (file, bucketId = 'default') => {
    try {
      const { fileMetadata, error } = await nhost.storage.upload({
        file,
        isPublic: true,
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        id: fileMetadata.id,
        name: fileMetadata.name,
        url: nhost.storage.getPublicUrl({ fileId: fileMetadata.id }),
        mimeType: fileMetadata.mimeType,
        size: fileMetadata.size,
      };
    } catch (error) {
      console.error('Nhost upload error:', error);
      throw error;
    }
  },

  // Get public URL for a file
  getPublicUrl: (fileId) => {
    return nhost.storage.getPublicUrl({ fileId });
  },

  // Get presigned URL for private files
  getPresignedUrl: async (fileId, expiresIn = 3600) => {
    try {
      const { presignedUrl, error } = await nhost.storage.getPresignedUrl({
        fileId,
        expiresIn,
      });

      if (error) {
        throw new Error(error.message);
      }

      return presignedUrl.url;
    } catch (error) {
      console.error('Nhost presigned URL error:', error);
      throw error;
    }
  },

  // Delete file
  delete: async (fileId) => {
    try {
      const { error } = await nhost.storage.delete({ fileId });

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error) {
      console.error('Nhost delete error:', error);
      throw error;
    }
  },
};

export default nhost;