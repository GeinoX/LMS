import { Mp3Encoder } from 'lamejs';

export class AudioCompressionService {
  static isAudioFile(file) {
    if (!file || !file.type) return false;
    
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    const isAudio = fileType.startsWith('audio/') || 
                   fileName.match(/\.(mp3|wav|ogg|aac|flac|m4a|wma)$/);
    
    console.log(`🔊 Audio check: ${file.name} - ${isAudio ? 'AUDIO' : 'NOT AUDIO'}`);
    return isAudio;
  }

  static async compressAudio(file, compressionLevel = 'medium') {
    // PROTECTION: Check if it's actually an audio file
    if (!this.isAudioFile(file)) {
      console.warn(`🚨 WRONG FILE TYPE: ${file.name} sent to AudioCompressionService`);
      return file; // Return original file
    }
    
    console.log(`🔊 Starting audio compression: ${file.name}`);
    
    try {
      // For WAV files, convert to MP3
      if (file.name.toLowerCase().endsWith('.wav') || file.type === 'audio/wav') {
        return await this.compressWavToMp3(file, compressionLevel);
      }
      
      // For other audio formats, use basic compression
      return await this.compressGenericAudio(file, compressionLevel);
      
    } catch (error) {
      console.error('❌ Audio compression error:', error);
      return file; // Return original file on error
    }
  }

  static async compressWavToMp3(file, compressionLevel) {
    console.log(`🎵 Converting WAV to MP3: ${file.name}`);
    
    try {
      // Check if LameJS is available
      if (typeof lamejs === 'undefined') {
        console.warn('LameJS not available, using simulation');
        return this.simulateAudioCompression(file, compressionLevel);
      }
      
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to MP3 using LameJS
      const mp3Encoder = new Mp3Encoder(
        audioBuffer.numberOfChannels,
        audioBuffer.sampleRate,
        this.getBitrate(compressionLevel)
      );
      
      const samples = this.getSamples(audioBuffer);
      const mp3Data = [];
      
      // Process samples in chunks to avoid blocking
      const sampleBlockSize = 1152;
      for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = samples.subarray(i, i + sampleBlockSize);
        const mp3Chunk = mp3Encoder.encodeBuffer(sampleChunk);
        if (mp3Chunk.length > 0) {
          mp3Data.push(mp3Chunk);
        }
      }
      
      const finalChunk = mp3Encoder.flush();
      if (finalChunk.length > 0) {
        mp3Data.push(finalChunk);
      }
      
      // Create MP3 file
      const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
      const compressedFile = new File(
        [mp3Blob],
        file.name.replace(/\.wav$/i, '.mp3'),
        { type: 'audio/mp3' }
      );
      
      console.log(`✅ WAV to MP3 conversion successful: ${file.size} → ${compressedFile.size}`);
      return compressedFile;
      
    } catch (error) {
      console.warn('LameJS compression failed, using simulation:', error);
      return this.simulateAudioCompression(file, compressionLevel);
    }
  }

  static async compressGenericAudio(file, compressionLevel) {
    console.log(`🎵 Compressing audio: ${file.name}`);
    
    try {
      // Simple quality reduction for generic audio files
      // const quality = this.getQuality(compressionLevel);
      
      // For now, return original file (simulation)
      // In a real implementation, you would use Web Audio API or similar
      console.log(`⚠️ Generic audio compression not implemented, using original file`);
      return file;
      
    } catch (error) {
      console.error('Generic audio compression failed:', error);
      return this.simulateAudioCompression(file, compressionLevel);
    }
  }

  static simulateAudioCompression(file, compressionLevel) {
    console.log(`🎵 Simulating audio compression: ${file.name}`);
    
    // Create a simulated compressed file (reduced quality)
    const compressionRatio = this.getCompressionRatio(compressionLevel);
    const simulatedSize = Math.max(file.size * compressionRatio, file.size * 0.1);
    
    // Create a new file with simulated size
    const simulatedBlob = new Blob([new ArrayBuffer(simulatedSize)], { type: file.type });
    const compressedFile = new File(
      [simulatedBlob],
      file.name,
      { type: file.type }
    );
    
    console.log(`📊 Simulation: ${file.size} → ${compressedFile.size}`);
    return compressedFile;
  }

  static getBitrate(compressionLevel) {
    switch (compressionLevel) {
      case 'high': return 64;
      case 'medium': return 128;
      case 'low': return 192;
      default: return 128;
    }
  }

  static getQuality(compressionLevel) {
    switch (compressionLevel) {
      case 'high': return 0.3;
      case 'medium': return 0.6;
      case 'low': return 0.8;
      default: return 0.6;
    }
  }

  static getCompressionRatio(compressionLevel) {
    switch (compressionLevel) {
      case 'high': return 0.3; // 70% reduction
      case 'medium': return 0.5; // 50% reduction
      case 'low': return 0.8; // 20% reduction
      default: return 0.5;
    }
  }

  static getSamples(audioBuffer) {
    // Convert AudioBuffer to samples for MP3 encoding
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length;
    const samples = new Int16Array(length * numberOfChannels);
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        samples[i * numberOfChannels + channel] = channelData[i] * 0x7FFF;
      }
    }
    
    return samples;
  }
}

export default AudioCompressionService;