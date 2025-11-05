import { Container, Grid, Paper, FormControl, InputLabel, Select, MenuItem, Button, Card, CardContent } from '@mui/material'
import SeeNotice from '../../components/SeeNotice';
import CountUp from 'react-countup';
import styled from 'styled-components';
import Students from "../../assets/img1.png";
import Lessons from "../../assets/subjects.svg";
import Tests from "../../assets/assignment.svg";
import Time from "../../assets/time.svg";
import { getClassStudents, getSubjectDetails } from '../../redux/sclassRelated/sclassHandle';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { setActiveSubject } from '../../redux/userRelated/userSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherHomePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { currentUser } = useSelector((state) => state.user);
    const { subjectDetails, sclassStudents } = useSelector((state) => state.sclass);

    const classID = currentUser.teachSclass?._id
    // Use global active subject from Redux (set on login or by selector)
    const activeSubjectID = useSelector(state => state.user.activeSubjectId);

    useEffect(() => {
        // Refresh teacher subjects on mount to include admin-assigned changes
        (async () => {
            try {
                if (currentUser?.role === 'Teacher' && currentUser?._id) {
                    const refreshed = await axios.get(`${process.env.REACT_APP_BASE_URL}/Teacher/${currentUser._id}`);
                    if (refreshed.data) {
                        console.log('🔄 TEACHER PAGE REFRESH: Updating localStorage with fresh data (session isolated)');

                        // Update localStorage with session isolation
                        const sessionId = localStorage.getItem('sessionId');
                        const userData = {
                            ...refreshed.data,
                            sessionId: sessionId,
                            timestamp: Date.now()
                        };
                        localStorage.setItem('user', JSON.stringify(userData));

                        // If active subject is missing or not in list, set to first subject
                        const list = Array.isArray(refreshed.data.teachSubjects) ? refreshed.data.teachSubjects : [];
                        console.log('🔄 TEACHER PAGE REFRESH: Available subjects:', list);
                        if (!activeSubjectID || !list.some(s => String(s._id) === String(activeSubjectID))) {
                            if (list.length > 0) {
                                console.log('🔄 TEACHER PAGE REFRESH: Setting active subject to first available:', list[0]._id);
                                dispatch(setActiveSubject(String(list[0]._id)));
                            }
                        }
                    }
                }
            } catch (e) {
                // non-blocking
                console.warn('Teacher refresh failed:', e?.message || e);
            } finally {
                if (activeSubjectID) dispatch(getSubjectDetails(activeSubjectID, "Subject"));
                if (classID) dispatch(getClassStudents(classID));
            }
        })();
    }, [dispatch, activeSubjectID, classID, currentUser]);

    const numberOfStudents = sclassStudents && sclassStudents.length;
    const numberOfSessions = subjectDetails && subjectDetails.sessions

    return (
        <>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                {currentUser.teachSubjects && currentUser.teachSubjects.length > 1 && (
                    <FormControl sx={{ minWidth: 240, mb: 2 }}>
                        <InputLabel id="active-subject-label">Active Subject</InputLabel>
                        <Select
                            labelId="active-subject-label"
                            value={activeSubjectID || ''}
                            label="Active Subject"
                            onChange={(e) => dispatch(setActiveSubject(e.target.value))}
                        >
                            {currentUser.teachSubjects.map((s) => (
                                <MenuItem key={s._id} value={s._id}>{s.subName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
                {/* Mes matières */}
                {currentUser?.teachSubjects && currentUser.teachSubjects.length > 0 && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        {currentUser.teachSubjects.map((s) => (
                            <Grid item xs={12} sm={6} md={4} key={s._id}>
                                <Card>
                                    <CardContent>
                                        <p style={{ fontWeight: 600, margin: 0 }}>{s.subName}</p>
                                        {s.sessions !== undefined && (
                                            <p style={{ color: '#666', margin: '4px 0' }}>Sessions: {s.sessions}</p>
                                        )}
                                        <Button size="small" variant="outlined" onClick={() => { dispatch(setActiveSubject(s._id)); navigate('/Teacher/subject/files'); }}>
                                            Voir fichiers
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={3} lg={3}>
                        <StyledPaper>
                            <img src={Students} alt="Students" />
                            <Title>
                                Class Students
                            </Title>
                            <Data start={0} end={numberOfStudents} duration={2.5} />
                        </StyledPaper>
                    </Grid>
                    <Grid item xs={12} md={3} lg={3}>
                        <StyledPaper>
                            <img src={Lessons} alt="Lessons" />
                            <Title>
                                Total Lessons
                            </Title>
                            <Data start={0} end={numberOfSessions} duration={5} />
                        </StyledPaper>
                    </Grid>
                    <Grid item xs={12} md={3} lg={3}>
                        <StyledPaper>
                            <img src={Tests} alt="Tests" />
                            <Title>
                                Tests Taken
                            </Title>
                            <Data start={0} end={24} duration={4} />
                        </StyledPaper>
                    </Grid>
                    <Grid item xs={12} md={3} lg={3}>
                        <StyledPaper>
                            <img src={Time} alt="Time" />
                            <Title>
                                Total Hours
                            </Title>
                            <Data start={0} end={30} duration={4} suffix="hrs"/>                        </StyledPaper>
                    </Grid>
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
                            <SeeNotice />
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </>
    )
}

const StyledPaper = styled(Paper)`
  padding: 16px;
  display: flex;
  flex-direction: column;
  height: 200px;
  justify-content: space-between;
  align-items: center;
  text-align: center;
`;

const Title = styled.p`
  font-size: 1.25rem;
`;

const Data = styled(CountUp)`
  font-size: calc(1.3rem + .6vw);
  color: green;
`;

export default TeacherHomePage