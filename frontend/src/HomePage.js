import React, { useEffect, useState } from 'react';
import { db } from './firebase-config';
import { collection, getDocs } from 'firebase/firestore';
import {
  Container,
  Grid,
  Typography,
  Paper,
} from '@mui/material';

const HomePage = () => {
  const [gamesByDate, setGamesByDate] = useState({});

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'games'));
        const games = snapshot.docs.map(doc => {
          const data = doc.data();
          const parsedTime = typeof data.startTime === 'string'
            ? new Date(data.startTime)
            : data.startTime?.toDate?.() || new Date();

          return {
            id: doc.id,
            ...data,
            parsedStartTime: parsedTime,
          };
        });

        games.sort((a, b) => a.parsedStartTime - b.parsedStartTime);

        const grouped = {};
        games.forEach(game => {
          const dateKey = game.parsedStartTime.toLocaleDateString();
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(game);
        });

        setGamesByDate(grouped);
      } catch (err) {
        console.error('Error fetching games:', err);
      }
    };

    fetchGames();
  }, []);

  const getFlagSrc = (teamName) => {
    if (!teamName) return '/flags/unknown.png';
    return `/flags/${teamName.toLowerCase()}.png`;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom color="white">
        Game Schedule
      </Typography>

      {Object.entries(gamesByDate).map(([date, games]) => (
        <Grid container direction="column" spacing={2} key={date}>
          <Grid item>
            <Typography variant="h6" color="white" sx={{ mb: 2 }}>
              {date}
            </Typography>
            {games.map((game) => {
              const showResult = game.result && game.result.home != null && game.result.away != null;
              const time = game.parsedStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <Paper key={game.id} sx={{ p: 2, backgroundColor: '#2d2d2d', mb: 1 }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item>
                      <Typography color="white">{time}</Typography>
                    </Grid>
                    <Grid item>
                      <Typography sx={{ minWidth: 70 }} color="white">
                        {game.homeTeam}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <img src={getFlagSrc(game.homeTeam)} alt={game.homeTeam} style={{ width: 24, height: 16 }} />
                    </Grid>

                    <Grid item>
                      <Typography color="white">
                        {showResult ? `${game.result.home} – ${game.result.away}` : '–'}
                      </Typography>
                    </Grid>

                    <Grid item>
                      <img src={getFlagSrc(game.awayTeam)} alt={game.awayTeam} style={{ width: 24, height: 16 }} />
                    </Grid>
                    <Grid item>
                      <Typography sx={{ minWidth: 70 }} color="white">
                        {game.awayTeam}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              );
            })}
          </Grid>
        </Grid>
      ))}
    </Container>
  );
};

export default HomePage;
