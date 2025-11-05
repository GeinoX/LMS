import React, { useEffect, useState } from "react";
import { 
  Button, 
  TextField, 
  Grid, 
  Box, 
  Typography, 
  CircularProgress,
  Card,
  CardContent,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from "@mui/material";
import { 
  Save,
  Add,
  Delete,
  Book,
  Warning
} from "@mui/icons-material";
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addStuff } from '../../../redux/userRelated/userHandle';
import { underControl } from '../../../redux/userRelated/userSlice';
import Popup from '../../../components/Popup';
import FileUploadPerSubject from '../../../components/FileUploadPerSubject';
import FileUploadService from '../../../services/FileUploadService';
import fileUploadStyles from '../../../styles/fileUploadStyles';
import CompressionProgressPanel from '../../../components/CompressionProgressPanel';
// import axios from 'axios';

const SubjectForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  
  const { status, currentUser, response, error } = useSelector(state => state.user);
  const sclassName = params.id;
  const adminID = currentUser._id;

  // Main states
  const [subjects, setSubjects] = useState([{ 
    subName: "", 
    subCode: "", 
    sessions: "1",
    type: "Regular",
    examStart: "",
    examEnd: "",
    allowStudentUploads: false,
    files: []
  }]);
  
  const [globalCompressionLevel, setGlobalCompressionLevel] = useState("medium");
  const [globalCompressionMode, setGlobalCompressionMode] = useState("individual");
  
  // UI and progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [systemTested, setSystemTested] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState('');

  // New detailed progress states
  const [progressCurrentFile, setProgressCurrentFile] = useState(0);
  const [progressTotalFiles, setProgressTotalFiles] = useState(0);
  const [progressOriginalSize, setProgressOriginalSize] = useState(0);
  const [progressEstimatedSize, setProgressEstimatedSize] = useState(0);
  const [progressActualCompressedSize, setProgressActualCompressedSize] = useState(0);

  // Compression system initialization
  useEffect(() => {
    const initializeCompressionSystem = async () => {
      console.log('🧪 Initializing compression system...');
      
      try {
        // Skip compression testing entirely to avoid audio issues
        setIsSystemReady(true);
        setSystemTested(true);
        console.log('✅ Compression system READY (safe mode - no audio testing)');
        
      } catch (error) {
        console.error('❌ Compression system init error:', error);
        setIsSystemReady(false);
        setSystemTested(true);
        setGlobalCompressionLevel("none");
      }
    };

    initializeCompressionSystem();
  }, []);

  // Test server connection function
  // const testServerBeforeSubmit = async () => {
  //   try {
  //     console.log('🔍 Testing server before submission...');
      
  //     const testResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/`, {
  //       timeout: 5000
  //     });
      
  //     console.log('✅ Server is accessible:', testResponse.status);
  //     return true;
  //   } catch (error) {
  //     console.error('❌ Server test failed:', error.message);
      
  //     let errorMsg = 'Cannot connect to server. ';
  //     if (error.code === 'ECONNREFUSED') {
  //       errorMsg += 'Make sure the backend server is running on localhost:5000';
  //     } else if (error.response) {
  //       errorMsg += `Server responded with ${error.response.status}`;
  //     } else {
  //       errorMsg += error.message;
  //     }
      
  //     setUploadError(errorMsg);
  //     return false;
  //   }
  // };

  // Subject management
  const handleSubjectChange = (index, field) => (event) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = event.target.value;
    setSubjects(newSubjects);
  };

  const handleFilesChange = (index) => (newFiles) => {
    const newSubjects = [...subjects];
    newSubjects[index].files = Array.isArray(newFiles) ? newFiles : [];
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { 
      subName: "", 
      subCode: "", 
      sessions: "1",
      files: []
    }]);
  };

  const removeSubject = (index) => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    setSubjects(newSubjects);
  };

  // Safe compression with progress
  const compressFilesSafely = async (files, compressionLevel, compressionMode, archiveName) => {
    if (!isSystemReady || compressionLevel === 'none' || files.length === 0) {
      return files;
    }

    console.log(`🗜️ Starting compression: ${files.length} files, mode: ${compressionMode}`);

    // Calculate sizes
    const totalOriginalSize = FileUploadService.calculateTotalSize(files);
    const estimatedCompressedSize = FileUploadService.estimateCompressedSize(files, compressionLevel, compressionMode);

    setProgressOriginalSize(totalOriginalSize);
    setProgressEstimatedSize(estimatedCompressedSize);
    setProgressTotalFiles(files.length);
    setProgressCurrentFile(0);
    setProgressActualCompressedSize(0);
    setCurrentOperation(`Compression de ${files.length} fichier(s)...`);
    setCompressionProgress(0);

    // Progress callback
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
      setCurrentOperation('Compression terminée !');
      console.log('✅ Compression successful');

      // Reset after short delay
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

  // Cancel operation
  const cancelHandler = () => {
    console.log('🛑 Operation cancelled by user');
    setIsProcessing(false);
    setCompressionProgress(0);
    setCurrentOperation('');
    setUploadError('Operation cancelled by user');
  };

  // Form submission
  const submitHandler = async (event) => {
    event.preventDefault();
    
    // Test server first
    // const serverOk = await testServerBeforeSubmit();
    // if (!serverOk) {
    //   setIsProcessing(false);
    //   return;
    // }
    
    setIsProcessing(true);
    setUploadError("");
    setCompressionProgress(0);
    setCurrentOperation('Preparing data...');

    try {
      // Validation
      const invalidSubject = subjects.find(subject => 
        !subject.subName.trim() || !subject.subCode.trim()
      );
      
      if (invalidSubject) {
        throw new Error("All fields (Name and Code) are required for each subject");
      }

      console.log('🚀 Starting submission process...');
      setCurrentOperation('Validating data...');

      // Prepare data
      const subjectsData = subjects.map(subject => ({
        subName: subject.subName.trim(),
        subCode: subject.subCode.trim(),
        sessions: subject.sessions || "1",
        type: subject.type || 'Regular',
        examStart: subject.examStart || null,
        examEnd: subject.examEnd || null,
        allowStudentUploads: !!subject.allowStudentUploads,
      }));

      // Process files
      let allFilesToUpload = [];
      let compressionApplied = false;

      for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        const subjectFiles = subject.files || [];
        
        if (subjectFiles.length > 0) {
          setCurrentOperation(`Processing files for: ${subject.subName}`);
          console.log(`📁 Processing ${subjectFiles.length} files for: ${subject.subName}`);
          
          const processedFiles = globalCompressionLevel === 'none' 
            ? subjectFiles 
            : await compressFilesSafely(subjectFiles, globalCompressionLevel, globalCompressionMode, subject.subName);
          
          if (processedFiles !== subjectFiles) {
            compressionApplied = true;
          }
          
          allFilesToUpload.push(...processedFiles);
        }
      }

      // Create FormData
      setCurrentOperation('Preparing upload...');
      const formData = new FormData();
      formData.append('sclassName', sclassName);
      formData.append('adminID', adminID);
      formData.append('subjects', JSON.stringify(subjectsData));
      formData.append('compressionLevel', globalCompressionLevel);
      formData.append('compressionMode', globalCompressionMode);
      formData.append('uploaderRole', 'admin'); // Admin is uploading subjects
      formData.append('uploaderId', adminID); // Admin ID

      // Add files
      allFilesToUpload.forEach(file => {
        formData.append('files', file);
        // Also append forExam flag for each file if it's an exam subject
        const subjectForFile = subjects.find(s => s.files.includes(file));
        if (subjectForFile && subjectForFile.type === 'Exam') {
          formData.append('forExam', 'true');
        } else {
          formData.append('forExam', 'false');
        }
      });

      // Debug logs
      console.log('=== UPLOAD SUMMARY ===');
      console.log('Subjects:', subjectsData.length);
      console.log('Files:', allFilesToUpload.length);
      console.log('Compression:', {
        level: globalCompressionLevel,
        mode: globalCompressionMode,
        applied: compressionApplied,
        systemReady: isSystemReady
      });

      // Send with safety timeout
      setCurrentOperation('Sending to server...');
      console.log('Sending data...');
      
      const sendPromise = dispatch(addStuff(formData, 'Subject'));
      const sendTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Server timeout (120 seconds)')), 120000)
      );

      await Promise.race([sendPromise, sendTimeout]);
      console.log('✅ Submission successful');

    } catch (error) {
      console.error('❌ Submission failed:', error);
      setUploadError(error.message);
      setMessage(error.message);
      setShowPopup(true);
      setIsProcessing(false);
      setCompressionProgress(0);
      setCurrentOperation('');
    }
  };

  // Redux response handling
  useEffect(() => {
    console.log('📊 Redux status update:', status);
    console.log('📨 Redux response:', response);
    
    switch (status) {
      case 'added':
        console.log('✅ Success! Server response:', response);
        if (response && response.message) {
          setMessage(response.message);
        } else {
          setMessage('Subjects created successfully!');
        }
        setShowPopup(true);
        
        // Navigate after delay to see message
        setTimeout(() => {
          navigate("/Admin/subjects");
          dispatch(underControl());
        }, 2000);
        break;
        
      case 'failed':
        console.error('❌ Server rejected request:', response);
        setMessage(response || "Server rejected the request");
        setShowPopup(true);
        setIsProcessing(false);
        break;
        
      case 'error':
        console.error('❌ Network error:', error);
        setMessage(error || "Network connection error");
        setShowPopup(true);
        setIsProcessing(false);
        break;
        
      default:
        break;
    }
  }, [status, response, error, navigate, dispatch]);

  // Safety timeout
  useEffect(() => {
    if (!isProcessing) return;

    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout triggered - resetting interface');
      setIsProcessing(false);
      setCompressionProgress(0);
      setCurrentOperation('');
      setUploadError("Operation took too long. Please try again.");
    }, 180000); // 3 minutes timeout

    return () => clearTimeout(safetyTimeout);
  }, [isProcessing]);

  // Statistics calculation
  const totalSubjects = subjects.length;
  const totalFiles = subjects.reduce((total, subject) => total + (subject.files?.length || 0), 0);
  const totalFileSize = subjects.reduce((total, subject) => 
    total + subject.files.reduce((sum, file) => sum + file.size, 0), 0
  );

  return (
    <Box component="form" onSubmit={submitHandler} sx={{ maxWidth: 1200, margin: '0 auto', p: 2 }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant="h4" component="h1" gutterBottom color="primary">
          <Book sx={{ mr: 1, verticalAlign: 'middle' }} />
          Add Subjects
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Create new subjects with associated files
        </Typography>
      </Box>

      {/* System alerts */}
      {!systemTested && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Testing compression system...
        </Alert>
      )}

      {systemTested && !isSystemReady && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Warning sx={{ mr: 1 }} />
          Compression system unavailable - files will be uploaded as-is
        </Alert>
      )}

      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {uploadError}
        </Alert>
      )}

      {/* Progress panel */}
      <CompressionProgressPanel
        isProcessing={isProcessing}
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

      {/* Global configuration */}
      <Card sx={{ ...fileUploadStyles.sectionCard, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Global Settings
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" gutterBottom>
                Compression Level
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {['none', 'low', 'medium', 'high'].map(level => (
                  <Chip
                    key={level}
                    label={level === 'none' ? 'None' :
                           level === 'low' ? 'Low' :
                           level === 'medium' ? 'Medium' : 'High'}
                    clickable
                    color={globalCompressionLevel === level ? "primary" : "default"}
                    onClick={() => setGlobalCompressionLevel(level)}
                    disabled={!isSystemReady || isProcessing}
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
                    disabled={!isSystemReady || isProcessing}
                    variant={globalCompressionMode === mode ? "filled" : "outlined"}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>

          {/* Size Estimation */}
          {totalFiles > 0 && globalCompressionLevel !== 'none' && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                Estimation de compression
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Taille originale
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {FileUploadService.formatFileSize(totalFileSize)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Taille estimée
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {FileUploadService.formatFileSize(
                      FileUploadService.estimateCompressedSize(
                        subjects.flatMap(s => s.files || []),
                        globalCompressionLevel,
                        globalCompressionMode
                      )
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="textSecondary">
                    Économie estimée
                  </Typography>
                  <Typography variant="h6" color="secondary.main">
                    {(() => {
                      const estimated = FileUploadService.estimateCompressedSize(
                        subjects.flatMap(s => s.files || []),
                        globalCompressionLevel,
                        globalCompressionMode
                      );
                      const savings = ((totalFileSize - estimated) / totalFileSize * 100).toFixed(1);
                      return `${savings}%`;
                    })()}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Subjects list */}
      {subjects.map((subject, index) => (
        <Card key={index} sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="primary">
                Subject {index + 1}
              </Typography>
              {index > 0 && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeSubject(index)}
                  disabled={isProcessing}
                  startIcon={<Delete />}
                  size="small"
                >
                  Remove
                </Button>
              )}
            </Box>
            
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Subject Name"
                  value={subject.subName}
                  onChange={handleSubjectChange(index, 'subName')}
                  required
                  disabled={isProcessing}
                  placeholder="e.g., Mathematics"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Subject Code"
                  value={subject.subCode}
                  onChange={handleSubjectChange(index, 'subCode')}
                  required
                  disabled={isProcessing}
                  placeholder="e.g., MATH-01"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id={`subject-type-label-${index}`}>Type</InputLabel>
                  <Select
                    labelId={`subject-type-label-${index}`}
                    value={subject.type || 'Regular'}
                    label="Type"
                    onChange={(e) => handleSubjectChange(index, 'type')({ target: { value: e.target.value } })}
                    disabled={isProcessing}
                  >
                    <MenuItem value="Regular">Regular</MenuItem>
                    <MenuItem value="Exam">Exam</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Sessions"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={subject.sessions}
                  onChange={handleSubjectChange(index, 'sessions')}
                  required
                  disabled={isProcessing}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Box display="flex" alignItems="center" height="100%">
                  {index === 0 && (
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={addSubject}
                      disabled={isProcessing}
                      startIcon={<Add />}
                      fullWidth
                    >
                      Add Subject
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Exam fields (shown only when type === 'Exam') */}
            {subject.type === 'Exam' && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Exam Start"
                    type="datetime-local"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={subject.examStart || ''}
                    onChange={handleSubjectChange(index, 'examStart')}
                    disabled={isProcessing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Exam End"
                    type="datetime-local"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    value={subject.examEnd || ''}
                    onChange={handleSubjectChange(index, 'examEnd')}
                    disabled={isProcessing}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={!!subject.allowStudentUploads}
                        onChange={(e) => handleSubjectChange(index, 'allowStudentUploads')({ target: { value: e.target.checked } })}
                        disabled={isProcessing}
                      />
                    )}
                    label="Allow Student Uploads"
                  />
                </Grid>
              </Grid>
            )}

            {/* File upload - CORRIGÉ : ne pas passer setCompressionLevel et setCompressionMode */}
            <FileUploadPerSubject
              subjectIndex={index}
              subjectName={subject.subName}
              files={subject.files}
              setFiles={handleFilesChange(index)}
              isProcessing={isProcessing}
              // Supprimé: setCompressionLevel et setCompressionMode
              // Ces contrôles sont maintenant seulement dans la configuration globale
            />
          </CardContent>
        </Card>
      ))}

      {/* Footer with statistics */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
        <Box>
          <Typography variant="body2" color="textSecondary">
            {totalSubjects} subject(s) • {totalFiles} file(s)
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Total size: {FileUploadService.formatFileSize(totalFileSize)}
          </Typography>
          {systemTested && (
            <Typography variant="caption" display="block" color={isSystemReady ? "success.main" : "warning.main"}>
              Compression: {isSystemReady ? 
                `${globalCompressionLevel === 'none' ? 'None' : 
                  globalCompressionLevel === 'low' ? 'Low' : 
                  globalCompressionLevel === 'medium' ? 'Medium' : 'High'} 
                  (${globalCompressionMode === 'individual' ? 'Individual' : 'ZIP'})` 
                : "Disabled"}
            </Typography>
          )}
        </Box>
        
        <Box display="flex" gap={2} alignItems="center">
          {/* Cancel button */}
          {isProcessing && (
            <Button 
              variant="outlined" 
              color="warning"
              onClick={cancelHandler}
              disabled={!isProcessing}
            >
              Cancel
            </Button>
          )}
          
          <Button 
            variant="contained" 
            color="primary" 
            type="submit" 
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <Save />}
            size="large"
            sx={{ minWidth: 160 }}
          >
            {isProcessing ? 'Processing...' : 'Save All Subjects'}
          </Button>
        </Box>
      </Box>

      <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
    </Box>
  );
};

export default SubjectForm;
