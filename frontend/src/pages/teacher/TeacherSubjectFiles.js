import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Download,
  Folder,
  Image,
  PictureAsPdf,
  Description,
  VideoLibrary,
  AudioFile,
  InsertDriveFile,
  Compress,
  FolderZip,
  Warning
} from '@mui/icons-material';
import axios from 'axios';
import FileUploadPerSubject from '../../components/FileUploadPerSubject';
import FileUploadService from '../../services/FileUploadService';
import fileUploadStyles from '../../styles/fileUploadStyles';
import CompressionProgressPanel from '../../components/CompressionProgressPanel';

const TeacherSubjectFiles = () => {
  const { currentUser, activeSubjectId } = useSelector((state) => state.user);

  // Resolve selected subject using global activeSubjectId when available,
  // otherwise fall back to the legacy teachSubject or first teachSubjects entry.
  const selectedSubject = activeSubjectId
    ? (currentUser?.teachSubjects || []).find(s => String(s._id) === String(activeSubjectId))
    : (currentUser?.teachSubject || (currentUser?.teachSubjects && currentUser.teachSubjects[0]));

  const subjectID = selectedSubject?._id;
  const [subjectDetails, setSubjectDetails] = useState(null); // To store full subject details
  const subjectName = subjectDetails?.subName;

  // States
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');
  const [globalCompressionLevel, setGlobalCompressionLevel] = useState('medium');
  const [globalCompressionMode, setGlobalCompressionMode] = useState('individual');
  const [isSystemReady, setIsSystemReady] = useState(false);

  // Additional states for CompressionProgressPanel
  const [progressCurrentFile, setProgressCurrentFile] = useState(0);
  const [progressTotalFiles, setProgressTotalFiles] = useState(0);
  const [progressOriginalSize, setProgressOriginalSize] = useState(0);
  const [progressEstimatedSize, setProgressEstimatedSize] = useState(0);
  const [progressActualCompressedSize, setProgressActualCompressedSize] = useState(0);

  // Initialize compression system
  useEffect(() => {
    const initializeCompressionSystem = async () => {
      console.log('Initializing compression system...');
      try {
        setIsSystemReady(true);
        console.log('✅ Compression system READY');
      } catch (error) {
        console.error('❌ Compression system init error:', error);
        setIsSystemReady(false);
        setGlobalCompressionLevel('none');
      }
    };
    initializeCompressionSystem();
  }, []);

  // Load existing files
  useEffect(() => {
    const fetchFiles = async () => {
      if (!subjectID) return;
      
      try {
        setLoading(true);
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/Subject/${subjectID}`
        );
        
        if (response.data) {
          setSubjectDetails(response.data);
          setExistingFiles(response.data.files || []);
        }
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to load files');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [subjectID]);

  // Compress files
  const compressFilesSafely = async (files, compressionLevel, compressionMode, archiveName) => {
    if (!isSystemReady || compressionLevel === 'none' || files.length === 0) {
      return files;
    }

    console.log(` Starting compression: ${files.length} files, mode: ${compressionMode}`);

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
      ? FileUploadService.compressAllFilesAsZip(files, compressionLevel, onProgress, subjectName || 'subject_files')
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
      setError(`Compression failed: ${error.message}. Using original files.`);
      return files;
    }
  };

  // Upload files
  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setCurrentOperation('Preparing upload...');

    try {
      // Compress files
      const processedFiles = globalCompressionLevel === 'none' 
        ? files 
        : await compressFilesSafely(files, globalCompressionLevel, globalCompressionMode, subjectName);

      // Create FormData
      const formData = new FormData();
      formData.append('compressionLevel', globalCompressionLevel);
      formData.append('compressionMode', globalCompressionMode);

      processedFiles.forEach(file => {
        formData.append('files', file);
      });

      setCurrentOperation('Uploading to server...');
      // include uploader metadata so backend can record who uploaded the files
      formData.append('uploaderId', currentUser?._id);
      formData.append('uploaderRole', currentUser?.role || 'teacher'); // Ensure role is 'teacher'
      formData.append('forExam', 'false'); // These are common subject files, not exam responses

      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/Subject/${subjectID}/files`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.success) {
        setSuccess(`${files.length} file(s) uploaded successfully!`);
        setFiles([]);
        
        // Reload files
        const filesResponse = await axios.get(
          `${process.env.REACT_APP_BASE_URL}/Subject/${subjectID}/files`
        );
        if (filesResponse.data.success) {
          setExistingFiles(filesResponse.data.files || []);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload files');
    } finally {
      setUploading(false);
      setCurrentOperation('');
      setCompressionProgress(0);
      setProgressCurrentFile(0);
      setProgressTotalFiles(0);
      setProgressOriginalSize(0);
      setProgressEstimatedSize(0);
      setProgressActualCompressedSize(0);
    }
  };

  // Download file
  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/Subject/${subjectID}/file/${fileId}/download?teacherID=${currentUser?._id}`
      );
      
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_BASE_URL}/Subject/${subjectID}/file/${fileId}`
      );

      if (response.data.success) {
        setSuccess('File deleted successfully');
        setExistingFiles(existingFiles.filter(f => f._id !== fileId));
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete file');
    }
  };

  // Get file icon
  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return <Image color="primary" />;
    if (mimetype === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimetype.startsWith('video/')) return <VideoLibrary color="secondary" />;
    if (mimetype.startsWith('audio/')) return <AudioFile color="success" />;
    if (mimetype.includes('zip')) return <FolderZip color="warning" />;
    if (mimetype.includes('document') || mimetype.includes('word')) return <Description color="info" />;
    return <InsertDriveFile />;
  };

  if (!subjectID) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You are not assigned to any subject yet.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          <Folder sx={{ mr: 1, verticalAlign: 'middle' }} />
          Subject Files - {subjectName}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Upload and manage files for your subject
          </Typography>
          {subjectDetails && (
            <Box sx={{ mt: 1 }}>
              <Chip 
                label={subjectDetails.type === 'Exam' ? 'Exam Subject' : 'Regular Subject'} 
                color={subjectDetails.type === 'Exam' ? 'secondary' : 'primary'} 
                size="small" 
                sx={{ mr: 1 }} 
              />
              {subjectDetails.type === 'Exam' && (
                <>
                  <Typography variant="caption" display="inline" sx={{ mr: 1 }}>
                    Start: {subjectDetails.examStart ? new Date(subjectDetails.examStart).toLocaleString() : 'N/A'}
                  </Typography>
                  <Typography variant="caption" display="inline" sx={{ mr: 1 }}>
                    End: {subjectDetails.examEnd ? new Date(subjectDetails.examEnd).toLocaleString() : 'N/A'}
                  </Typography>
                  <Chip 
                    label={subjectDetails.allowStudentUploads ? 'Student Uploads Allowed' : 'Student Uploads Disabled'} 
                    color={subjectDetails.allowStudentUploads ? 'success' : 'error'} 
                    size="small" 
                  />
                </>
              )}
            </Box>
          )}
        </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {!isSystemReady && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Warning sx={{ mr: 1 }} />
          Compression system unavailable - files will be uploaded as-is
        </Alert>
      )}

      {/* Progress panel */}
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

      {/* Upload Section */}
      <Card sx={{ ...fileUploadStyles.sectionCard, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload New Files
          </Typography>

          {/* Compression Settings */}
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

          {/* File Upload Component */}
          <FileUploadPerSubject
            subjectIndex={0}
            subjectName={subjectName}
            files={files}
            setFiles={setFiles}
            isProcessing={uploading}
          />

          {/* Upload Button */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
              sx={fileUploadStyles.uploadButton}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Existing Files */}
      <Card sx={fileUploadStyles.sectionCard}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Existing Files ({existingFiles.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : existingFiles.length === 0 ? (
            <Box sx={fileUploadStyles.emptyState}>
              <Folder />
              <Typography variant="h6" gutterBottom>
                No files uploaded yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Upload some files to get started.
              </Typography>
            </Box>
          ) : (
            <List sx={fileUploadStyles.fileList}>
              {existingFiles.map((file, index) => {
                const isCompressed = file.compressionLevel && file.compressionLevel !== 'none';

                return (
                  <React.Fragment key={file._id}>
                    <ListItem
                      secondaryAction={
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            startIcon={<Download />}
                            onClick={() => handleDownload(file._id, file.originalName)}
                            variant="outlined"
                            size="small"
                            color="primary"
                            sx={fileUploadStyles.downloadButton}
                          >
                            Download
                          </Button>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteFile(file._id)}
                            color="error"
                            size="small"
                            sx={fileUploadStyles.deleteButton}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      }
                    >
                      <ListItemIcon>
                        {getFileIcon(file.mimetype)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1">
                              {file.originalName}
                            </Typography>
                            {isCompressed && (
                              <Chip
                                icon={<Compress />}
                                label="Compressed"
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {file.forExam && (
                              <Chip
                                label="Exam Response"
                                size="small"
                                color="secondary"
                                variant="outlined"
                              />
                            )}
                            {file.uploadedByRole && (
                              <Chip
                                label={`Uploaded by: ${file.uploadedByRole}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              Size: {FileUploadService.formatFileSize(file.size)}
                            </Typography>
                            <Typography variant="caption" display="block">
                              Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                            </Typography>
                            {isCompressed && (
                              <Typography variant="caption" display="block" color="primary">
                                Compression: {file.compressionLevel} ({file.compressionMode})
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < existingFiles.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
          {subjectDetails?.type === 'Exam' && (
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<FolderZip />}
                onClick={() => handleDownloadExamResponsesZip(subjectID, subjectName)}
                disabled={loading || existingFiles.filter(f => f.forExam && f.uploadedByRole === 'student').length === 0}
              >
                Download All Exam Responses (ZIP)
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};


// Helper to download all exam responses as a ZIP
const handleDownloadExamResponsesZip = async (subjectId, subjectName) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_BASE_URL}/Subject/${subjectId}/examResponses/zip?teacherID=${(JSON.parse(localStorage.getItem('user'))||{})._id || ''}`
    );
    
    if (!response.ok) throw new Error('Failed to download exam responses ZIP');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${subjectName || 'subject'}_exam_responses.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download exam responses ZIP error:', error);
    alert('Failed to download exam responses ZIP');
  }
};

export default TeacherSubjectFiles;
