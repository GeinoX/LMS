import React, { useEffect, useState } from 'react';
import { getTeacherDetails } from '../../../redux/teacherRelated/teacherHandle';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Container, Typography, Box, List, ListItem, ListItemText, IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';

const TeacherDetails = () => {
    const navigate = useNavigate();
    const params = useParams();
    const dispatch = useDispatch();
    const { loading, teacherDetails, error } = useSelector((state) => state.teacher);

    const teacherID = params.id;
    const [confirmDialog, setConfirmDialog] = useState({ open: false, subjectId: null, subjectName: '' });

    useEffect(() => {
        dispatch(getTeacherDetails(teacherID));
    }, [dispatch, teacherID]);

    if (error) {
        console.log(error);
    }

    const handleAddSubject = () => {
        navigate(`/Admin/teachers/choosesubject/${teacherDetails?.teachSclass?._id}/${teacherDetails?._id}`);
    };

    const handleRemoveSubject = async (subjectId, subjectName) => {
        try {
            await axios.delete(`${process.env.REACT_APP_BASE_URL}/Teacher/${teacherID}/Subject/${subjectId}`);
            // Refresh teacher details
            dispatch(getTeacherDetails(teacherID));
            setConfirmDialog({ open: false, subjectId: null, subjectName: '' });
        } catch (error) {
            console.error('Error removing subject:', error);
            alert('Failed to remove subject from teacher');
        }
    };

    const openConfirmDialog = (subjectId, subjectName) => {
        setConfirmDialog({ open: true, subjectId, subjectName });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog({ open: false, subjectId: null, subjectName: '' });
    };

    return (
        <>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <Container>
                    <Typography variant="h4" align="center" gutterBottom>
                        Teacher Details
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        Teacher Name: {teacherDetails?.name}
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                        Class Name: {teacherDetails?.teachSclass?.sclassName}
                    </Typography>

                    {/* Display subjects with remove functionality */}
                    <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                        Assigned Subjects:
                    </Typography>
                    {teacherDetails?.teachSubjects && teacherDetails.teachSubjects.length > 0 ? (
                        <List>
                            {teacherDetails.teachSubjects.map((subject) => (
                                <ListItem
                                    key={subject._id}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            onClick={() => openConfirmDialog(subject._id, subject.subName)}
                                            color="error"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="subtitle1">
                                                    {subject.subName}
                                                </Typography>
                                                <Chip
                                                    label={`${subject.sessions} sessions`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                                {subject.type === 'Exam' && (
                                                    <Chip
                                                        label="Exam"
                                                        size="small"
                                                        color="secondary"
                                                        variant="filled"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={`Code: ${subject.subCode}`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            No subjects assigned
                        </Typography>
                    )}

                    <Box sx={{ mt: 3 }}>
                        <Button variant="contained" onClick={handleAddSubject}>
                            Add Subject
                        </Button>
                    </Box>

                    {/* Confirmation Dialog */}
                    <Dialog open={confirmDialog.open} onClose={closeConfirmDialog}>
                        <DialogTitle>Remove Subject</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Are you sure you want to remove "{confirmDialog.subjectName}" from this teacher?
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={closeConfirmDialog}>Cancel</Button>
                            <Button
                                onClick={() => handleRemoveSubject(confirmDialog.subjectId, confirmDialog.subjectName)}
                                color="error"
                                variant="contained"
                            >
                                Remove
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Container>
            )}
        </>
    );
};

export default TeacherDetails;