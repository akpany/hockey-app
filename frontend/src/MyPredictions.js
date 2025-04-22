import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import {
  Container,
  Typography,
  Paper,
  Grid,
  CircularProgress,
} from '@mui/material';

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
  ); // Tasapelin pisteet lasketaan tuplamääränä
}

const MyPredictions = () => {
  const [predictions, setPredictions] = useState({});
  const [gamesByDate, setGamesByDate] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictionsAndGames = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const predictionsDoc = await getDoc(doc(db, "predictions", user.uid));
        if (predictionsDoc.exists()) {
          setPredictions(predictionsDoc.data().predictions || {});
        }

        const gamesSnapshot = await getDocs(collection(db, "games"));
        const gamesList = gamesSnapshot.docs.map((doc) => {
          const data = doc.data();
          const parsedTime =
            typeof data.startTime === "string"
              ? new Date(data.startTime)
              : data.startTime?.toDate?.() || new Date();

          return {
            id: doc.id,
            ...data,
            parsedStartTime: parsedTime,
          };
        });

        // Sort by time
        gamesList.sort((a, b) => a.parsedStartTime - b.parsedStartTime);

        // Group by date
        const grouped = {};
        gamesList.forEach((game) => {
          const dateKey = game.parsedStartTime.toLocaleDateString();
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(game);
        });

        setGamesByDate(grouped);
      } catch (error) {
        console.error("Error fetching predictions or games:", error);
      }

      setLoading(false);
    };

    fetchPredictionsAndGames();
  }, []);

  const getFlagSrc = (teamName) => {
    if (!teamName) return "/flags/unknown.png";
    return `/flags/${teamName.toLowerCase()}.png`;
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: "center", mt: 4 }}>
        <CircularProgress />
        <Typography color="white" mt={2}>
          Loading your predictions...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom color="white">
        My Predictions & Scores
      </Typography>

      {Object.entries(gamesByDate).map(([date, games]) => (
        <Grid container direction="column" spacing={2} key={date}>
          <Grid item>
            <Typography variant="h6" color="white" sx={{ mb: 2 }}>
              {date}
            </Typography>
            {games.map((game) => {
              const pred = predictions[game.id];
              if (!pred) return null;

              const homeTeam = game.homeTeam;
              const awayTeam = game.awayTeam;

              // Tarkistetaan tulokset ja varmistetaan niiden tyypit
              const actualHome = game.result?.home !== undefined ? parseInt(game.result.home, 10) : null;
              const actualAway = game.result?.away !== undefined ? parseInt(game.result.away, 10) : null;

              const hasResult =
                actualHome !== null &&
                actualAway !== null &&
                !isNaN(actualHome) &&
                !isNaN(actualAway);

              // Ennusteiden lukeminen rakenteen mukaisesti
              const predictedHome = pred?.homeScore !== undefined ? parseInt(pred.homeScore, 10) : "N/A";
              const predictedAway = pred?.awayScore !== undefined ? parseInt(pred.awayScore, 10) : "N/A";

              // Lasketaan pisteet, jos tulokset ovat käytettävissä
              const points = hasResult
                ? calculatePoints(predictedHome, predictedAway, actualHome, actualAway)
                : null;

              return (
                <Paper key={game.id} sx={{ p: 2, backgroundColor: "#2d2d2d", mb: 1 }}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item>
                      <Typography color="white">
                        {game.parsedStartTime.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Typography>
                    </Grid>

                    <Grid item>
                      <Typography sx={{ minWidth: 70 }} color="white">
                        {homeTeam}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <img
                        src={getFlagSrc(homeTeam)}
                        alt={homeTeam}
                        style={{ width: 24, height: 16 }}
                      />
                    </Grid>
                    <Grid item>
                      <Typography color="white">
                        {predictedHome} – {predictedAway}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <img
                        src={getFlagSrc(awayTeam)}
                        alt={awayTeam}
                        style={{ width: 24, height: 16 }}
                      />
                    </Grid>
                    <Grid item>
                      <Typography sx={{ minWidth: 70 }} color="white">
                        {awayTeam}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography color="white" sx={{ mt: 1 }}>
                        {hasResult
                          ? `Final Score: ${actualHome} – ${actualAway} | Points: ${points}`
                          : "Game not finished yet."}
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

export default MyPredictions;