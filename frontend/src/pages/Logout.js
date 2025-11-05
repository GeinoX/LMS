import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authLogout } from '../redux/userRelated/userSlice';
import { Box, Button, Card, CardContent, Typography, Avatar } from '@mui/material';
import { Logout as LogoutIcon, Cancel } from '@mui/icons-material';

const Logout = () => {
    const currentUser = useSelector(state => state.user.currentUser);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleLogout = () => {
        console.log('🚪 LOGOUT BUTTON: User clicked logout');
        console.log('🚪 LOGOUT BUTTON: Current user before logout:', currentUser);

        // Clear all localStorage except sessionId to maintain isolation
        console.log('🚪 LOGOUT BUTTON: Clearing localStorage (keeping sessionId)');
        const sessionId = localStorage.getItem('sessionId');
        localStorage.clear();
        if (sessionId) {
            localStorage.setItem('sessionId', sessionId);
            console.log('🚪 LOGOUT BUTTON: Preserved sessionId:', sessionId);
        }

        // Dispatch logout action
        console.log('🚪 LOGOUT BUTTON: Dispatching authLogout action');
        dispatch(authLogout());

        // Force reload to clear all state
        console.log('🚪 LOGOUT BUTTON: Scheduling page reload');
        setTimeout(() => {
            console.log('🚪 LOGOUT BUTTON: Reloading page to /');
            window.location.href = '/';
        }, 100);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 2
            }}
        >
            <Card
                sx={{
                    maxWidth: 500,
                    width: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)'
                }}
            >
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Avatar
                        sx={{
                            width: 80,
                            height: 80,
                            margin: '0 auto 20px',
                            bgcolor: '#1976d2',
                            fontSize: '2rem'
                        }}
                    >
                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>

                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {currentUser?.name || 'Utilisateur'}
                    </Typography>

                    <Typography variant="h6" gutterBottom sx={{ mb: 4, color: '#666' }}>
                        Êtes-vous sûr de vouloir vous déconnecter ?
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                            variant="contained"
                            color="error"
                            size="large"
                            startIcon={<LogoutIcon />}
                            onClick={handleLogout}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                                '&:hover': {
                                    boxShadow: '0 6px 16px rgba(244, 67, 54, 0.4)',
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.3s ease'
                                }
                            }}
                        >
                            Se déconnecter
                        </Button>

                        <Button
                            variant="outlined"
                            color="primary"
                            size="large"
                            startIcon={<Cancel />}
                            onClick={handleCancel}
                            sx={{
                                px: 4,
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                borderWidth: 2,
                                '&:hover': {
                                    borderWidth: 2,
                                    transform: 'translateY(-2px)',
                                    transition: 'all 0.3s ease'
                                }
                            }}
                        >
                            Annuler
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Logout;
