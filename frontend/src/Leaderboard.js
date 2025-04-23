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

// Pistelaskufunktio
function calculatePoints(predHome, predAway, actualHome, actualAway) {
  const predictedWinner =
    predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const actualWinner =
    actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw';

  if (predictedWinner !== actualWinner) return 0;

  if (predHome === actualHome && predAway === actualAway) {
    return actualWinner === 'draw' ? 20 : 10; // Tuplapisteet oikeasta tasapelistä
  }

  const scoreDifference =
    Math.abs(predHome - actualHome) + Math.abs(predAway - actualAway);

  return Math.max(
    0,
    actualWinner === 'draw' ? 20 - scoreDifference * 2 : 10 - scoreDifference
  );
}

const Leaderboard = () => {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const gamesSnapshot = await getDocs(collection(db, "games"));
      const games = {};
      gamesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Game loaded: ${doc.id}`, data);

        if (data.result?.home !== undefined && data.result?.away !== undefined) {
          games[doc.id] = {
            homeTeam: data.homeTeam,
            awayTeam: data.awayTeam,
            homeScore: parseInt(data.result.home, 10),
            awayScore: parseInt(data.result.away, 10),
          };
        }
      });

      const predictionsSnapshot = await getDocs(collection(db, "predictions"));
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = {};
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        users[doc.id] = data.username || "Unknown User";
      });

      const userScores = [];
      predictionsSnapshot.forEach((doc) => {
        const uid = doc.id;
        if (!users[uid]) return;

        const predictions = doc.data().predictions || {};
        console.log(`Predictions loaded for ${users[uid]}:`, predictions);

        let totalPoints = 0;

        console.log("Games list keys:", Object.keys(games));
        console.log("Predictions keys for user", users[uid], ":", Object.keys(predictions));

        for (const [gameId, guess] of Object.entries(predictions)) {
          console.log(`Checking if game ${gameId} exists in games list...`);
          const game = games[gameId];
          if (!game) {
            console.warn(`Game ID ${gameId} not found in loaded games.`);
            console.warn(`Available game IDs:`, Object.keys(games));
            console.warn(`Predictions game IDs:`, Object.keys(predictions));
            continue;
          }

          const predictedHome = guess?.homeScore !== undefined ? parseInt(guess.homeScore, 10) : null;
          const predictedAway = guess?.awayScore !== undefined ? parseInt(guess.awayScore, 10) : null;
          const actualHome = game?.homeScore;
          const actualAway = game?.awayScore;

          console.log(
            `Game ID: ${gameId}, Predicted: ${predictedHome}-${predictedAway}, Actual: ${actualHome}-${actualAway}`
          );

          if (
            predictedHome === null ||
            predictedAway === null ||
            isNaN(predictedHome) ||
            isNaN(predictedAway) ||
            isNaN(actualHome) ||
            isNaN(actualAway)
          ) {
            console.warn(`Skipping game ${gameId} for ${users[uid]} due to invalid data`);
            continue;
          }

          const points = calculatePoints(
            predictedHome,
            predictedAway,
            actualHome,
            actualAway
          );

          console.log(`Points for game ${gameId} (${users[uid]}): ${points}`);
          totalPoints += points;
        }

        console.log(`Total points for user ${users[uid]}: ${totalPoints}`);
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
        <Paper sx={{ backgroundColor: "#2d2d2d" }}>
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
                        {points} point{points === 1 ? "" : "s"}
                      </Typography>
                    }
                  />
                </ListItem>
                {index < scores.length - 1 && (
                  <Divider sx={{ backgroundColor: "#444" }} />
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