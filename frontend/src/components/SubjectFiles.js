// components/SubjectFiles.js
import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Paper
} from '@mui/material';
import {
  Description,
  PictureAsPdf,
  Image,
  TableChart,
  FolderZip,
  Download,
  InsertDriveFile,
  Compress
} from '@mui/icons-material';

const SubjectFiles = ({ subjectId, files }) => {
  const getFileIcon = (mimetype, originalName) => {
    if (mimetype.startsWith('image/')) return <Image color="primary" />;
    if (mimetype === 'application/pdf') return <PictureAsPdf color="error" />;
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel') || 
        originalName?.endsWith('.xls') || originalName?.endsWith('.xlsx')) {
      return <TableChart color="success" />;
    }
    if (mimetype.includes('zip') || mimetype.includes('compressed') ||
        originalName?.endsWith('.zip')) {
      return <FolderZip color="warning" />;
    }
    if (mimetype.includes('word') || mimetype.includes('document') ||
        originalName?.endsWith('.doc') || originalName?.endsWith('.docx')) {
      return <Description color="info" />;
    }
    return <InsertDriveFile color="action" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      console.log('📥 Starting download for:', fileName);

      // Get current user from localStorage (assuming it's stored there)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      // Build query parameters based on user role
      const queryParams = new URLSearchParams();
      if (currentUser.role === 'Admin' || currentUser.role === 'Administrator') {
        queryParams.append('adminID', currentUser._id);
      } else if (currentUser.role === 'Teacher') {
        queryParams.append('teacherID', currentUser._id);
      } else if (currentUser.role === 'Student') {
        queryParams.append('studentID', currentUser._id);
      }

      const response = await fetch(
        `${process.env.REACT_APP_BASE_URL}/Subject/${subjectId}/file/${fileId}/download?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();

      console.log('Downloaded blob details:');
      console.log('  - Size:', blob.size, 'bytes');
      console.log('  - Type:', blob.type);

      // Vérifier si le blob est valide
      if (blob.size === 0) {
        alert('❌ Downloaded file is EMPTY!');
        return;
      }

      // Tester la validité du fichier ZIP
      if (blob.type === 'application/zip' || fileName.endsWith('.zip')) {
        const testArrayBuffer = await blob.slice(0, 4).arrayBuffer();
        const header = new Uint8Array(testArrayBuffer);
        const isZipValid = header[0] === 0x50 && header[1] === 0x4B;

        console.log('ZIP header check:', {
          header: Array.from(header),
          isValid: isZipValid
        });

        if (!isZipValid) {
          alert('❌ Downloaded ZIP file is CORRUPT!');
          return;
        }
      }

      // Créer le téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('✅ Download completed successfully');

    } catch (error) {
      console.error('❌ Download failed:', error);
      alert('Download failed: ' + error.message);
    }
  };

  if (!files || files.length === 0) {
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Fichiers associés
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Aucun fichier associé à cette matière.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Fichiers associés ({files.length})
      </Typography>
      <List>
        {files.map((file) => {
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
                  onClick={() => handleDownload(file._id, file.originalName)}
                  variant="outlined"
                  size="small"
                  color="primary"
                >
                  Télécharger
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
                    {isCompressed && (
                      <Chip 
                        icon={<Compress />}
                        label="Compressé"
                        size="small"
                        color="primary"
                        variant="filled"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {/* Informations de base */}
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      <Chip
                        label={formatFileSize(file.size)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={file.mimetype || 'Type inconnu'}
                        size="small"
                        variant="outlined"
                        color="secondary"
                      />
                      {/* Display who uploaded the file */}
                      {file.uploadedByRole && (
                        <Chip
                          label={`Uploaded by: ${file.uploadedByRole}`}
                          size="small"
                          variant="outlined"
                          color={file.uploadedByRole === 'student' ? 'success' : file.uploadedByRole === 'teacher' ? 'primary' : 'warning'}
                        />
                      )}
                      {/* Display if it's an exam response */}
                      {file.forExam && (
                        <Chip
                          label="Exam Response"
                          size="small"
                          variant="filled"
                          color="secondary"
                        />
                      )}
                    </Box>

                    {/* Informations de compression */}
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
  );
};

export default SubjectFiles;