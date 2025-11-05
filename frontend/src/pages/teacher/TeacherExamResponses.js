import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, CircularProgress } from '@mui/material';
import axios from 'axios';
import { useSelector } from 'react-redux';

const TeacherExamResponses = () => {
  const { currentUser, activeSubjectId } = useSelector(state => state.user);
  const subjectId = activeSubjectId || '';
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadResponses = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const resp = await axios.get(`${process.env.REACT_APP_BASE_URL}/Subject/${subjectId}/examResponses?teacherID=${currentUser?._id}`);
      if (resp.data && resp.data.success) setResponses(resp.data.responses || []);
      else setResponses([]);
    } catch (err) { console.error('Load responses error', err); setResponses([]); }
    finally { setLoading(false); }
  }, [subjectId, currentUser]);

  useEffect(() => { if (subjectId) loadResponses(); }, [subjectId, loadResponses]);

  const downloadFile = async (fileId, fileName) => {
    try {
      const resp = await axios.get(`${process.env.REACT_APP_BASE_URL}/Subject/${subjectId}/file/${fileId}/download?teacherID=${currentUser?._id}`, { responseType: 'blob' });
      const contentType = resp.headers['content-type'];
      const blob = (!resp.data.type || resp.data.type === '') && contentType ? new Blob([resp.data], { type: contentType }) : resp.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = fileName || 'response'; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
    } catch (err) { console.error('Download error', err); alert('Erreur téléchargement'); }
  };

  const downloadAll = async () => {
    if (!subjectId) return alert('No subject selected');
    try {
      const url = `${process.env.REACT_APP_BASE_URL}/Subject/${subjectId}/examResponses/zip?teacherID=${currentUser?._id}`;
      const resp = await axios.get(url, { responseType: 'blob' });
      const contentDisposition = resp.headers['content-disposition'];
      let filename = `subject_${subjectId}_responses.zip`;
      if (contentDisposition) {
        const match = /filename="?([^";]+)"?/.exec(contentDisposition);
        if (match) filename = match[1];
      }
      const blob = resp.data;
      const u = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(u);
    } catch (err) { console.error('Download all error', err); alert('Erreur téléchargement archive'); }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Exam Responses</Typography>
      {!subjectId && <Typography color="textSecondary">Sélectionnez d'abord un sujet (Active Subject)</Typography>}
      {loading ? <CircularProgress /> : (
        <>
          <Button variant="contained" onClick={downloadAll} sx={{ mb: 2 }} disabled={!subjectId || responses.length === 0}>Télécharger toutes les réponses (.zip)</Button>
          <Table>
            <TableHead>
              <TableRow><TableCell>Fichier</TableCell><TableCell>UploadedAt</TableCell><TableCell>Action</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {responses.map(r => (
                <TableRow key={r._id}>
                  <TableCell>{r.originalName}</TableCell>
                  <TableCell>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleString() : '-'}</TableCell>
                  <TableCell>
                    <Button onClick={() => downloadFile(r._id, r.originalName)} size="small">Download</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Box>
  );
};

export default TeacherExamResponses;
