import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

function calculatePoints(predHome, predAway, actualHome, actualAway) {
  const predictedWinner =
    predHome > predAway ? 'home' : predHome < predAway ? 'away' : 'draw';
  const actualWinner =
    actualHome > actualAway ? 'home' : actualHome < actualAway ? 'away' : 'draw';

  if (predictedWinner !== actualWinner) return 0;
  if (predHome === actualHome && predAway === actualAway) return 10;

  const scoreDifference =
    Math.abs(predHome - actualHome) + Math.abs(predAway - actualAway);
  return Math.max(0, 10 - scoreDifference);
}

const MyPredictions = () => {
  const [predictions, setPredictions] = useState({});
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictionsAndGames = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const predictionsDoc = await getDoc(doc(db, 'predictions', user.uid));
        if (predictionsDoc.exists()) {
          setPredictions(predictionsDoc.data().predictions || {});
        }

        const gamesSnapshot = await getDocs(collection(db, 'games'));
        const gamesList = gamesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setGames(gamesList);
      } catch (error) {
        console.error('Error fetching predictions or games:', error);
      }

      setLoading(false);
    };

    fetchPredictionsAndGames();
  }, []);

  if (loading) return <p>Loading your predictions...</p>;

  return (
    <div>
      <h2>My Predictions & Scores</h2>
      {games.map(game => {
        const pred = predictions[game.id];
        if (!pred) return null;

        const homeTeam = game.homeTeam;
        const awayTeam = game.awayTeam;
        const actualHome = game.result?.home;
        const actualAway = game.result?.away;

        const hasResult =
          typeof actualHome === 'number' && typeof actualAway === 'number';

        const predictedHome = parseInt(pred[homeTeam]);
        const predictedAway = parseInt(pred[awayTeam]);

        const points = hasResult
          ? calculatePoints(predictedHome, predictedAway, actualHome, actualAway)
          : null;

        return (
          <div key={game.id} style={{ marginBottom: '20px' }}>
            <strong>
              {homeTeam} vs {awayTeam}
            </strong>
            <p>
              Your Prediction: {predictedHome ?? '–'} – {predictedAway ?? '–'}
            </p>
            {hasResult ? (
              <>
                <p>
                  Final Score: {actualHome} – {actualAway}
                </p>
                <p>
                  Points Earned: <strong>{points}</strong>
                </p>
              </>
            ) : (
              <p>Game not finished yet.</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MyPredictions;
