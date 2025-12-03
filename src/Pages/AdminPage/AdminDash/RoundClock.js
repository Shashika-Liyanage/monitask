import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/system';

// Styled Box for the round clock face
const ClockBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: 120, // Define size
    height: 120,
    borderRadius: '50%', // Makes it round
    backgroundColor: '#fff', // White background
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    p: 1,
    margin: '0 auto', // Center the clock within its container
}));

const RoundClock = ({ city, timezone, initialTime }) => {
    const [time, setTime] = useState(initialTime);

    // This useEffect updates the time every second (or minute for simplicity)
    // NOTE: For true timezone accuracy, you should use Intl.DateTimeFormat or a library like moment-timezone.
    useEffect(() => {
        const timer = setInterval(() => {
            // Placeholder: In a real app, this would calculate time based on timezone.
            // For now, it just shows the initial time given by the search result.
            // setTime(new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit' }));
        }, 60000); 
        return () => clearInterval(timer);
    }, [timezone]);

    return (
        <ClockBox>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
                {time}
            </Typography>
            <Typography variant="caption" color="text.secondary">
                {city}
            </Typography>
        </ClockBox>
    );
};

export default RoundClock;