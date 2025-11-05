import { gzip } from 'fflate';

export class GenericCompressionService {
  static async compressFile(file, compressionLevel = 'medium') {
    try {
      console.log('📦 Starting generic compression:', file.name);
      
      // Ne pas compresser les petits fichiers
      if (file.size < 1024 * 10) { // 10KB
        console.log('File too small, skipping compression');
        return file;
      }
      
      // Ne pas compresser les fichiers déjà compressés
      if (this.isAlreadyCompressed(file)) {
        console.log('File already compressed, skipping');
        return file;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Compression avec fflate (très rapide)
      const compressedData = await new Promise((resolve, reject) => {
        gzip(uint8Array, {
          level: this.getCompressionLevel(compressionLevel),
          mem: 9 // Utilisation mémoire maximale
        }, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      
      // Vérifier que la compression a réduit la taille
      if (compressedData.length >= uint8Array.length) {
        console.log('Compression did not reduce size, using original');
        return file;
      }
      
      const compressedFile = new File(
        [compressedData],
        `${file.name}.gz`,
        { type: 'application/gzip' }
      );
      
      console.log('✅ Generic compression successful:',
        this.formatFileSize(file.size), '→',
        this.formatFileSize(compressedFile.size)
      );
      
      return compressedFile;
      
    } catch (error) {
      console.error('❌ Generic compression failed:', error);
      return file;
    }
  }
  
  static getCompressionLevel(level) {
    const levels = { 
      high: 9,   // Compression maximale
      medium: 6, // Compression équilibrée
      low: 3     // Compression rapide
    };
    return levels[level] || 6;
  }
  
  static isAlreadyCompressed(file) {
    const compressedTypes = [
      'application/zip', 'application/gzip', 'application/x-rar-compressed',
      'application/x-7z-compressed', 'video/', 'audio/', 'image/jpeg', 'image/jpg'
    ];
    
    const compressedExtensions = ['.zip', '.gz', '.rar', '.7z', '.jpg', '.jpeg', '.mp3', '.mp4'];
    
    return compressedTypes.some(type => file.type.includes(type)) ||
           compressedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }
  
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}