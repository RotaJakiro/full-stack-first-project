const WORD_URL = 'https://words.dev-apis.com/word-of-the-day';
const CHECK_URL = 'https://words.dev-apis.com/validate-word';
const WORD_LENGTH = 5;
const MAX_ROWS = 6;

const grid = document.getElementById('grid');
const spinner = document.getElementById('spinner');
const statusEl = document.getElementById('status');
const title = document.getElementById('title');

// build the 30 boxes here instead of repeating them in the HTML
const boxes = [];
for (let i = 0; i < WORD_LENGTH * MAX_ROWS; i++) {
  const box = document.createElement('div');
  box.className = 'letter-box';
  box.addEventListener('animationend', () => box.classList.remove('invalid'));
  grid.appendChild(box);
  boxes.push(box);
}

let currentRow = 0;
let currentColumn = 0;
let wordOfTheDay = '';
let isLoading = true;   // true while waiting for the network
let gameOver = false;

function setLoading(value) {
  isLoading = value;
  spinner.classList.toggle('show', value);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function boxAt(row, col) {
  return boxes[row * WORD_LENGTH + col];
}

async function getTheWord() {
  setLoading(true);
  try {
    const res = await fetch(WORD_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    wordOfTheDay = data.word.toUpperCase();
  } catch (err) {
    console.error(err);
    gameOver = true;
    setStatus("Couldn't load today's word. Reload the page to try again.");
  } finally {
    setLoading(false);
  }
}

async function isItValidWord(word) {
  setLoading(true);
  try {
    const res = await fetch(CHECK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.validWord;
  } catch (err) {
    console.error(err);
    setStatus("Couldn't check that word. Try again.");
    return null;   // null = unknown, different from "not a word"
  } finally {
    setLoading(false);
  }
}

function currentGuess() {
  let guess = '';
  for (let i = 0; i < WORD_LENGTH; i++) guess += boxAt(currentRow, i).textContent;
  return guess;
}

function colorRow(guess) {
  const remaining = wordOfTheDay.split('');
  const results = new Array(WORD_LENGTH);

  // pass 1: exact matches
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === wordOfTheDay[i]) {
      results[i] = 'green';
      remaining[i] = null;
    }
  }
  // pass 2: right letter, wrong place (each letter in the word is used once)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (results[i]) continue;
    const foundAt = remaining.indexOf(guess[i]);
    if (foundAt !== -1) {
      results[i] = 'yellow';
      remaining[foundAt] = null;
    } else {
      results[i] = 'gray';
    }
  }
  results.forEach((color, i) => boxAt(currentRow, i).classList.add(color));
}

async function submitGuess() {
  if (currentColumn < WORD_LENGTH) return;
  const guess = currentGuess();

  const valid = await isItValidWord(guess);
  if (valid === null) return;
  if (!valid) {
    setStatus('Not in the word list.');
    for (let i = 0; i < WORD_LENGTH; i++) boxAt(currentRow, i).classList.add('invalid');
    return;
  }

  setStatus('');
  colorRow(guess);

  if (guess === wordOfTheDay) {
    gameOver = true;
    title.classList.add('winner');
    setStatus('You win!');   // a status line, not alert(): alert() blocks the colors from painting
    return;
  }

  currentRow++;
  currentColumn = 0;
  if (currentRow === MAX_ROWS) {
    gameOver = true;
    setStatus(`You lost. The word was ${wordOfTheDay}.`);
  }
}

function handleKeydown(event) {
  if (isLoading || gameOver) return;
  if (event.ctrlKey || event.metaKey || event.altKey) return;   // let Ctrl+R etc. work

  const key = event.key;
  if (/^[a-zA-Z]$/.test(key)) {
    if (currentColumn < WORD_LENGTH) {
      const box = boxAt(currentRow, currentColumn);
      box.textContent = key.toUpperCase();
      box.classList.add('filled');
      currentColumn++;
    }
  } else if (key === 'Backspace') {
    if (currentColumn > 0) {
      currentColumn--;
      const box = boxAt(currentRow, currentColumn);
      box.textContent = '';
      box.classList.remove('filled');
    }
  } else if (key === 'Enter') {
    submitGuess();
  }
}

document.addEventListener('keydown', handleKeydown);
getTheWord();

/** ---------- live visitor counter (WebSocket) ---------- */
function connectSocket() {
  // ws:// on http pages, wss:// on https pages
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${window.location.host}`);
  ws.onmessage = (event) => {
    try {
      const { visitors } = JSON.parse(event.data);
      document.getElementById('visitors').textContent = visitors;
    } catch (err) {
      console.error('bad message', err);
    }
  };
  ws.onclose = () => setTimeout(connectSocket, 3000);   // reconnect
}
connectSocket();