const letterBox = document.querySelectorAll(".letter-box")
let currentRow = 0
let currentColumn = 0
let wordOfTheDay = ''
const getURL = "https://words.dev-apis.com/word-of-the-day"
const checkURL="https://words.dev-apis.com/validate-word"
function handleKeySreoke(event){
    const key = event.key
    if (key.length === 1 && /^[a-zA-Z]$/.test(key)){
        if (currentColumn < 5){
            const boxIndex = currentRow * 5 + currentColumn
            letterBox[boxIndex].textContent = key.toUpperCase()
            currentColumn++
        }
    }
    if (key === 'Enter'){
        pressEnter()
    }
    if (key === 'Backspace'){
        if (currentColumn > 0){
            currentColumn--
            const boxIndex = currentRow * 5 + currentColumn
            letterBox[boxIndex].textContent = ''
        }
    }
}
document.addEventListener("keydown", handleKeySreoke)
async function getTheWord() {
    const logo=document.querySelector(".logo")
    logo.classList.add("show")
    const promise = await fetch(getURL)
    const processedResponse = await promise.json()
    wordOfTheDay = processedResponse.word.toUpperCase()
    logo.classList.remove("show") 
}
getTheWord()
function guessTheWord() {
    let guess = ''
    for (let i = 0; i < 5; i++){
        let boxIndex = currentRow * 5 + i
        guess += letterBox[boxIndex].textContent
    }
    return guess
}
async function pressEnter(){
    let isRowFull;
    if (currentColumn === 5) {
        isRowFull = true;
    } else {
        isRowFull = false;
    }
    if (isRowFull === false){
        return;
    }
    const guess = guessTheWord();
    const realWord=await isItValidWord(guess)
    if (realWord===false){
        flashInvalid()
        return
    }
    bgColorBox(guess)
    if (guess === wordOfTheDay){
        alert('congrats, you win')
        return
    }
    currentRow++
    currentColumn = 0
    if (currentRow === 6){
        alert(`sorry, you lost today and the word is ${wordOfTheDay}`)
    }
}
function bgColorBox(guess) {
    const wordLetters = wordOfTheDay.split('')
    const results = []
    for (let i = 0; i < 5; i++){
        if (guess[i] === wordOfTheDay[i]){
            results[i] = 'green'
            wordLetters[i] = null
        }
    }
    for (let i = 0; i < 5; i++){
        if (results[i] === 'green') continue
        const letter = guess[i]
        const foundAt = wordLetters.indexOf(letter)
        if (foundAt !== -1){
            results[i] = 'yellow'
            wordLetters[foundAt] = null
        } else {
            results[i] = 'gray'
        }
    }
    for (let i = 0; i < 5; i++){
        const boxIndex = currentRow * 5 + i
        letterBox[boxIndex].classList.add(results[i])
    }
}
async function isItValidWord(word){
    const logo=document.querySelector(".logo")
    logo.classList.add("show")
    const response  = await fetch('https://words.dev-apis.com/validate-word', {method: 'POST',body: JSON.stringify({ word: word }),headers: { 'Content-Type': 'application/json' }})    
    const processedResponse= await response.json()
    logo.classList.remove("show")
    return processedResponse.validWord
}
function flashInvalid(){
    for (let i = 0; i < 5; i++){
        const boxIndex = currentRow * 5 + i
        letterBox[boxIndex].classList.add('invalid')
    }
}
