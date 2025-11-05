import { PDFDocument } from 'pdf-lib';

export class PDFCompressionService {
  static async compressPDF(file, compressionLevel = 'medium') {
    try {
      console.log('📄 Starting PDF compression:', file.name);
      
      // Pour les petits PDF, ne pas compresser
      if (file.size < 1024 * 1024) { // 1MB
        console.log('PDF already small, skipping compression');
        return file;
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Options de compression selon le niveau
      const saveOptions = this.getSaveOptions(compressionLevel);
      
      // Sauvegarder avec compression
      const compressedPdfBytes = await pdfDoc.save(saveOptions);
      
      const compressedFile = new File(
        [compressedPdfBytes],
        `compressed_${file.name}`,
        { type: 'application/pdf' }
      );
      
      console.log('✅ PDF processed:',
        this.formatFileSize(file.size), '→',
        this.formatFileSize(compressedFile.size)
      );
      
      return compressedFile;
      
    } catch (error) {
      console.error('❌ PDF compression failed:', error);
      // Retourner le fichier original en cas d'erreur
      return file;
    }
  }
  
  static getSaveOptions(level) {
    const options = {
      useObjectStreams: true,
      addDefaultPage: false,
    };
    
    // Niveaux de compression plus agressifs
    if (level === 'high') {
      return {
        ...options,
        objectsPerStream: 20,
      };
    } else if (level === 'medium') {
      return {
        ...options,
        objectsPerStream: 30,
      };
    } else {
      return options;
    }
  }
  
  static isPDFFile(file) {
    return file.type === 'application/pdf' || 
           file.name.toLowerCase().endsWith('.pdf');
  }
  
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}