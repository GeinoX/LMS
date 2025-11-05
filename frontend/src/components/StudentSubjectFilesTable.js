import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  IconButton,
  Chip,
  Collapse,
  Alert,
  CircularProgress,
  Button,
  Grid
} from '@mui/material';
import {
  Download,
  Folder,
  ExpandMore,
  ExpandLess,
  Image,
  PictureAsPdf,
  VideoLibrary,
  AudioFile,
  Description,
  FolderZip,
  Warning,
  Compress,
  InsertDriveFile,
  TableChart
} from '@mui/icons-material';
import { CloudUpload } from '@mui/icons-material';
import axios from 'axios';
import FileUploadService from '../services/FileUploadService'; // Import FileUploadService
import fileUploadStyles from '../styles/fileUploadStyles'; // Import styles
import CompressionProgressPanel from './CompressionProgressPanel'; // Import CompressionProgressPanel

const StudentSubjectFilesTable = ({ subjects }) => {
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [subjectData, setSubjectData] = useState({}); // Stores full subject details
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [uploading, setUploading] = useState(false); // For student uploads
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  // Track selected files per subject (subjectId -> FileList array)
  const [selectedFiles, setSelectedFiles] = useState({});

  // Compression states for student uploads
  const [globalCompressionLevel, setGlobalCompressionLevel] = useState('medium');
  const [globalCompressionMode, setGlobalCompressionMode] = useState('individual');
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [progressCurrentFile, setProgressCurrentFile] = useState(0);
  const [progressTotalFiles, setProgressTotalFiles] = useState(0);
  const [progressOriginalSize, setProgressOriginalSize] = useState(0);
  const [progressEstimatedSize, setProgressEstimatedSize] = useState(0);
  const [progressActualCompressedSize, setProgressActualCompressedSize] = useState(0);

  const { currentUser } = useSelector(state => state.user);

  // Initialize compression system
  useEffect(() => {
    const initializeCompressionSystem = async () => {
      console.log('🧪 Initializing compression system for student uploads...');
      try {
        setIsSystemReady(true);
        console.log('✅ Compression system READY for student uploads');
      } catch (error) {
        console.error('❌ Compression system init error for student uploads:', error);
        setIsSystemReady(false);
        setGlobalCompressionLevel('none');
      }
    };
    initializeCompressionSystem();
  }, []);

  const toggleSubject = async (subjectId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));

    // Load files if not already loaded
    if (!subjectData[subjectId] && !expandedSubjects[subjectId]) {
      await loadSubjectDetailsAndFiles(subjectId);
    }
  };

  const loadSubjectDetailsAndFiles = async (subjectId) => {
    setLoading(prev => ({ ...prev, [subjectId]: true }));
    setError(prev => ({ ...prev, [subjectId]: null }));

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/Subject/${subjectId}?userRole=Student&userId=${currentUser?._id}`
      );

      if (response.data) {
        setSubjectData(prev => ({
          ...prev,
          [subjectId]: response.data
        }));
      }
    } catch (err) {
      console.error('Error loading subject details and files:', err);
      setError(prev => ({
        ...prev,
        [subjectId]: 'Error loading subject details and files'
      }));
    } finally {
      setLoading(prev => ({ ...prev, [subjectId]: false }));
    }
  };

  // Safe compression with progress for student uploads
  const compressFilesSafely = async (files, compressionLevel, compressionMode, archiveName) => {
    if (!isSystemReady || compressionLevel === 'none' || files.length === 0) {
      return files;
    }

    console.log(`🗜️ Starting compression for student upload: ${files.length} files, mode: ${compressionMode}`);

    const totalOriginalSize = FileUploadService.calculateTotalSize(files);
    const estimatedCompressedSize = FileUploadService.estimateCompressedSize(files, compressionLevel, compressionMode);

    setProgressOriginalSize(totalOriginalSize);
    setProgressEstimatedSize(estimatedCompressedSize);
    setProgressTotalFiles(files.length);
    setProgressCurrentFile(0);
    setProgressActualCompressedSize(0);
    setCurrentOperation(`Compressing ${files.length} file(s)...`);
    setCompressionProgress(0);

    const onProgress = (progressData) => {
      if (progressData.currentFile) {
        setProgressCurrentFile(progressData.currentFile);
      }
      if (progressData.progress !== undefined) {
        setCompressionProgress(progressData.progress);
      }
      if (progressData.operation) {
        setCurrentOperation(progressData.operation);
      }
      if (progressData.totalCompressedSize) {
        setProgressActualCompressedSize(progressData.totalCompressedSize);
      }
    };

    const compressionPromise = compressionMode === 'zip'
      ? FileUploadService.compressAllFilesAsZip(files, compressionLevel, onProgress, archiveName)
      : FileUploadService.compressFiles(files, compressionLevel, onProgress);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Compression timeout (30 seconds)')), 30000)
    );

    try {
      const result = await Promise.race([compressionPromise, timeoutPromise]);
      setCompressionProgress(100);
      setCurrentOperation('Compression completed!');
      console.log('✅ Compression successful');

      setTimeout(() => {
        setCompressionProgress(0);
        setCurrentOperation('');
      }, 1000);

      return result;
    } catch (error) {
      setCompressionProgress(0);
      setCurrentOperation('');
      console.warn('⚠️ Compression failed, using original files:', error.message);
      setUploadError(`Compression failed: ${error.message}. Using original files.`);
      return files;
    }
  };

  // Student upload handler for exam responses
  const handleStudentUpload = async (subjectId, inputFiles, subjectNameForArchive) => {
    if (!inputFiles || inputFiles.length === 0) {
      setUploadError('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadSuccess('');
    setCurrentOperation('Preparing upload...');

    try {
      const filesArray = Array.from(inputFiles);

      // Compress files
      const processedFiles = globalCompressionLevel === 'none' 
        ? filesArray 
        : await compressFilesSafely(filesArray, globalCompressionLevel, globalCompressionMode, subjectNameForArchive);

      const formData = new FormData();
      formData.append('uploaderId', currentUser?._id);
      formData.append('uploaderRole', 'student'); // Ensure role is 'student'
      formData.append('forExam', 'true'); // These are exam responses
      formData.append('compressionLevel', globalCompressionLevel);
      formData.append('compressionMode', globalCompressionMode);

      processedFiles.forEach(f => formData.append('files', f));

      setCurrentOperation('Uploading to server...');
      const resp = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/Subject/${subjectId}/files`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (resp.data && resp.data.success) {
        setUploadSuccess('Files submitted successfully');
        // reload files for this subject
        await loadSubjectDetailsAndFiles(subjectId);
      } else {
        setUploadError(resp.data?.message || 'Error during submission');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Error uploading files');
    } finally { 
      setUploading(false);
      setCurrentOperation('');
      setCompressionProgress(0);
    }
  };

  const handleDownload = async (subjectId, fileId, fileName) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/Subject/${subjectId}/file/${fileId}/download?studentID=${currentUser?._id}`,
        {
          responseType: 'blob'
        }
      );

      // Create download link using the Blob returned by axios.
      // Avoid re-wrapping the blob (which can reset mime/type to text/plain in some browsers).
      let blob = response.data;

      // If the blob has no type, try to recover it from response headers
      const contentType = response.headers && response.headers['content-type'];
      if ((!blob.type || blob.type === '') && contentType) {
        try {
          blob = new Blob([blob], { type: contentType });
        } catch (e) {
          // If wrapping fails for any reason, fall back to using the original blob
          console.warn('Could not set blob MIME type from headers:', e);
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'download');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Error downloading file');
    }
  };

  const getFileIcon = (mimetype, originalName) => {
    if (!mimetype) return <InsertDriveFile color="action" />;

    if (mimetype.startsWith('image/')) return <Image color="primary" />;
    if (mimetype === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimetype.startsWith('video/')) return <VideoLibrary color="secondary" />;
    if (mimetype.startsWith('audio/')) return <AudioFile color="success" />;
    if (mimetype.includes('zip') || mimetype.includes('compressed') ||
        originalName?.endsWith('.zip')) {
      return <FolderZip color="warning" />;
    }
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel') ||
        originalName?.endsWith('.xls') || originalName?.endsWith('.xlsx')) {
      return <TableChart color="success" />;
    }
    if (mimetype.includes('word') || mimetype.includes('document') ||
        originalName?.endsWith('.doc') || originalName?.endsWith('.docx')) {
      return <Description color="info" />;
    }

    return <InsertDriveFile color="action" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (!subjects || subjects.length === 0) {
    return (
      <Alert severity="info">
        No subjects available
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600, color: '#1976d2' }}>
        My Subjects and Files
      </Typography>

      {subjects.map((subject) => (
        <Card 
          key={subject._id} 
          sx={{ 
            mb: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          <CardContent>
            {/* Subject Header */}
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
              onClick={() => toggleSubject(subject._id)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Folder sx={{ fontSize: 32, color: '#1976d2' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {subject.subName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Code: {subject.subCode} • Sessions: {subject.sessions}
                  </Typography>
                  {subject.type === 'Exam' && (
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        label="Exam Subject" 
                        color="secondary" 
                        size="small" 
                        sx={{ mr: 1 }} 
                      />
                      <Typography variant="caption" display="inline" sx={{ mr: 1 }}>
                        Start: {subject.examStart ? new Date(subject.examStart).toLocaleString() : 'N/A'}
                      </Typography>
                      <Typography variant="caption" display="inline" sx={{ mr: 1 }}>
                        End: {subject.examEnd ? new Date(subject.examEnd).toLocaleString() : 'N/A'}
                      </Typography>
                      <Chip 
                        label={subject.allowStudentUploads ? 'Uploads Allowed' : 'Uploads Disabled'} 
                        color={subject.allowStudentUploads ? 'success' : 'error'} 
                        size="small" 
                      />
                    </Box>
                  )}
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {subjectData[subject._id]?.files && (
                  <Chip
                    label={`${subjectData[subject._id].files.length} file(s)`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
                <IconButton>
                  {expandedSubjects[subject._id] ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
            </Box>

            {/* Files Table */}
            <Collapse in={expandedSubjects[subject._id]} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2 }}>
                {loading[subject._id] ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : error[subject._id] ? (
                  <Alert severity="error">{error[subject._id]}</Alert>
                ) : subjectData[subject._id]?.files && subjectData[subject._id].files.length > 0 ? (
                   <Paper sx={{ p: 2, mt: 2 }}>
                     <Typography variant="h6" gutterBottom>
                       Associated Files ({subjectData[subject._id].files.length})
                     </Typography>
                     <List>
                       {subjectData[subject._id].files.map((file) => {
                         const isCompressed = file.originalName?.includes('_compressed') ||
                                               file.mimetype === 'application/zip' ||
                                               file.compressionLevel;

                         return (
                           <ListItem
                             key={file._id}
                             divider
                             secondaryAction={
                               <Button
                                 startIcon={<Download />}
                                 onClick={() => handleDownload(subject._id, file._id, file.originalName)}
                                 variant="outlined"
                                 size="small"
                                 color="primary"
                               >
                                 Download
                               </Button>
                             }
                           >
                             <ListItemIcon>
                               {getFileIcon(file.mimetype, file.originalName)}
                               {isCompressed && (
                                 <Compress
                                   sx={{
                                     position: 'absolute',
                                     top: 4,
                                     right: 4,
                                     fontSize: 16,
                                     color: 'primary.main'
                                   }}
                                 />
                               )}
                             </ListItemIcon>
                             <ListItemText
                               primary={
                                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                   <Typography variant="subtitle1" component="div">
                                     {file.originalName}
                                   </Typography>
                                   {file.forExam && (
                                     <Chip
                                       label="Exam Response"
                                       size="small"
                                       color="secondary"
                                       variant="filled"
                                     />
                                   )}
                                   {isCompressed && (
                                     <Chip
                                       icon={<Compress />}
                                       label="Compressed"
                                       size="small"
                                       color="primary"
                                       variant="filled"
                                     />
                                   )}
                                 </Box>
                               }
                               secondary={
                                 <Box sx={{ mt: 1 }}>
                                   {/* Basic information */}
                                   <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                     <Chip
                                       label={formatFileSize(file.size)}
                                       size="small"
                                       variant="outlined"
                                     />
                                     <Chip
                                       label={file.mimetype || 'Unknown Type'}
                                       size="small"
                                       variant="outlined"
                                       color="secondary"
                                     />
                                   </Box>

                                   {/* Compression information */}
                                   {(file.compressionLevel || file.compressionMode) && (
                                     <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                       {file.compressionLevel && (
                                         <Chip
                                           label={`Compression: ${file.compressionLevel}`}
                                           size="small"
                                           variant="outlined"
                                           color="primary"
                                         />
                                       )}
                                       {file.compressionMode && file.compressionMode !== 'individual' && (
                                         <Chip
                                           label={`Mode: ${file.compressionMode}`}
                                           size="small"
                                           variant="outlined"
                                           color="secondary"
                                         />
                                       )}
                                     </Box>
                                   )}
                                 </Box>
                               }
                             />
                           </ListItem>
                         );
                       })}
                     </List>
                   </Paper>
                ) : (
                  <Alert severity="info">
                    No files available for this subject
                  </Alert>
                )}

                {/* Student Upload Section for Exam Responses */}
                {currentUser && currentUser.role === 'Student' && subject.type === 'Exam' && subject.allowStudentUploads && (() => {
                  const now = new Date();
                  const start = subject.examStart ? new Date(subject.examStart) : null;
                  const end = subject.examEnd ? new Date(subject.examEnd) : null;
                  const withinWindow = (!start || now >= start) && (!end || now <= end);

                  if (withinWindow) {
                    return (
                      <Card sx={{ ...fileUploadStyles.sectionCard, mt: 3 }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Submit Exam Response
                          </Typography>
                          {uploadError && (
                            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError('')}>
                              {uploadError}
                            </Alert>
                          )}
                          {uploadSuccess && (
                            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setUploadSuccess('')}>
                              {uploadSuccess}
                            </Alert>
                          )}
                          {!isSystemReady && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                              <Warning sx={{ mr: 1 }} />
                              Compression system unavailable - files will be uploaded as-is
                            </Alert>
                          )}
                          {uploading && (
                            <CompressionProgressPanel
                              isProcessing={uploading}
                              currentOperation={currentOperation}
                              compressionProgress={compressionProgress}
                              currentFile={progressCurrentFile}
                              totalFiles={progressTotalFiles}
                              originalSize={progressOriginalSize}
                              estimatedSize={progressEstimatedSize}
                              actualCompressedSize={progressActualCompressedSize}
                              compressionLevel={globalCompressionLevel}
                              compressionMode={globalCompressionMode}
                            />
                          )}
                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" gutterBottom>
                                Compression Level
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap">
                                {['none', 'low', 'medium', 'high'].map(level => (
                                  <Chip
                                    key={level}
                                    label={level.charAt(0).toUpperCase() + level.slice(1)}
                                    clickable
                                    color={globalCompressionLevel === level ? "primary" : "default"}
                                    onClick={() => setGlobalCompressionLevel(level)}
                                    disabled={!isSystemReady || uploading}
                                    variant={globalCompressionLevel === level ? "filled" : "outlined"}
                                    sx={{
                                      ...fileUploadStyles.selectionChip,
                                      ...(globalCompressionLevel === level && fileUploadStyles.compressionChip)
                                    }}
                                  />
                                ))}
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" gutterBottom>
                                Compression Mode
                              </Typography>
                              <Box display="flex" gap={1} flexWrap="wrap">
                                {['individual', 'zip'].map(mode => (
                                  <Chip
                                    key={mode}
                                    label={mode === 'individual' ? 'Individual Files' : 'ZIP Archive'}
                                    clickable
                                    color={globalCompressionMode === mode ? "primary" : "default"}
                                    onClick={() => setGlobalCompressionMode(mode)}
                                    disabled={!isSystemReady || uploading}
                                    variant={globalCompressionMode === mode ? "filled" : "outlined"}
                                  />
                                ))}
                              </Box>
                            </Grid>
                          </Grid>
                          <input
                            accept="*/*"
                            style={{ display: 'none' }}
                            id={`student-upload-${subject._id}`}
                            multiple
                            type="file"
                            onChange={(e) => setSelectedFiles(prev => ({ ...prev, [subject._id]: e.target.files }))}
                            disabled={uploading}
                          />
                          <label htmlFor={`student-upload-${subject._id}`}>
                            <Button variant="contained" component="span" startIcon={<CloudUpload />} disabled={uploading}>
                              Select Files to Submit
                            </Button>
                          </label>
                          {selectedFiles[subject._id] && selectedFiles[subject._id].length > 0 && (
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                              {selectedFiles[subject._id].length} file(s) selected. Click "Submit" to upload.
                            </Typography>
                          )}
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="contained"
                              onClick={() => handleStudentUpload(subject._id, selectedFiles[subject._id], subject.subName)}
                              disabled={uploading || !(selectedFiles[subject._id] && selectedFiles[subject._id].length > 0)}
                              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
                            >
                              {uploading ? 'Submitting...' : 'Submit Exam Response'}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  } else {
                    return (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Exam response submission is currently {now < start ? 'not open yet' : 'closed'}.
                      </Alert>
                    );
                  }
                })()}
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default StudentSubjectFilesTable;
