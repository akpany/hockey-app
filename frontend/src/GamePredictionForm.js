import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase-config'; // make sure the file is inside src/
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

const GamePredictionForm = () => {
  const [games, setGames] = useState([]);
  const [predictions, setPredictions] = useState({});

  useEffect(() => {
    const fetchGames = async () => {
      const gamesSnapshot = await getDocs(collection(db, "games"));
      const gamesList = gamesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGames(gamesList);
    };

    fetchGames();
  }, []);

  const handleInputChange = (gameId, team, value) => {
    setPredictions((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        [team]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) {
      alert("You must be logged in to submit predictions.");
      return;
    }

    try {
      const userDocRef = doc(db, 'predictions', user.uid);
      await setDoc(userDocRef, {
        predictions,
        timestamp: new Date(),
      });

      alert("Predictions saved!");
    } catch (error) {
      console.error("Error saving predictions:", error);
      alert("Something went wrong while saving.");
    }
  };

  return (
    <div className="p-4 text-white">
      <h2 className="text-2xl font-bold mb-4">Predict Game Scores</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {games.map((game) => (
          <div key={game.id} className="bg-zinc-800 p-4 rounded-xl shadow-md">
            <strong className="text-lg">
              {game.homeTeam} vs {game.awayTeam}
            </strong>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                placeholder={`${game.homeTeam} Score`}
                value={predictions[game.id]?.[game.homeTeam] || ''}
                onChange={(e) =>
                  handleInputChange(game.id, game.homeTeam, e.target.value)
                }
                className="p-2 rounded bg-zinc-700 text-white w-20"
                required
              />
              <span>–</span>
              <input
                type="number"
                placeholder={`${game.awayTeam} Score`}
                value={predictions[game.id]?.[game.awayTeam] || ''}
                onChange={(e) =>
                  handleInputChange(game.id, game.awayTeam, e.target.value)
                }
                className="p-2 rounded bg-zinc-700 text-white w-20"
                required
              />
            </div>
          </div>
        ))}
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Submit Predictions
        </button>
      </form>
    </div>
  );
};

export default GamePredictionForm;
