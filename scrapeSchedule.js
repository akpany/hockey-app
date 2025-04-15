const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://www.iihf.com/en/events/2025/wm/schedule', { waitUntil: 'networkidle2' });

  // Wait for the schedule to load
  await page.waitForSelector('.schedule-table'); // Adjust the selector based on the actual HTML structure

  // Extract schedule data
  const games = await page.evaluate(() => {
    const rows = document.querySelectorAll('.schedule-table tbody tr');
    const data = [];
    rows.forEach(row => {
      const date = row.querySelector('.date').innerText.trim();
      const time = row.querySelector('.time').innerText.trim();
      const team1 = row.querySelector('.team1').innerText.trim();
      const team2 = row.querySelector('.team2').innerText.trim();
      const venue = row.querySelector('.venue').innerText.trim();
      const group = row.querySelector('.group').innerText.trim();
      data.push({ date, time, team1, team2, venue, group });
    });
    return data;
  });

  // Save to a JSON file
  fs.writeFileSync('schedule.json', JSON.stringify(games, null, 2));

  await browser.close();
})();
