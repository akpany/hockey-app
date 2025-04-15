// Leaderboard.js
import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

function calculatePoints(predA, predB, actualA, actualB) {
  const predictedWinner = predA > predB ? 'A' : predA < predB ? 'B' : 'D';
  const actualWinner = actualA > actualB ? 'A' : actualA < actualB ? 'B' : 'D';

  if (predictedWinner !== actualWinner) return 0;
  if (predA === actualA && predB === actualB) return 10;

  const scoreDifference =
    Math.abs(predA - actualA) + Math.abs(predB - actualB);
  return Math.max(0, 10 - scoreDifference);
}

const Leaderboard = () => {
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const gamesSnapshot = await getDocs(collection(db, 'games'));
      const games = {};
      gamesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.result?.home !== undefined && data.result?.away !== undefined) {
          games[data.id] = {
            homeTeam: data.homeTeam,
            awayTeam: data.awayTeam,
            homeScore: data.result.home,
            awayScore: data.result.away,
          };
        }
      });

      const predictionsSnapshot = await getDocs(collection(db, 'predictions'));
      const userScores = [];

      predictionsSnapshot.forEach(doc => {
        const uid = doc.id;
        const data = doc.data().predictions || {};
        let totalPoints = 0;

        for (const [gameId, guess] of Object.entries(data)) {
          const game = games[gameId];
          if (!game) continue;

          const predictedHome = parseInt(guess[game.homeTeam]);
          const predictedAway = parseInt(guess[game.awayTeam]);
          const actualHome = game.homeScore;
          const actualAway = game.awayScore;

          if (
            isNaN(predictedHome) ||
            isNaN(predictedAway) ||
            actualHome === undefined ||
            actualAway === undefined
          )
            continue;

          const points = calculatePoints(
            predictedHome,
            predictedAway,
            actualHome,
            actualAway
          );
          totalPoints += points;
        }

        userScores.push({ uid, points: totalPoints });
      });

      // Sort by points, descending
      userScores.sort((a, b) => b.points - a.points);
      setScores(userScores);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2>Leaderboard</h2>
      {scores.length === 0 ? (
        <p>No scores to display yet.</p>
      ) : (
        <ol>
          {scores.map(({ uid, points }) => (
            <li key={uid}>
              {uid}: {points} points
            </li>
          ))}
        </ol>
      )}
    </div>
  );
};

export default Leaderboard;
