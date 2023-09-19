import { useRef, useState, useEffect } from 'react'
import './App.css'

const WORDS = 6
const WORD_LENGTH = 5
const WORD_LIST_API = 'https://wordle-api.cyclic.app/words'
const LETTERS_REGEX = /^[a-zA-Z]{1}$/

const toFlatIndex = (row: number, col: number): number => row * WORD_LENGTH + col

const toRowCol = (flat_idx: number): [number, number] => {
  const row = Math.floor(flat_idx / WORD_LENGTH)
  const col = flat_idx % WORD_LENGTH
  return [row, col]
}

const selectRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)]
}

enum TGameState {
  WON,
  LOST,
  IN_PROGRESS
}

enum TAlert {
  WORD_NOT_IN_LIST,
}

interface TAPIWord {
  word: string
  id: number
}


const GameOverPanel = (
  {gameOver, correctWord}: {gameOver: TGameState, correctWord: string}) => {

  if (gameOver === TGameState.WON) {
    return (
      <div className="gameOver">
        <h1 className="gameOverText">You Won!</h1>
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
  const [guessGrid, setGuessGrid] = useState(
    Array<string[]>(WORDS).fill(Array<string>(WORD_LENGTH).fill('')))
  const [lastRowEntered, setLastRowEntered] = useState<number | null>(null)
  const [listOfWords, setListOfWords] = useState<string[]>([])
  const [correctWord, setCorrectWord] = useState("")
  const [gameOver, setGameOver] = useState<TGameState>(TGameState.IN_PROGRESS)
  const [alert, setAlert] = useState<TAlert | null>(null)
  const inputRef = useRef<Array<HTMLInputElement | null>>([])

  const firstAvailableIndex = guessGrid.flat().findIndex((l) => l === '')
  const firstAvailableRow = toRowCol(firstAvailableIndex)[0]

  // Fetch from word list api and pick a random word
  const getWordList = async () => {
    const response = await fetch(WORD_LIST_API)
    const data = await response.json() as TAPIWord[]
    setListOfWords(data.map((w) => w.word))
    setCorrectWord(selectRandomWord(data.map((w) => w.word)))
  }

  // TODO: Could/should use react query here? Also not adding any
  // cleanup function because it's only running on component mount
  useEffect(() => {getWordList()}, [])

  const earlyReturnEditInvalidInput = (inputIdx: number): boolean => {
    // This is to stop user from editing inputs for already guessed words
    const clickedInputRow = toRowCol(inputIdx)[0]
    if (clickedInputRow != firstAvailableRow) return true
    return false
  }

  const earlyReturnHandleBackspace =
      (row: number, col: number, flatIdx: number) => {
    const atStartOfWord = col === 0
    const atEndOfWord = col === WORD_LENGTH - 1

    // End cases, if we're at the at the start or end of a word, clear that
    // value in words array, focus stays there 
    if (atStartOfWord || (atEndOfWord && guessGrid[row][col] !== '')) {
      const newGrid = guessGrid.map((word) =>(word.slice()))
      // clear that value in words array, focus stays here
      newGrid[row][col] = ''
      setGuessGrid(newGrid)
      return
    }
    if (guessGrid[row][col] !== '') {
      // if we have a letter here, clear it, don't move focus
      const newGrid = guessGrid.map((word) =>(word.slice()))
      // clear that value in words array
      newGrid[row][col] = ''
      setGuessGrid(newGrid)
    } else {
      // if we don't have a letter here, move focus back one input, clear that
      // letter
      const [prevRow, prevCol] = toRowCol(flatIdx - 1)
      const newGrid = guessGrid.map((word) =>(word.slice()))
      newGrid[prevRow][prevCol] = ''
      setGuessGrid(newGrid)
      inputRef?.current[flatIdx - 1]?.focus()
    }
  }

  const earlyReturnHandleEnter = (row: number, flatIdx: number) => {
    const completeWordEntered = guessGrid[row].join('').length === WORD_LENGTH
    const enteredWordIsCorrect = guessGrid[row].join('') === correctWord
    const allGuessesUsed = flatIdx === WORDS * WORD_LENGTH - 1
    const wordInWordList = listOfWords.includes(guessGrid[row].join(''))
    // We need to check for game stuff here
    // - Check if the word is complete and add classes to color if it is
    if (completeWordEntered) {
      if (!wordInWordList) {
        setAlert(TAlert.WORD_NOT_IN_LIST)
        return
      }
      guessGrid[row].map((l, i) => {
        const currentInput = inputRef.current[toFlatIndex(row, i)]
        if (l === correctWord[i]) {
          // correct letter in the correct spot
          currentInput?.classList.add('correct')
        } else if (correctWord.includes(l)) {
          // letter is in the word but in the wrong spot
          currentInput?.classList.add('almost')
        }
        currentInput?.toggleAttribute("readonly", true)
      })
      setLastRowEntered(row)
    }
    if (completeWordEntered && enteredWordIsCorrect) {
      setGameOver(TGameState.WON)
      return
    }
    if (allGuessesUsed) {
      setGameOver(TGameState.LOST)
      return 
    }
    // don't move to the next input if the word isn't complete
    if (!completeWordEntered)
      return
    inputRef?.current[flatIdx + 1]?.focus()
  }

  const handleSpecialKeys = (e: React.KeyboardEvent<HTMLInputElement>,
      row: number, col: number) => {
    const flatIdx = toFlatIndex(row, col)
    if (e.key === 'Tab') {
      e.preventDefault()
      return
    }
    if (e.key === 'Enter') {
      earlyReturnHandleEnter(row, flatIdx)
      return
    }
    if (e.key === 'Backspace') {
      earlyReturnHandleBackspace(row, col, flatIdx)
      return
    }
    // TODO(Heath): maybe handle tab and arrow keys here for navigation?
  }

  const handleInputChanged = (e: React.ChangeEvent<HTMLInputElement>,
      row: number, col: number) => {
    e.preventDefault()
    const flatIdx = toFlatIndex(row, col)

    // Clear any alerts
    setAlert(null)
 
    // Is this the next allowed input? (in case they clicked around)
    if (earlyReturnEditInvalidInput(flatIdx)) {
      return
    }

    // Check for unused keys (numbers, etc)
    const letter = e.target.value.toLowerCase()
    if (!letter.match(LETTERS_REGEX)) return
  
    // If we're here, we have a letter...
    // We want to update the the state and move focus to the next input
    const newGrid = guessGrid.map((word) =>(word.slice()))
    newGrid[row][col] = letter.toLowerCase() 
    setGuessGrid(newGrid);

    // Move to the next input, but skip if we're at the end of the word, waiting
    // for the user to hit enter
    const wordCompletedButNotEntered = col === WORD_LENGTH - 1
    if (wordCompletedButNotEntered) return
    inputRef?.current[flatIdx + 1]?.focus()
  }

  const handleInputClicked = (row: number) => {
    const validEditableRow = lastRowEntered !== null ? lastRowEntered + 1 : 0
    // If the user clicks on a row that is not the next editable row, move back
    // to the last editable row, arbitrarily the first letter
    if (row !== validEditableRow) {
      inputRef?.current[toFlatIndex(validEditableRow, 0)]?.focus()
    }
  }

  const handleReset = () => {
    for (const input of inputRef.current) {
      input?.classList.remove('correct')
      input?.classList.remove('almost')
      input?.classList.remove('wrong')
      input?.toggleAttribute("readonly", false)
    }
    setAlert(null)
    setGuessGrid((prev) => prev.map((word) => word.map(() => '')))
    setGameOver(TGameState.IN_PROGRESS)
    setCorrectWord(selectRandomWord(listOfWords))
    setLastRowEntered(null)
  }

  if (!correctWord) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {gameOver !== TGameState.IN_PROGRESS ?
        <GameOverPanel
          gameOver={gameOver}
          correctWord={correctWord}/> : null}
      <div>
      <div className='alert'>
        {alert === TAlert.WORD_NOT_IN_LIST ? <p>Word not in list</p> : null}
      </div>
        <form className="board" onSubmit={(e) => e.preventDefault()}>
          {guessGrid.map((word, i) => (
            <div className="row" key={i}>
              {word.map((l, j) => (
                <input key={`${i}-${j}`}
                  onKeyDown={(e) => handleSpecialKeys(e, i, j)}
                  type="text"
                  value={l}
                  ref={(ref) => inputRef.current[toFlatIndex(i, j)] = ref}
                  maxLength={1}
                  autoFocus={i === 0 && j === 0}
                  onChange={(e) => handleInputChanged(e, i, j)}
                  onClick={() => handleInputClicked(i)}
                  />
                ))}
            </div>))}
        </form>
      </div>
      <div className="resetButton">
        <button onClick={handleReset}>reset</button>
      </div>
    </div>
  )
}

export default App
