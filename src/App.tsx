import { useRef, useState, useEffect } from 'react'
import './App.css'

const WORDS = 6
const WORD_LENGTH = 5
const WORD_LIST_API = 'https://wordle-api.cyclic.app/words'

const toFlatIndex = (row: number, col: number): number => row * WORD_LENGTH + col

const toRowCol = (flat_idx: number): [number, number] => {
  const row = Math.floor(flat_idx / WORD_LENGTH)
  const col = flat_idx % WORD_LENGTH
  return [row, col]
}

enum TGameState {
  WON,
  LOST,
  IN_PROGRESS
}


const GameOverPanel = (
  {gameOver, correctWord}: {gameOver: TGameState, correctWord: string}) => {

  if (gameOver === TGameState.WON) {
    return (
      <div className="gameOver">
        <div className="gameOverText">You Won!</div>
      </div>
    )
  }
  return (
    <div className="gameOver">
      <h1 className="gameOverText">You Lost...😭</h1>
      <h2 className="gameOverText">The word was: {correctWord}</h2>
    </div>
  )
}

function App() {
  const [words, setWords] = useState(
    Array<string[]>(WORDS).fill(Array<string>(WORD_LENGTH).fill('')))
  const [correctWord, setCorrectWord] = useState("")
  const [nextAllowedIdx, setNextAllowedIdx] = useState(0);
  const [gameOver, setGameOver] = useState<TGameState>(TGameState.IN_PROGRESS)
  const inputRef = useRef<Array<HTMLInputElement | null>>([])

  // Fetch from word list api and pick a random word
  const getNewWord  = async () => {
    const response = await fetch(WORD_LIST_API)
    const data = await response.json()
    const randomWord = data[Math.floor(Math.random() * data.length)]
    setCorrectWord(randomWord.word)
  }

  // Could use react query here?
  useEffect(() => {getNewWord()}, [])

  const earlyReturnEditInvalidInput = (inputIdx: number): boolean => {
    if (inputIdx > nextAllowedIdx) {
      const allowedInput = inputRef.current[nextAllowedIdx]
      if (allowedInput) {
        allowedInput.focus()
      }
      return true
    }
    return false
  }

  const earlyReturnHandleBackspace = (row: number, col: number, flatIdx: number): boolean => {
    const newWords = words.map((word) =>(word.slice()))
    // if we're not at the start of the word
    if (col === 0) return true

    // if we're at the end of the word and there is a letter
    if (col === WORD_LENGTH - 1 && words[row][col] !== ''){
      // clear that value in words array, focus stays here
      newWords[row][col] = ''
      setWords(newWords)
      return true
    }
    
    // move focus back one input
    const [prevRow, prevCol] = toRowCol(flatIdx - 1)
    const prevInput = inputRef.current[flatIdx - 1]
    if (prevInput) {
      prevInput.focus()
      prevInput.value = ''
    }
    // clear that value in words array
    newWords[prevRow][prevCol] = ''
    setWords(newWords)
    return true
  }

  const earlyReturnHandleEnter = (row: number, col: number, flatIdx: number): boolean => {
    const newWords = words.map((word) =>(word.slice()))
    const completeWord: boolean = col === WORD_LENGTH - 1
    // We need to check for game stuff here
    // - Check if the word is complete
    if (completeWord) {
      newWords[row].map((l, i) => {
        const currentInput = inputRef.current[toFlatIndex(row, i)]
        if (l === correctWord[i]) {
          // correct letter in the correct spot
          currentInput?.classList.add('correct')
        } else if ( correctWord.includes(l)) {
          // letter is in the word but in the wrong spot
          currentInput?.classList.add('almost')
        }
      })
    }
    const isCorrect: boolean = newWords[row].join('') === correctWord
    if (completeWord && isCorrect) {
      setGameOver(TGameState.WON)
      return true
    }
    if (flatIdx === WORD_LENGTH * WORDS - 1) {
      setGameOver(TGameState.LOST)
      return true
    }
    // don't move to the next input if the word isn't complete
    if (!completeWord)
      return true
    inputRef?.current[flatIdx + 1]?.focus()
    return true
  }

  const handleInput = (e: React.KeyboardEvent<HTMLInputElement>,
      row: number, col: number) => {
    e.preventDefault()
    const flatIdx = toFlatIndex(row, col)

    // Is this the next allowed input? (in case they clicked around)
    if (earlyReturnEditInvalidInput(flatIdx)) return

    // Check for backspace
    if (e.key === 'Backspace') {
      if (earlyReturnHandleBackspace(row, col, flatIdx)) return
    }

    // Check for enter
    if (e.key === 'Enter') {
      if (earlyReturnHandleEnter(row, col, flatIdx)) return
    }
 
    // Check for unused keys
    if (!e.key.match(/[a-zA-Z]/)) return
  
    // If we're here, we have a letter...
    //We want to update the the state and move focus to the next input
    const newWords = words.map((word) =>(word.slice()))
    newWords[row][col] = e.key.toLowerCase() 
    setWords(newWords);
    setNextAllowedIdx(flatIdx + 1)

    // Move to the next input (skip if we're at the end, eg waiting for
    // the user to hit enter)
    if (col === WORD_LENGTH - 1) return
    inputRef?.current[flatIdx + 1]?.focus()
  }

  const handleReset = () => {
    for (const input of inputRef.current) {
      input?.classList.remove('correct')
      input?.classList.remove('almost')
      input?.classList.remove('wrong')
    }
    setWords((prev) => prev.map((word) => word.map(() => '')))
    console.log(words)
    setNextAllowedIdx(0)
    setGameOver(TGameState.IN_PROGRESS)
    getNewWord()
  }

  if (correctWord === '') {
    return <div>Loading...</div>
  }

  return (
    <div>
      {gameOver !== TGameState.IN_PROGRESS ?
        <GameOverPanel
          gameOver={gameOver}
          correctWord={correctWord}/> : null}
      <div className="board">
        {words.map((word, i) => (
          <div className="row" key={i}>
            {word.map((l, j) => (
              <input key={`${i}-${j}`}
                onKeyUp={(e) => handleInput(e, i, j)}
                type="text"
                value={l}
                ref={(ref) => inputRef.current[toFlatIndex(i, j)] = ref}
                maxLength={1}
                autoFocus={i === 0 && j === 0}
                pattern='[a-zA-Z]'
                />))}
          </div>))}
      </div>
      <div className="resetButton">
        <button onClick={handleReset}>reset</button>
      </div>
    </div>
  )
}

export default App
