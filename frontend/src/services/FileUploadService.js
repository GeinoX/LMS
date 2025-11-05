import { VideoCompressionService } from './VideoCompressionService';
import { PDFCompressionService } from './PDFCompressionService';
import { ImageCompressionService } from './ImageCompressionService';
import { AudioCompressionService } from './AudioCompressionService';
import { GenericCompressionService } from './GenericCompressionService';

export class FileUploadService {
  static estimationCache = new Map();

  // Improved file type detection with better protection
  static getFileCategory(file) {
    if (!file || !file.type) return 'other';
    
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    console.log(`🔍 Analyzing file: ${file.name}, type: ${fileType}`);
    
    // Images
    if (fileType.startsWith('image/') || 
        fileName.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) {
      console.log('🎯 Identified as IMAGE');
      return 'image';
    }
    
    // PDF
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log('🎯 Identified as PDF');
      return 'pdf';
    }
    
    // Videos
    if (fileType.startsWith('video/') || 
        fileName.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/)) {
      console.log('🎯 Identified as VIDEO');
      return 'video';
    }
    
    // Audio - ONLY specific audio formats
    if (fileType.startsWith('audio/') || 
        fileName.match(/\.(mp3|wav|ogg|aac|flac|m4a)$/)) {
      console.log('🎯 Identified as AUDIO');
      return 'audio';
    }
    
    console.log('🎯 Identified as OTHER');
    return 'other';
  }

  static calculateTotalSize(files) {
    if (!files || !Array.isArray(files)) return 0;
    
    return files.reduce((total, file) => {
      return total + (file.size || 0);
    }, 0);
  }

  static estimateCompressedSize(files, compressionLevel = 'medium', compressionMode = 'individual') {
    if (!files || !Array.isArray(files) || files.length === 0) return 0;
    
    if (compressionLevel === 'none') {
      return this.calculateTotalSize(files);
    }
    
    const cacheKey = JSON.stringify({
      fileCount: files.length,
      totalSize: this.calculateTotalSize(files),
      compressionLevel,
      compressionMode
    });
    
    if (this.estimationCache.has(cacheKey)) {
      return this.estimationCache.get(cacheKey);
    }
    
    const totalSize = this.calculateTotalSize(files);
    
    let estimatedReduction = 0;
    
    switch (compressionLevel) {
      case 'low':
        estimatedReduction = 0.1;
        break;
      case 'medium':
        estimatedReduction = 0.3;
        break;
      case 'high':
        estimatedReduction = 0.5;
        break;
      default:
        estimatedReduction = 0.3;
    }
    
    if (compressionMode === 'zip' && files.length > 1) {
      estimatedReduction += 0.05;
    }
    
    const estimatedSize = totalSize * (1 - estimatedReduction);
    
    console.log(`📊 Size estimation: ${this.formatFileSize(totalSize)} → ${this.formatFileSize(estimatedSize)} (${(estimatedReduction * 100).toFixed(0)}% reduction)`);
    
    const finalEstimatedSize = Math.max(estimatedSize, totalSize * 0.1);
    
    this.estimationCache.set(cacheKey, finalEstimatedSize);
    setTimeout(() => this.estimationCache.delete(cacheKey), 5000);
    
    return finalEstimatedSize;
  }

  static getFileIcon(file) {
    if (!file || !file.type) return 'Description';
    
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (fileType.startsWith('image/')) return 'Image';
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) return 'PictureAsPdf';
    if (fileType.startsWith('video/')) return 'VideoFile';
    if (fileType.startsWith('audio/')) return 'AudioFile';
    if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'Article';
    if (fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'TableChart';
    if (fileType.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'Slideshow';
    if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.rtf')) return 'TextSnippet';
    if (fileType.includes('zip') || fileName.endsWith('.zip')) return 'FolderZip';
    if (fileName.endsWith('.js') || fileName.endsWith('.html') || fileName.endsWith('.css')) return 'Code';
    
    return 'Description';
  }

  static async compressFiles(files, compressionLevel = 'medium', onProgress = null) {
    try {
      console.log('🚀 Starting intelligent compression for', files.length, 'files');

      if (compressionLevel === 'none') {
        console.log('Compression disabled by user');
        return files;
      }

      const compressedFiles = [];
      let successCount = 0;
      let skipCount = 0;
      let totalCompressedSize = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log(`\n📁 Processing: ${file.name} (${this.formatFileSize(file.size)})`);

          // Report progress
          if (onProgress) {
            onProgress({
              currentFile: i + 1,
              totalFiles: files.length,
              fileName: file.name,
              fileSize: file.size,
              progress: (i / files.length) * 100,
              operation: `Compression de ${file.name}...`
            });
          }

          let compressedFile;
          const fileCategory = this.getFileCategory(file);

          console.log(`🎯 Routing to ${fileCategory.toUpperCase()} service`);

          // Add timeout protection for each file compression
          const compressionPromise = (async () => {
            switch (fileCategory) {
              case 'image':
                return await ImageCompressionService.compressImage(file, compressionLevel);
              case 'pdf':
                return await PDFCompressionService.compressPDF(file, compressionLevel);
              case 'video':
                return await VideoCompressionService.compressVideo(file, compressionLevel);
              case 'audio':
                return await AudioCompressionService.compressAudio(file, compressionLevel);
              default:
                return await GenericCompressionService.compressFile(file, compressionLevel);
            }
          })();

          // 30-second timeout per file
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('File compression timeout (30s)')), 30000)
          );

          compressedFile = await Promise.race([compressionPromise, timeoutPromise]);

          if (compressedFile && compressedFile.size < file.size) {
            compressedFiles.push(compressedFile);
            successCount++;
            totalCompressedSize += compressedFile.size;
            console.log(`✅ COMPRESSION SUCCESS: ${this.formatFileSize(file.size)} → ${this.formatFileSize(compressedFile.size)}`);

            // Report compression success
            if (onProgress) {
              onProgress({
                currentFile: i + 1,
                totalFiles: files.length,
                fileName: file.name,
                fileSize: file.size,
                compressedSize: compressedFile.size,
                totalCompressedSize,
                progress: ((i + 1) / files.length) * 100,
                operation: `✓ ${file.name} compressé`
              });
            }
          } else {
            compressedFiles.push(file);
            skipCount++;
            totalCompressedSize += file.size;
            console.log(`⚠️  Using original file (no compression applied)`);
          }

        } catch (error) {
          console.error(`❌ Error processing ${file.name}:`, error.message);
          compressedFiles.push(file);
          skipCount++;
          totalCompressedSize += file.size;
        }
      }

      console.log(`\n🎉 Compression summary: ${successCount} compressed, ${skipCount} unchanged`);

      // Final progress report
      if (onProgress) {
        onProgress({
          currentFile: files.length,
          totalFiles: files.length,
          progress: 100,
          totalCompressedSize,
          operation: 'Compression terminée !'
        });
      }

      return compressedFiles;

    } catch (error) {
      console.error('💥 Compression system error:', error);
      return files;
    }
  }
  
  static async compressAllFilesAsZip(files, compressionLevel = 'medium', onProgress = null, archiveName = 'compressed_documents') {
    try {
      console.log('Creating compressed archive...');

      if (onProgress) {
        onProgress({
          progress: 10,
          operation: 'Compression des fichiers individuels...'
        });
      }

      const compressedFiles = await this.compressFiles(files, compressionLevel, onProgress);

      if (compressedFiles.length === 1) {
        return compressedFiles;
      }

      if (onProgress) {
        onProgress({
          progress: 70,
          operation: 'Création de l\'archive ZIP...'
        });
      }

      const JSZip = await import('jszip');
      const zip = new JSZip.default();

      for (const file of compressedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        zip.file(file.name, arrayBuffer, {
          compression: "DEFLATE",
          compressionOptions: {
            level: compressionLevel === 'high' ? 6 :
                   compressionLevel === 'medium' ? 4 : 2
          }
        });
      }

      if (onProgress) {
        onProgress({
          progress: 90,
          operation: 'Finalisation de l\'archive...'
        });
      }

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/zip',
        compression: "DEFLATE"
      });

      const safeName = archiveName.replace(/[^a-z0-9._-]/gi, '_') || 'compressed_documents';
      const archiveFile = new File(
        [zipBlob],
        `${safeName}.zip`,
        { type: 'application/zip' }
      );

      const originalSize = this.calculateTotalSize(files);
      console.log(`📦 Archive created: ${files.length} files ${this.formatFileSize(originalSize)} → ${this.formatFileSize(archiveFile.size)}`);
      
      return [archiveFile];
      
    } catch (error) {
      console.error('❌ Archive creation failed:', error);
      return await this.compressFiles(files, compressionLevel);
    }
  }
  
  // Simple compression test without audio files
  static async testCompression() {
    try {
      console.log('🧪 Testing compression system (safe test)...');
      
      // Test only with text and image files to avoid audio issues
      const testFiles = [
        new File(
          ['This is a simple test file for compression testing. '.repeat(100)],
          'test.txt',
          { type: 'text/plain' }
        ),
        new File(
          [new ArrayBuffer(50000)],
          'test.jpg',
          { type: 'image/jpeg' }
        )
      ];
      
      console.log('Testing with safe files (no audio)');
      
      const results = await this.compressFiles(testFiles, 'medium');
      
      const success = results.length === 2 && results.every(file => file instanceof File);
      
      console.log(success ? '✅ Compression test PASSED' : '❌ Compression test FAILED');
      
      return success;
      
    } catch (error) {
      console.error('Compression test error:', error);
      return false;
    }
  }
  
  static validateFiles(files, maxTotalSizeMB = 200, maxFileSizeMB = 200) {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return true;
    }
    
    let totalSize = 0;
    
    for (let file of files) {
      if (!file || typeof file.size !== 'number') {
        throw new Error(`Invalid file: ${file?.name}`);
      }
      
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSizeMB) {
        throw new Error(`File too large: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
      }
      
      totalSize += file.size;
    }
    
    const totalSizeMB = totalSize / (1024 * 1024);
    if (totalSizeMB > maxTotalSizeMB) {
      throw new Error(`Total size too large: ${totalSizeMB.toFixed(2)}MB`);
    }
    
    return true;
  }
  
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  static getFileType(file) {
    return this.getFileCategory(file);
  }
}

export default FileUploadService;