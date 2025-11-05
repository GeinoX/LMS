import React from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper
} from '@mui/material';
import {
  AttachFile,
  Delete,
  Image,
  Description,
  PictureAsPdf,
  TableChart,
  FolderZip,
  Videocam,
  Audiotrack,
  Slideshow,
  InsertDriveFile,
  ExpandMore,
  CloudUpload,
  TextSnippet,
  Code
} from '@mui/icons-material';
import FileUploadService from '../services/FileUploadService';

// Safe fallback for file icons
const getFileIconSafe = (file) => {
  if (!file || !file.type) return 'description';
  
  const fileType = file.type.toLowerCase();
  const fileName = file.name.toLowerCase();
  
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) return 'picture_as_pdf';
  if (fileType.startsWith('video/')) return 'videocam';
  if (fileType.startsWith('audio/')) return 'audiotrack';
  if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'description';
  if (fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'table_chart';
  if (fileType.includes('powerpoint') || fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return 'slideshow';
  if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.rtf')) return 'text_snippet';
  if (fileType.includes('zip') || fileName.endsWith('.zip')) return 'folder_zip';
  if (fileName.endsWith('.js') || fileName.endsWith('.html') || fileName.endsWith('.css')) return 'code';
  
  return 'insert_drive_file';
};

const getFileIconComponent = (file) => {
  let iconName;
  
  try {
    // Try to use service, otherwise use fallback
    if (FileUploadService && FileUploadService.getFileIcon) {
      iconName = FileUploadService.getFileIcon(file);
    } else {
      iconName = getFileIconSafe(file);
    }
  } catch (error) {
    console.warn('File icon error:', error);
    iconName = 'insert_drive_file';
  }

  const iconProps = { sx: { fontSize: 24 } };
  
  const icons = {
    'Image': <Image color="primary" {...iconProps} />,
    'image': <Image color="primary" {...iconProps} />,
    'PictureAsPdf': <PictureAsPdf sx={{ color: '#f40f02' }} {...iconProps} />,
    'picture_as_pdf': <PictureAsPdf sx={{ color: '#f40f02' }} {...iconProps} />,
    'VideoFile': <Videocam color="secondary" {...iconProps} />,
    'videocam': <Videocam color="secondary" {...iconProps} />,
    'AudioFile': <Audiotrack color="info" {...iconProps} />,
    'audiotrack': <Audiotrack color="info" {...iconProps} />,
    'Article': <Description color="warning" {...iconProps} />,
    'description': <Description color="warning" {...iconProps} />,
    'TableChart': <TableChart sx={{ color: '#217346' }} {...iconProps} />,
    'table_chart': <TableChart sx={{ color: '#217346' }} {...iconProps} />,
    'Slideshow': <Slideshow sx={{ color: '#d24726' }} {...iconProps} />,
    'slideshow': <Slideshow sx={{ color: '#d24726' }} {...iconProps} />,
    'TextSnippet': <TextSnippet color="success" {...iconProps} />,
    'text_snippet': <TextSnippet color="success" {...iconProps} />,
    'FolderZip': <FolderZip color="action" {...iconProps} />,
    'folder_zip': <FolderZip color="action" {...iconProps} />,
    'Code': <Code color="inherit" {...iconProps} />,
    'code': <Code color="inherit" {...iconProps} />,
    'Description': <InsertDriveFile color="disabled" {...iconProps} />,
    'insert_drive_file': <InsertDriveFile color="disabled" {...iconProps} />
  };
  
  return icons[iconName] || <InsertDriveFile color="disabled" {...iconProps} />;
};

const FileUploadPerSubject = ({ 
  subjectIndex,
  subjectName,
  files = [],
  setFiles, 
  errors,
  isProcessing = false
}) => {
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    try {
      // Basic validation if service not available
      if (FileUploadService.validateFiles) {
        FileUploadService.validateFiles(selectedFiles);
      } else {
        // Manual fallback validation
        const maxSize = 200 * 1024 * 1024; // 200MB
        for (const file of selectedFiles) {
          if (file.size > maxSize) {
            throw new Error(`File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
          }
        }
      }
      
      setFiles([...files, ...selectedFiles]);
    } catch (error) {
      alert(error.message);
    }
    event.target.value = '';
  };

  const handleRemoveFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  // Safe calculations
  const safeFiles = Array.isArray(files) ? files : [];
  
  const currentSize = FileUploadService.calculateTotalSize 
    ? FileUploadService.calculateTotalSize(safeFiles)
    : safeFiles.reduce((total, file) => total + (file?.size || 0), 0);

  const formatFileSize = (bytes) => {
    if (FileUploadService.formatFileSize) {
      return FileUploadService.formatFileSize(bytes);
    }
    
    // Manual fallback formatting
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="subtitle1" fontWeight="medium">
          Files for: {subjectName || `Subject ${subjectIndex + 1}`}
          {safeFiles.length > 0 && (
            <Chip 
              label={`${safeFiles.length} file(s)`} 
              size="small" 
              sx={{ ml: 1 }} 
              color="primary" 
              variant="outlined"
            />
          )}
        </Typography>
      </AccordionSummary>
      
      <AccordionDetails>
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
          {/* Action buttons */}
          <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              component="label"
              disabled={isProcessing}
              startIcon={<CloudUpload />}
              size="small"
            >
              Add Files
              <input
                type="file"
                multiple
                hidden
                onChange={handleFileChange}
              />
            </Button>

            {safeFiles.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleRemoveAllFiles}
                disabled={isProcessing}
                startIcon={<Delete />}
                size="small"
              >
                Clear All
              </Button>
            )}
          </Box>

          {/* Files list */}
          {safeFiles.length > 0 ? (
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
                Selected Files ({safeFiles.length}):
              </Typography>
              
              <List dense sx={{ maxHeight: 200, overflow: 'auto', bgcolor: 'background.paper', borderRadius: 1 }}>
                {safeFiles.map((file, index) => (
                  <ListItem 
                    key={index} 
                    divider={index < safeFiles.length - 1}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleRemoveFile(index)}
                        disabled={isProcessing}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      {getFileIconComponent(file)}
                    </ListItemIcon>
                    <ListItemText
                      primary={file?.name || 'Unknown file'}
                      secondary={formatFileSize(file?.size || 0)}
                      primaryTypographyProps={{ 
                        variant: 'body2',
                        sx: { 
                          wordBreak: 'break-word',
                          maxWidth: '200px'
                        }
                      }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>

              {/* File statistics */}
              <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.100' }}>
                <Typography variant="body2" color="primary.800" sx={{ lineHeight: 1.6 }}>
                  <strong>File Statistics:</strong>
                  <br />
                  • Files: {safeFiles.length}
                  <br />
                  • Total Size: <strong>{formatFileSize(currentSize)}</strong>
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <AttachFile sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography variant="body2" color="textSecondary">
                No files selected
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Add files specifically for this subject
              </Typography>
            </Box>
          )}

          {/* Error display */}
          {errors && (
            <Alert severity="error" sx={{ mt: 2 }} variant="outlined">
              {errors}
            </Alert>
          )}
        </Paper>
      </AccordionDetails>
    </Accordion>
  );
};

export default FileUploadPerSubject;