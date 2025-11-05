// Styles pour le système de gestion de fichiers
export const fileUploadStyles = {
  // Card avec animation
  animatedCard: {
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    },
  },

  // Progress bar avec gradient
  gradientProgress: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    '& .MuiLinearProgress-bar': {
      background: 'linear-gradient(90deg, #2196F3 0%, #21CBF3 100%)',
      borderRadius: 5,
    },
  },

  // Bouton d'upload stylisé
  uploadButton: {
    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    border: 0,
    borderRadius: 8,
    boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
    color: 'white',
    padding: '10px 30px',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
      transform: 'scale(1.05)',
      boxShadow: '0 6px 10px 4px rgba(33, 203, 243, .3)',
    },
    '&:disabled': {
      background: 'rgba(0,0,0,0.12)',
      boxShadow: 'none',
    },
  },

  // Chip de compression
  compressionChip: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontWeight: 'bold',
    '& .MuiChip-icon': {
      color: 'white',
    },
  },

  // Zone de drop pour fichiers
  dropZone: {
    border: '2px dashed #2196F3',
    borderRadius: 8,
    padding: 3,
    textAlign: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.05)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      borderColor: '#1976D2',
    },
    '&.active': {
      backgroundColor: 'rgba(33, 150, 243, 0.2)',
      borderColor: '#0D47A1',
      transform: 'scale(1.02)',
    },
  },

  // Liste de fichiers avec animation
  fileList: {
    '& .MuiListItem-root': {
      transition: 'all 0.2s ease',
      borderRadius: 8,
      marginBottom: 1,
      '&:hover': {
        backgroundColor: 'rgba(0,0,0,0.04)',
        transform: 'translateX(8px)',
      },
    },
  },

  // Badge de statut
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    animation: 'pulse 2s infinite',
    '@keyframes pulse': {
      '0%': {
        transform: 'scale(1)',
        opacity: 1,
      },
      '50%': {
        transform: 'scale(1.1)',
        opacity: 0.8,
      },
      '100%': {
        transform: 'scale(1)',
        opacity: 1,
      },
    },
  },

  // Container principal avec fond dégradé
  mainContainer: {
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    minHeight: '100vh',
    padding: 3,
  },

  // Card de section
  sectionCard: {
    borderRadius: 12,
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    },
  },

  // Header de card avec gradient
  cardHeader: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: 2,
  },

  // Icône animée
  animatedIcon: {
    animation: 'rotate 2s linear infinite',
    '@keyframes rotate': {
      '0%': {
        transform: 'rotate(0deg)',
      },
      '100%': {
        transform: 'rotate(360deg)',
      },
    },
  },

  // Bouton de téléchargement
  downloadButton: {
    borderRadius: 8,
    textTransform: 'none',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
    },
  },

  // Bouton de suppression
  deleteButton: {
    borderRadius: 8,
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'scale(1.1)',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
  },

  // Alert personnalisé
  customAlert: {
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    animation: 'slideIn 0.3s ease',
    '@keyframes slideIn': {
      '0%': {
        transform: 'translateY(-20px)',
        opacity: 0,
      },
      '100%': {
        transform: 'translateY(0)',
        opacity: 1,
      },
    },
  },

  // Divider stylisé
  styledDivider: {
    margin: '16px 0',
    background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)',
  },

  // Chip de sélection
  selectionChip: {
    margin: 0.5,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)',
    },
    '&.selected': {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontWeight: 'bold',
    },
  },

  // Container de fichier
  fileContainer: {
    position: 'relative',
    padding: 2,
    borderRadius: 8,
    border: '1px solid rgba(0,0,0,0.12)',
    marginBottom: 2,
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.05)',
    },
  },

  // Badge de type de fichier
  fileTypeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: 'white',
    '&.image': {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    '&.pdf': {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    '&.video': {
      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    '&.audio': {
      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    '&.zip': {
      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    '&.other': {
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    },
  },

  // Skeleton loader
  skeletonLoader: {
    borderRadius: 8,
    animation: 'shimmer 1.5s infinite',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    '@keyframes shimmer': {
      '0%': {
        backgroundPosition: '200% 0',
      },
      '100%': {
        backgroundPosition: '-200% 0',
      },
    },
  },

  // Empty state
  emptyState: {
    textAlign: 'center',
    padding: 6,
    color: 'rgba(0,0,0,0.4)',
    '& svg': {
      fontSize: 80,
      marginBottom: 2,
      opacity: 0.3,
    },
  },

  // Success animation
  successAnimation: {
    animation: 'success 0.5s ease',
    '@keyframes success': {
      '0%': {
        transform: 'scale(0.8)',
        opacity: 0,
      },
      '50%': {
        transform: 'scale(1.1)',
      },
      '100%': {
        transform: 'scale(1)',
        opacity: 1,
      },
    },
  },
};

export default fileUploadStyles;

