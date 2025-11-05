import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Box, Table, TableBody, TableContainer, TableHead, Typography, Paper, Checkbox, FormControlLabel, Button, Alert } from '@mui/material'
import { useNavigate } from 'react-router-dom';
import { getAllTeachers } from '../../../redux/teacherRelated/teacherHandle';
import { getAllSclasses } from '../../../redux/sclassRelated/sclassHandle';
import { getSubjectList } from '../../../redux/sclassRelated/sclassHandle';
import { updateTeachSubject } from '../../../redux/teacherRelated/teacherHandle';
import { StyledTableCell, StyledTableRow } from '../../../components/styles';
import { GreenButton, PurpleButton } from '../../../components/buttonStyles';

const BulkAssignTeachers = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { teachersList, loading: teachersLoading } = useSelector((state) => state.teacher);
    const { sclassesList, loading: classesLoading } = useSelector((state) => state.sclass);
    const { subjectsList, loading: subjectsLoading } = useSelector((state) => state.sclass);
    const { currentUser } = useSelector((state) => state.user);

    const [selectedTeachers, setSelectedTeachers] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [assignmentMode, setAssignmentMode] = useState('add'); // 'add' or 'replace'
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    useEffect(() => {
        dispatch(getAllTeachers(currentUser._id));
        dispatch(getAllSclasses(currentUser._id, "Sclass"));
    }, [currentUser._id, dispatch]);

    const handleClassChange = (classId) => {
        setSelectedClass(classId);
        setSelectedSubjects([]);
        if (classId) {
            dispatch(getSubjectList(classId, "Subject"));
        }
    };

    const handleTeacherSelect = (teacherId) => {
        setSelectedTeachers(prev =>
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    const handleSubjectSelect = (subjectId) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSelectAllTeachers = () => {
        if (selectedTeachers.length === teachersList.length) {
            setSelectedTeachers([]);
        } else {
            setSelectedTeachers(teachersList.map(teacher => teacher._id));
        }
    };

    const handleSelectAllSubjects = () => {
        if (selectedSubjects.length === subjectsList.length) {
            setSelectedSubjects([]);
        } else {
            setSelectedSubjects(subjectsList.map(subject => subject._id));
        }
    };

    const handleBulkAssign = async () => {
        if (selectedTeachers.length === 0 || selectedSubjects.length === 0) {
            setMessage('Please select at least one teacher and one subject');
            setMessageType('error');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            // Process each selected teacher
            const promises = selectedTeachers.map(async (teacherId) => {
                const teacher = teachersList.find(t => t._id === teacherId);
                if (!teacher) return;

                let newSubjects;
                if (assignmentMode === 'replace') {
                    // Replace all subjects with selected ones
                    newSubjects = selectedSubjects;
                } else {
                    // Add selected subjects to existing ones (avoid duplicates)
                    const existingSubjectIds = (teacher.teachSubjects || []).map(s => s._id || s);
                    newSubjects = [...new Set([...existingSubjectIds, ...selectedSubjects])];
                }

                return dispatch(updateTeachSubject(teacherId, newSubjects));
            });

            await Promise.all(promises);

            setMessage(`Successfully assigned ${selectedSubjects.length} subject(s) to ${selectedTeachers.length} teacher(s)`);
            setMessageType('success');

            // Reset selections
            setSelectedTeachers([]);
            setSelectedSubjects([]);

            // Refresh teacher list
            dispatch(getAllTeachers(currentUser._id));

        } catch (error) {
            console.error('Bulk assignment error:', error);
            setMessage('Error during bulk assignment. Please try again.');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    if (teachersLoading || classesLoading) {
        return <div>Loading...</div>;
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden', p: 2 }}>
            <Typography variant="h5" gutterBottom component="div" sx={{ mb: 3 }}>
                Bulk Assign Teachers to Subjects
            </Typography>

            {message && (
                <Alert severity={messageType} sx={{ mb: 2 }}>
                    {message}
                </Alert>
            )}

            {/* Class Selection */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Select Class
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {sclassesList && sclassesList.map((sclass) => (
                        <Button
                            key={sclass._id}
                            variant={selectedClass === sclass._id ? "contained" : "outlined"}
                            onClick={() => handleClassChange(sclass._id)}
                            sx={{ minWidth: 120 }}
                        >
                            {sclass.sclassName}
                        </Button>
                    ))}
                </Box>
            </Box>

            {/* Assignment Mode */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Assignment Mode
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={assignmentMode === 'add'}
                                onChange={() => setAssignmentMode('add')}
                            />
                        }
                        label="Add to existing subjects"
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={assignmentMode === 'replace'}
                                onChange={() => setAssignmentMode('replace')}
                            />
                        }
                        label="Replace all subjects"
                    />
                </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 4 }}>
                {/* Teachers Selection */}
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Select Teachers ({selectedTeachers.length} selected)
                        </Typography>
                        <Button
                            size="small"
                            onClick={handleSelectAllTeachers}
                            variant="outlined"
                        >
                            {selectedTeachers.length === teachersList.length ? 'Deselect All' : 'Select All'}
                        </Button>
                    </Box>

                    <TableContainer sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <StyledTableRow>
                                    <StyledTableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedTeachers.length === teachersList.length && teachersList.length > 0}
                                            indeterminate={selectedTeachers.length > 0 && selectedTeachers.length < teachersList.length}
                                            onChange={handleSelectAllTeachers}
                                        />
                                    </StyledTableCell>
                                    <StyledTableCell>Name</StyledTableCell>
                                    <StyledTableCell>Current Subjects</StyledTableCell>
                                </StyledTableRow>
                            </TableHead>
                            <TableBody>
                                {teachersList && teachersList.map((teacher) => {
                                    const subjectNames = (teacher.teachSubjects && teacher.teachSubjects.length > 0)
                                        ? teacher.teachSubjects.map(s => s.subName).join(', ')
                                        : 'None';

                                    return (
                                        <StyledTableRow key={teacher._id}>
                                            <StyledTableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedTeachers.includes(teacher._id)}
                                                    onChange={() => handleTeacherSelect(teacher._id)}
                                                />
                                            </StyledTableCell>
                                            <StyledTableCell>{teacher.name}</StyledTableCell>
                                            <StyledTableCell>{subjectNames}</StyledTableCell>
                                        </StyledTableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>

                {/* Subjects Selection */}
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                            Select Subjects ({selectedSubjects.length} selected)
                        </Typography>
                        {selectedClass && (
                            <Button
                                size="small"
                                onClick={handleSelectAllSubjects}
                                variant="outlined"
                                disabled={subjectsLoading}
                            >
                                {selectedSubjects.length === subjectsList.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        )}
                    </Box>

                    <TableContainer sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <StyledTableRow>
                                    <StyledTableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedSubjects.length === subjectsList.length && subjectsList.length > 0}
                                            indeterminate={selectedSubjects.length > 0 && selectedSubjects.length < subjectsList.length}
                                            onChange={handleSelectAllSubjects}
                                            disabled={!selectedClass || subjectsLoading}
                                        />
                                    </StyledTableCell>
                                    <StyledTableCell>Subject Name</StyledTableCell>
                                    <StyledTableCell>Code</StyledTableCell>
                                </StyledTableRow>
                            </TableHead>
                            <TableBody>
                                {subjectsList && subjectsList.length > 0 ? (
                                    subjectsList.map((subject) => (
                                        <StyledTableRow key={subject._id}>
                                            <StyledTableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedSubjects.includes(subject._id)}
                                                    onChange={() => handleSubjectSelect(subject._id)}
                                                />
                                            </StyledTableCell>
                                            <StyledTableCell>{subject.subName}</StyledTableCell>
                                            <StyledTableCell>{subject.subCode}</StyledTableCell>
                                        </StyledTableRow>
                                    ))
                                ) : (
                                    <StyledTableRow>
                                        <StyledTableCell colSpan={3} align="center">
                                            {selectedClass ? (subjectsLoading ? 'Loading...' : 'No subjects found for this class') : 'Please select a class first'}
                                        </StyledTableCell>
                                    </StyledTableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <PurpleButton
                    variant="contained"
                    onClick={() => navigate("/Admin/teachers")}
                >
                    Back to Teachers
                </PurpleButton>

                <GreenButton
                    variant="contained"
                    onClick={handleBulkAssign}
                    disabled={loading || selectedTeachers.length === 0 || selectedSubjects.length === 0}
                >
                    {loading ? 'Assigning...' : `Assign ${selectedSubjects.length} Subject(s) to ${selectedTeachers.length} Teacher(s)`}
                </GreenButton>
            </Box>
        </Paper>
    );
};

export default BulkAssignTeachers;