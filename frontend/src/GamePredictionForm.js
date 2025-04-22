import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase-config';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import {
  Box,
  Button,
  Container,
  Grid,
  TextField,
  Typography,
  Paper,
} from '@mui/material';

const GamePredictionForm = () => {
  const [games, setGames] = useState([]);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    const fetchGamesAndPredictions = async () => {
      const user = auth.currentUser;
  
      const gamesSnapshot = await getDocs(collection(db, 'games'));
      const gamesList = gamesSnapshot.docs.map((doc) => {
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
  
      // Sort games by start time
      gamesList.sort((a, b) => a.parsedStartTime - b.parsedStartTime);
      setGames(gamesList);
  
      // Fetch user predictions if logged in
      if (user) {
        const userDoc = await getDoc(doc(db, 'predictions', user.uid));
        if (userDoc.exists()) {
          const savedPredictions = userDoc.data().predictions || {};
          setPredictions(savedPredictions);
        }
      }
    };
  
    fetchGamesAndPredictions();
  }, []);  

  const groupGamesByDate = (gamesList) => {
    return gamesList.reduce((groupedGames, game) => {
      const gameDate = game.parsedStartTime.toLocaleDateString();
      if (!groupedGames[gameDate]) {
        groupedGames[gameDate] = [];
      }
      groupedGames[gameDate].push(game);
      return groupedGames;
    }, {});
  };

  const handleInputChange = (gameId, team, value) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0) {
      console.error(`Invalid value: ${value}`);
      return;
    }
  
    const currentGame = games.find((game) => game.id === gameId);
    if (!currentGame) {
      console.error(`Game with ID ${gameId} not found!`);
      return;
    }
  
    setPredictions((prev) => ({
      ...prev,
      [gameId]: {
        homeTeam: currentGame.homeTeam,
        awayTeam: currentGame.awayTeam,
        homeScore: team === currentGame.homeTeam ? numericValue : prev[gameId]?.homeScore ?? 0,
        awayScore: team === currentGame.awayTeam ? numericValue : prev[gameId]?.awayScore ?? 0,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert('You must be logged in to submit predictions.');
      return;
    }

    try {
      const userDocRef = doc(db, 'predictions', user.uid);
      await setDoc(userDocRef, {
        predictions,
        timestamp: new Date(),
      });

      alert('Predictions saved!');
    } catch (error) {
      console.error('Error saving predictions:', error);
      alert('Something went wrong while saving.');
    }
  };

  const getFlagSrc = (teamName) => {
    if (!teamName) return '/flags/unknown.png';
    return `/flags/${teamName.toLowerCase()}.png`;
  };

  const groupedGames = groupGamesByDate(games);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom color="white">
        Predict Game Scores
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={2}>
          {Object.entries(groupedGames).map(([date, gamesOnDate]) => (
            <Grid item key={date}>
              <Typography variant="h6" color="white" sx={{ mb: 2 }}>
                {date}
              </Typography>
              {gamesOnDate.map((game) => (
                <Paper key={game.id} sx={{ p: 2, backgroundColor: '#2d2d2d', mb: 1 }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item>
                      <Typography color="white">
                        {game.parsedStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography sx={{ minWidth: 70 }} color="white">
                        {game.homeTeam}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <img
                        src={getFlagSrc(game.homeTeam)}
                        alt={game.homeTeam}
                        style={{ width: 24, height: 16 }}
                      />
                    </Grid>
                    <Grid item>
                      <TextField
                        type="number"
                        size="small"
                        value={predictions[game.id]?.homeScore ?? 0} // Varmistetaan, että arvo on numero
                        onChange={(e) => handleInputChange(game.id, game.homeTeam, e.target.value)}
                        inputProps={{ min: 0, style: { textAlign: 'center', width: '40px' } }}
                        required
                      />

                    </Grid>
                    <Grid item>
                      <TextField
                        type="number"
                        size="small"
                        value={predictions[game.id]?.awayScore ?? 0} // Varmistetaan, että arvo on numero
                        onChange={(e) => handleInputChange(game.id, game.awayTeam, e.target.value)}
                        inputProps={{ min: 0, style: { textAlign: 'center', width: '40px' } }}
                        required
                      />

                    </Grid>
                    <Grid item>
                      <img
                        src={getFlagSrc(game.awayTeam)}
                        alt={game.awayTeam}
                        style={{ width: 24, height: 16 }}
                      />
                    </Grid>
                    <Grid item>
                      <Typography sx={{ minWidth: 70 }} color="white">
                        {game.awayTeam}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
          ))}
          <Grid item>
            <Button type="submit" variant="contained" color="success">
              Submit Predictions
            </Button>
          </Grid>
        </Grid>
      </form>
    </Container>
  );
};

export default GamePredictionForm;