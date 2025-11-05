import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Paper
} from '@mui/material';
import {
  Compress,
  CheckCircle,
  Schedule,
  Storage,
  TrendingDown
} from '@mui/icons-material';

const CompressionProgressPanel = ({
  isProcessing,
  currentOperation,
  compressionProgress,
  currentFile,
  totalFiles,
  originalSize,
  estimatedSize,
  actualCompressedSize,
  compressionLevel,
  compressionMode
}) => {
  
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const calculateSavings = () => {
    if (!originalSize || !estimatedSize) return 0;
    return ((originalSize - estimatedSize) / originalSize * 100).toFixed(1);
  };

  const getCompressionColor = (level) => {
    switch (level) {
      case 'low': return '#4CAF50';
      case 'medium': return '#2196F3';
      case 'high': return '#9C27B0';
      default: return '#757575';
    }
  };

  if (!isProcessing) return null;

  return (
    <Card 
      sx={{ 
        mb: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
        animation: 'slideIn 0.3s ease-out',
        '@keyframes slideIn': {
          from: { opacity: 0, transform: 'translateY(-20px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Compress sx={{ fontSize: 32, mr: 1, animation: 'pulse 2s infinite' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Compression en cours...
          </Typography>
        </Box>

        {/* Current Operation */}
        <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
          {currentOperation || "Traitement des fichiers..."}
        </Typography>

        {/* Main Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption">
              Progression globale
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {Math.round(compressionProgress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={compressionProgress}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                boxShadow: '0 2px 8px rgba(67, 233, 123, 0.5)',
                animation: 'shimmer 2s infinite',
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '-200% 0' },
                  '100%': { backgroundPosition: '200% 0' }
                }
              }
            }}
          />
        </Box>

        {/* File Progress */}
        {currentFile && totalFiles && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Fichier {currentFile} sur {totalFiles}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={(currentFile / totalFiles) * 100}
              sx={{
                height: 6,
                borderRadius: 3,
                mt: 0.5,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: '#fff'
                }
              }}
            />
          </Box>
        )}

        {/* Statistics Grid */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {/* Original Size */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 1.5, 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Storage sx={{ fontSize: 24, mb: 0.5, opacity: 0.8 }} />
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Taille originale
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatFileSize(originalSize)}
              </Typography>
            </Paper>
          </Grid>

          {/* Estimated Size */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 1.5, 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <Schedule sx={{ fontSize: 24, mb: 0.5, opacity: 0.8 }} />
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Taille estimée
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatFileSize(estimatedSize)}
              </Typography>
            </Paper>
          </Grid>

          {/* Actual Compressed Size */}
          {actualCompressedSize > 0 && (
            <Grid item xs={12} sm={6} md={3}>
              <Paper 
                sx={{ 
                  p: 1.5, 
                  backgroundColor: 'rgba(67, 233, 123, 0.2)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  textAlign: 'center',
                  border: '1px solid rgba(67, 233, 123, 0.3)'
                }}
              >
                <CheckCircle sx={{ fontSize: 24, mb: 0.5, color: '#43e97b' }} />
                <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                  Taille compressée
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {formatFileSize(actualCompressedSize)}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Savings */}
          <Grid item xs={12} sm={6} md={3}>
            <Paper 
              sx={{ 
                p: 1.5, 
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 2,
                textAlign: 'center'
              }}
            >
              <TrendingDown sx={{ fontSize: 24, mb: 0.5, opacity: 0.8 }} />
              <Typography variant="caption" display="block" sx={{ opacity: 0.8 }}>
                Économie estimée
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {calculateSavings()}%
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Compression Settings */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Niveau: ${compressionLevel || 'medium'}`}
            size="small"
            sx={{
              backgroundColor: getCompressionColor(compressionLevel),
              color: 'white',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          />
          <Chip 
            label={`Mode: ${compressionMode === 'zip' ? 'ZIP Archive' : 'Fichiers individuels'}`}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              color: 'white',
              fontWeight: 600
            }}
          />
          {totalFiles && (
            <Chip 
              label={`${totalFiles} fichier${totalFiles > 1 ? 's' : ''}`}
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'white',
                fontWeight: 600
              }}
            />
          )}
        </Box>

        {/* Warning Message */}
        <Box 
          sx={{ 
            mt: 2, 
            p: 1.5, 
            backgroundColor: 'rgba(255, 193, 7, 0.2)',
            borderRadius: 1,
            border: '1px solid rgba(255, 193, 7, 0.3)'
          }}
        >
          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
            <Schedule sx={{ fontSize: 16, mr: 0.5 }} />
            Ne quittez pas cette page pendant le traitement
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CompressionProgressPanel;

