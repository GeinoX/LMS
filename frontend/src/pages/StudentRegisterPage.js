import * as React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Grid, Box, Typography, Paper, Checkbox, FormControlLabel, TextField, CssBaseline, IconButton, InputAdornment, CircularProgress} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import bgpic from "../assets/designlogin.jpg"
import { LightPurpleButton } from '../components/buttonStyles';
import { registerUser } from '../redux/userRelated/userHandle';
import styled from 'styled-components';
import Popup from '../components/Popup';

const defaultTheme = createTheme();

const StudentRegisterPage = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const { status, currentUser, response, error, currentRole } = useSelector(state => state.user);

    const [toggle, setToggle] = useState(false)
    const [loader, setLoader] = useState(false)
    const [showPopup, setShowPopup] = useState(false);
    const [message, setMessage] = useState("");

    const [rollError, setRollError] = useState(false);
    const [nameError, setNameError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [adminError, setAdminError] = useState(false);
    const [classError, setClassError] = useState(false);

    const role = "Student"

    const handleSubmit = (event) => {
        event.preventDefault();

        const name = event.target.name.value;
        const rollNum = event.target.rollNum.value;
        const password = event.target.password.value;
        const adminID = event.target.adminID.value; // school id
        const sclassName = event.target.sclassName.value; // class id

        if (!name || !rollNum || !password || !adminID || !sclassName) {
            if (!name) setNameError(true);
            if (!rollNum) setRollError(true);
            if (!password) setPasswordError(true);
            if (!adminID) setAdminError(true);
            if (!sclassName) setClassError(true);
            return;
        }

        const fields = { name, rollNum, password, adminID, sclassName, role }
        setLoader(true)
        dispatch(registerUser(fields, role))
    };

    const handleInputChange = (event) => {
        const { name } = event.target;
        if (name === 'name') setNameError(false);
        if (name === 'rollNum') setRollError(false);
        if (name === 'password') setPasswordError(false);
        if (name === 'adminID') setAdminError(false);
        if (name === 'sclassName') setClassError(false);
    };

    useEffect(() => {
        if (status === 'success' || (currentUser !== null && currentRole === 'Student')) {
            navigate('/Student/dashboard');
        }
        else if (status === 'failed') {
            setMessage(response)
            setShowPopup(true)
            setLoader(false)
        }
        else if (status === 'error') {
            console.log(error)
        }
    }, [status, currentUser, currentRole, navigate, error, response]);

    return (
        <ThemeProvider theme={defaultTheme}>
            <Grid container component="main" sx={{ height: '100vh' }}>
                <CssBaseline />
                <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
                    <Box
                        sx={{
                            my: 8,
                            mx: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <Typography variant="h4" sx={{ mb: 2, color: "#2c2143" }}>
                            Student Register
                        </Typography>
                        <Typography variant="h7">
                            Register as a student. Provide the school ID and class ID assigned by your administrator.
                        </Typography>
                        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 2 }}>
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="name"
                                label="Enter your name"
                                name="name"
                                autoComplete="name"
                                autoFocus
                                error={nameError}
                                helperText={nameError && 'Name is required'}
                                onChange={handleInputChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="rollNum"
                                label="Roll Number"
                                name="rollNum"
                                type="number"
                                autoComplete="off"
                                error={rollError}
                                helperText={rollError && 'Roll number is required'}
                                onChange={handleInputChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="adminID"
                                label="School (Admin) ID"
                                name="adminID"
                                autoComplete="off"
                                error={adminError}
                                helperText={adminError && 'School ID is required'}
                                onChange={handleInputChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                id="sclassName"
                                label="Class ID"
                                name="sclassName"
                                autoComplete="off"
                                error={classError}
                                helperText={classError && 'Class ID is required'}
                                onChange={handleInputChange}
                            />
                            <TextField
                                margin="normal"
                                required
                                fullWidth
                                name="password"
                                label="Password"
                                type={toggle ? 'text' : 'password'}
                                id="password"
                                autoComplete="new-password"
                                error={passwordError}
                                helperText={passwordError && 'Password is required'}
                                onChange={handleInputChange}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setToggle(!toggle)}>
                                                {toggle ? (
                                                    <Visibility />
                                                ) : (
                                                    <VisibilityOff />
                                                )}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Grid container sx={{ display: "flex", justifyContent: "space-between" }}>
                                <FormControlLabel
                                    control={<Checkbox value="remember" color="primary" />}
                                    label="Remember me"
                                />
                            </Grid>
                            <LightPurpleButton
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2 }}
                            >
                                {loader ? <CircularProgress size={24} color="inherit"/> : "Register"}
                            </LightPurpleButton>
                            <Grid container>
                                <Grid>
                                    Already have an account?
                                </Grid>
                                <Grid item sx={{ ml: 2 }}>
                                    <StyledLink to="/Studentlogin">
                                        Log in
                                    </StyledLink>
                                </Grid>
                            </Grid>
                        </Box>
                    </Box>
                </Grid>
                <Grid
                    item
                    xs={false}
                    sm={4}
                    md={7}
                    sx={{
                        backgroundImage: `url(${bgpic})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: (t) =>
                            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                />
            </Grid>
            <Popup message={message} setShowPopup={setShowPopup} showPopup={showPopup} />
        </ThemeProvider>
    );
}

export default StudentRegisterPage

const StyledLink = styled(Link)`
  margin-top: 9px;
  text-decoration: none;
  color: #7f56da;
`;
