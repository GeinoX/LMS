import imageCompression from 'browser-image-compression';

export class ImageCompressionService {
  static async compressImage(file, compressionLevel = 'medium') {
    try {
      console.log('🖼️ Starting image compression:', file.name);
      
      const options = {
        maxSizeMB: this.getMaxSizeMB(compressionLevel),
        maxWidthOrHeight: this.getMaxDimensions(compressionLevel),
        useWebWorker: true,
        fileType: file.type,
        initialQuality: this.getQuality(compressionLevel),
      };
      
      console.log('Compression options:', options);
      
      const compressedFile = await imageCompression(file, options);
      
      console.log('✅ Image compressed:',
        this.formatFileSize(file.size), '→',
        this.formatFileSize(compressedFile.size)
      );
      
      return compressedFile;
      
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      // Retourner l'original en cas d'erreur
      return file;
    }
  }
  
  static getMaxSizeMB(level) {
    const sizes = { 
      high: 0.1,    // 100KB max
      medium: 0.5,  // 500KB max  
      low: 1.0      // 1MB max
    };
    return sizes[level] || 0.5;
  }
  
  static getMaxDimensions(level) {
    const dimensions = { 
      high: 800,    // 800px max
      medium: 1200, // 1200px max
      low: 1920     // 1920px max
    };
    return dimensions[level] || 1200;
  }
  
  static getQuality(level) {
    const qualities = { 
      high: 0.6,    // 60% quality
      medium: 0.7,  // 70% quality
      low: 0.8      // 80% quality
    };
    return qualities[level] || 0.7;
  }
  
  static isImageFile(file) {
    const imageTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'image/bmp', 'image/tiff'
    ];
    return imageTypes.includes(file.type);
  }
  
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}