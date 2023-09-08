import { useRef, useState } from 'react'
import './App.css'

const WORDS = 5
const WORD_LENGTH = 5

const toFlatIndex = (row: number, col: number): number => row * WORD_LENGTH + col

// TODO get this from a random list
const correctWord: string = "hello"

function App() {
  const [words, setWords] = useState(
    Array<string[]>(WORDS).fill(Array<string>(WORD_LENGTH).fill(''))) 
  const [nextAllowedIdx, setNextAllowedIdx] = useState(0);
  const [gameOver, setGameOver] = useState(false)
  const inputRef = useRef<Array<HTMLInputElement | null>>([])

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    const flat_idx = toFlatIndex(row, col)
    // Is this th next allowed input? (in case they clicked around)
    if (flat_idx !== nextAllowedIdx) {
      e.preventDefault()
      const allowedInput = inputRef.current[nextAllowedIdx]
      if (allowedInput) {
        allowedInput.focus()
      }
      return
    }
    // It is update the state
    const { value } = e.target
    const newWords = words.map((word) =>(word.slice()))
    newWords[row][col] = value.toLowerCase()
    setWords(newWords);
    setNextAllowedIdx(flat_idx + 1)

    // We need to check for game stuff here
    // - Check if the word is complete
    const completeWord: boolean = col === WORD_LENGTH - 1
    const isCorrect: boolean = newWords[row].join('') === correctWord
    if (completeWord) {
      newWords[row].map((l, i) => {
        const currentInput = inputRef.current[toFlatIndex(row, i)]
        if (l === correctWord[i]) {
          currentInput?.classList.add('correct')
        } else if ( correctWord.includes(l)) {
          currentInput?.classList.add('almost')
        }
      })
    }
    if (completeWord && isCorrect) {
      setGameOver(true)
      return
    }
    // Move to the next input
    const next = inputRef.current[flat_idx + 1]
    if (next) {
      next.focus()
      next.contentEditable = 'true'
    }
  }

  const handleReset = () => {
    setWords(Array<string[]>(WORDS).fill(Array<string>(WORD_LENGTH).fill('')))
    setNextAllowedIdx(0)
    setGameOver(false)
    for (const input of inputRef.current) {
      input?.classList.remove('correct')
      input?.classList.remove('almost')
      input?.classList.remove('wrong')
    }
  }

  return (
    <div>
      {gameOver &&
        <div className="alert"><h1 className="game-over">You won!</h1>
        <button onClick={handleReset}>reset</button></div>
        }
      <div className="board">
        {words.map((word, i) => (
          <div className="row" key={i}>
            {word.map((l, j) => (
              <input key={`${i}-${j}`}
                onChange={(e) => handleInput(e, i, j)}
                type="text"
                value={l}
                ref={(ref) => inputRef.current[toFlatIndex(i, j)] = ref}
                maxLength={1}
                autoFocus={i === 0 && j === 0}
                />))}
          </div>))}
      </div>
    </div>
  )
}

export default App
