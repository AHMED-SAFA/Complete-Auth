
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TextField, Button, Container, Typography, Box, Alert } from '@mui/material';

const VerifyEmail = () => {
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { verifyEmail } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        
        const success = await verifyEmail(email, code);
        if (success) {
          console.log('Email verified successfully!', success);
            setMessage('Email verified successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } else {
            console.log('Verification failed. Please check your code and try again.');
            setError('Verification failed. Please check your code and try again.');
        }
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    Verify Email
                </Typography>
                {message && <Alert severity="success" sx={{ width: '100%', mt: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="code"
                        label="Verification Code"
                        type="text"
                        inputProps={{ maxLength: 6 }}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Verify Email
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default VerifyEmail;