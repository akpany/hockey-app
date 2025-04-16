import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

// Map team names to ISO 2-letter codes
const flagMap = {
  Finland: 'FI',
  Sweden: 'SE',
  Canada: 'CA',
  USA: 'US',
  Slovakia: 'SK',
  Austria: 'AT',
  Denmark: 'DK',
  Switzerland: 'CH',
  // Add more as needed
};

const getFlagEmoji = (teamName) => {
  const code = flagMap[teamName];
  if (!code) return '🏳️';
  return code
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
};

const HomePage = () => {
  const [gamesByDate, setGamesByDate] = useState({});

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'games'));
        const games = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const parsed = games
          .filter(game => game.startTime)
          .map(game => {
            const dateObj = typeof game.startTime === 'string'
              ? new Date(game.startTime)
              : game.startTime.toDate?.() || new Date();
            return { ...game, parsedStartTime: dateObj };
          })
          .sort((a, b) => a.parsedStartTime - b.parsedStartTime);

        const grouped = {};
        parsed.forEach(game => {
          const dateKey = game.parsedStartTime.toISOString().split('T')[0]; // YYYY-MM-DD
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

  return (
    <div>
      <h2>Game Schedule</h2>
      {Object.entries(gamesByDate).map(([date, games]) => (
        <div key={date} style={{ marginBottom: '30px' }}>
          <h3>{new Date(date).toLocaleDateString('en-GB')}</h3>
          {games.map(game => {
            const time = game.parsedStartTime.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const homeFlag = getFlagEmoji(game.homeTeam);
            const awayFlag = getFlagEmoji(game.awayTeam);

            const result = game.result;
            const matchup = result
              ? `${game.homeTeam} ${result.home} - ${result.away} ${game.awayTeam}`
              : `${game.homeTeam} - ${game.awayTeam}`;

            return (
              <p key={game.id}>
                hello user
                <strong>{time}</strong> — {homeFlag} {matchup} {awayFlag}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default HomePage;
