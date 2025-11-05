import React from 'react';
import {
  Box,
  Button,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  LinearProgress
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
  InsertDriveFile
} from '@mui/icons-material';
import FileUploadService from '../services/FileUploadService';

const FileUploadSection = ({ 
  files, 
  setFiles, 
  compressionLevel, 
  setCompressionLevel,
  compressionMode,
  setCompressionMode,
  errors,
  isCompressing = false
}) => {
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    
    try {
      FileUploadService.validateFiles(selectedFiles);
      setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
    } catch (error) {
      alert(error.message);
      event.target.value = '';
    }
  };

  const handleRemoveFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setFiles([]);
  };

  const handleCompressionLevelChange = (event) => {
    setCompressionLevel(event.target.value);
  };

  const handleCompressionModeChange = (event) => {
    setCompressionMode(event.target.checked ? 'zip' : 'individual');
  };

  const getFileIconComponent = (file) => {
    const iconName = FileUploadService.getFileIcon(file);
    const iconProps = { sx: { fontSize: 18 } };
    
    const icons = {
      image: <Image {...iconProps} />,
      description: <Description {...iconProps} />,
      picture_as_pdf: <PictureAsPdf {...iconProps} />,
      table_chart: <TableChart {...iconProps} />,
      folder_zip: <FolderZip {...iconProps} />,
      videocam: <Videocam {...iconProps} />,
      audiotrack: <Audiotrack {...iconProps} />,
      slideshow: <Slideshow {...iconProps} />,
      insert_drive_file: <InsertDriveFile {...iconProps} />
    };
    
    return icons[iconName] || <InsertDriveFile {...iconProps} />;
  };

  const currentSize = FileUploadService.calculateTotalSize(files);
  const estimatedSize = FileUploadService.estimateCompressedSize(files, compressionLevel, compressionMode);

  return (
    <Box mb={3} p={2} sx={{ border: '1px dashed #ccc', borderRadius: 1, backgroundColor: '#fafafa' }}>
      <Typography variant="h6" gutterBottom>
        Associated Files
      </Typography>
      
      {isCompressing && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Compressing files...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Compression Level</InputLabel>
        <Select
          value={compressionLevel}
          label="Compression Level"
          onChange={handleCompressionLevelChange}
          disabled={isCompressing}
        >
          <MenuItem value="high">High Compression</MenuItem>
          <MenuItem value="medium">Balanced Compression</MenuItem>
          <MenuItem value="low">Light Compression</MenuItem>
        </Select>
      </FormControl>

      <FormControlLabel
        control={
          <Switch
            checked={compressionMode === 'zip'}
            onChange={handleCompressionModeChange}
            color="primary"
            disabled={isCompressing}
          />
        }
        label={
          <Typography variant="body2">
            {compressionMode === 'zip' 
              ? 'Single ZIP Archive' 
              : 'Individual Files'}
          </Typography>
        }
        sx={{ mb: 2 }}
      />

      {files.length > 0 && (
        <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
          <Typography variant="body2" color="primary" sx={{ lineHeight: 1.6 }}>
            <strong>Compression Statistics:</strong>
            <br />
            • Files: {files.length}
            <br />
            • Current Size: <strong>{currentSize} MB</strong>
            <br />
            • Estimated Size: <strong>{estimatedSize} MB</strong>
            <br />
            • Estimated Reduction: <strong>{((1 - estimatedSize/currentSize) * 100).toFixed(1)}%</strong>
            <br />
            • Mode: {compressionMode === 'zip' ? 'Single ZIP Archive' : 'Individual Compression'}
          </Typography>
        </Box>
      )}

      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          component="label"
          disabled={isCompressing}
          startIcon={<AttachFile />}
        >
          Add Files
          <input
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
          />
        </Button>

        {files.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleRemoveAllFiles}
            disabled={isCompressing}
            startIcon={<Delete />}
          >
            Clear All
          </Button>
        )}
      </Box>

      {files.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Selected Files ({files.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {files.map((file, index) => (
              <Chip
                key={index}
                icon={getFileIconComponent(file)}
                label={`${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`}
                onDelete={isCompressing ? undefined : () => handleRemoveFile(index)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      {files.length === 0 && !isCompressing && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          All file types are supported and will be compressed automatically
        </Typography>
      )}

      {errors && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errors}
        </Alert>
      )}
    </Box>
  );
};

export default FileUploadSection;