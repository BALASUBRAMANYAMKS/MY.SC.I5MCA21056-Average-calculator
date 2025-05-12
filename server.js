const express = require('express');
const axios = require('axios');

const app = express();
const PORT = 9876;
const WINDOW_SIZE = 10;
const TIMEOUT = 500; 

let windowNumbers = [];

const API_MAP = {
  p: 'http://20.244.56.144/evaluation-service/primes',
  f: 'http://20.244.56.144/evaluation-service/fibo',
  e: 'http://20.244.56.144/evaluation-service/even',
  r: 'http://20.244.56.144/evaluation-service/rand',
};

// Mock data for testing
const MOCK_DATA = {
  p: [2, 3, 5, 7, 11],
  f: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
  e: [2, 4, 6, 8, 10, 12, 14, 16],
  r: [5, 12, 19, 7, 25, 30],
};

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return parseFloat((sum / numbers.length).toFixed(2));
}

app.get('/numbers/:numberid', async (req, res) => {
  const numberId = req.params.numberid;
  const url = API_MAP[numberId];

  if (!url) {
    return res.status(400).json({ error: 'Invalid number ID. Use p, f, e, or r.' });
  }

  const windowPrevState = [...windowNumbers];
  let newNumbers = [];

  try {
    const response = await axios.get(url, { timeout: TIMEOUT });
    if (response.data && Array.isArray(response.data.numbers)) {
      newNumbers = response.data.numbers;
    } else {
      console.warn(' Invalid response format from 3rd party API.');
      newNumbers = MOCK_DATA[numberId] || [];
    }
  } catch (err) {
    console.warn(` Error fetching from ${url} — using mock data.`, err.message);
    newNumbers = MOCK_DATA[numberId] || [];
  }

  newNumbers = newNumbers.filter(num => !windowNumbers.includes(num));

  windowNumbers = [...windowNumbers, ...newNumbers];

  if (windowNumbers.length > WINDOW_SIZE) {
    windowNumbers = windowNumbers.slice(windowNumbers.length - WINDOW_SIZE);
  }

  const avg = calculateAverage(windowNumbers);

  res.json({
    windowPrevState,
    windowCurrState: [...windowNumbers],
    numbers: newNumbers,
    avg
  });
});

app.listen(PORT, () => {
  console.log(` Average Calculator microservice running at http://localhost:${PORT}`);
});
