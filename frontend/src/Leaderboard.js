import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';

function calculatePoints(predHome, predAway, actualHome, actualAway) {
  const predictedWinner =
    predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const actualWinner =
    actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw';

  if (predictedWinner !== actualWinner) return 0;

  if (predHome === actualHome && predAway === actualAway) {
    return actualWinner === 'draw' ? 20 : 10; // Täydellinen tasapeli, tuplapisteet
  }

  const scoreDifference =
    Math.abs(predHome - actualHome) + Math.abs(predAway - actualAway);

  return Math.max(
    0,
    actualWinner === 'draw' ? 20 - scoreDifference * 2 : 10 - scoreDifference
  ); // Tasapelin pisteet tuplana
}

const Leaderboard = () => {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const gamesSnapshot = await getDocs(collection(db, 'games'));
      const games = {};
      gamesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.result?.home !== undefined && data.result?.away !== undefined) {
          games[doc.id] = {
            homeTeam: data.homeTeam,
            awayTeam: data.awayTeam,
            homeScore: data.result.home,
            awayScore: data.result.away,
          };
        }
      });

      const predictionsSnapshot = await getDocs(collection(db, 'predictions'));
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = {};
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users[doc.id] = data.username || 'Unknown User';
      });

      const userScores = [];
      predictionsSnapshot.forEach((doc) => {
        const uid = doc.id;
        if (!users[uid]) return;

        const predictions = doc.data().predictions || {};
        let totalPoints = 0;

        for (const [gameId, guess] of Object.entries(predictions)) {
          const game = games[gameId];
          if (!game) continue;

          // Tässä käytetään Firestonen avaimia suoraan ennusteiden lukemiseen
          const predictedHome = parseInt(guess[game.homeTeam], 10);
          const predictedAway = parseInt(guess[game.awayTeam], 10);
          const actualHome = game.homeScore;
          const actualAway = game.awayScore;

          if (
            isNaN(predictedHome) ||
            isNaN(predictedAway) ||
            actualHome === undefined ||
            actualAway === undefined
          ) {
            continue;
          }

          const points = calculatePoints(
            predictedHome,
            predictedAway,
            actualHome,
            actualAway
          );
          totalPoints += points;
        }

        userScores.push({
          username: users[uid],
          points: totalPoints,
        });
      });

      userScores.sort((a, b) => b.points - a.points);
      setScores(userScores);
    };

    fetchData();
  }, []);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom color="white">
        Leaderboard
      </Typography>
      {scores.length === 0 ? (
        <Typography color="white">No scores to display yet.</Typography>
      ) : (
        <Paper sx={{ backgroundColor: '#2d2d2d' }}>
          <List>
            {scores.map(({ username, points }, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Typography color="white">
                        #{index + 1} – {username}
                      </Typography>
                    }
                    secondary={
                      <Typography color="gray">
                        {points} point{points === 1 ? '' : 's'}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < scores.length - 1 && (
                  <Divider sx={{ backgroundColor: '#444' }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Container>
  );
};

export default Leaderboard;