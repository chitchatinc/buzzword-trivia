import {useRouter} from 'next/router'
import {Button, Container, Grid, Input} from '@material-ui/core'
import React, {useState, useRef, useEffect} from 'react';

const fs = require('fs')
const readline = require('readline')

export const QUESTIONS_DIR = '/Users/penny/trivia/questions'

export const getServerSideProps = async (context) => {
  const {query: {name}} = context
  const quizName = decodeURIComponent(name)

  const fileStream = fs.createReadStream(`${QUESTIONS_DIR}/${quizName}`)
  const rl = readline.createInterface({
    input: fileStream,
    crlDelay: Infinity,
  })

  const questions = []

  let question = {prompt: ''}
  for await (const line of rl) {
    if (line.startsWith('ANSWER')) {
      question['answer'] = line
        .replace('ANSWER: ', '')
      question.prompt = question.prompt.trim()
      questions.push(question)

      question = {prompt: ''}
    } else {
      // replace everything in brackets or parantheses
      question['prompt'] += ` ${line.replace(/\((.*?)\)|\[(.*?)\]/g, '')}`
    }
  }

  const data = fs.readFileSync(`${QUESTIONS_DIR}/${quizName}`, 'utf8')
  return {
    props: {questions}
  }
}


enum GameState {
  INITIAL,
  READING_QUESTION,
  GUESSING,
  GUESSED
}

const Quiz = ({questions}) => {
  const [gameState, setGameState] = useState(GameState.INITIAL)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  let inputRef = useRef(null)

  const {prompt, answer} = questions[questionIndex]

  useEffect(() => {
    // autofocus on the first button
    const buttons = document.querySelectorAll('button')
    if (buttons && buttons.length > 0) {
      buttons[0].focus()
    }
  })

  const answerFn = (answer) => {
    setAnswers([...answers, answer])
    setGameState(GameState.GUESSED)
  }

  const AnswerInput = () => {
    const onKeyPressFn = (event) => {
      if (event.key === "Enter") {
        answerFn(inputRef.current.value)
      }
    }

    return (
      <Input
        placeholder="Your answer..."
        fullWidth
        onKeyPress={onKeyPressFn} 
        inputRef={inputRef}
        autoFocus
      />
    )
  }

  const GameArea = () => {
    switch (gameState) {
      case GameState.READING_QUESTION:
        return (
          <Button
            variant="contained"
            onClick={() => {
              setGameState(GameState.GUESSING)
            }}
          >
            Buzz
          </Button>
        )
      case GameState.GUESSING:
        return (
          <AnswerInput inputRef={inputRef} gameState={gameState} answerFn={answerFn} />
        )
      case GameState.GUESSED:
      default:
        if (questionIndex >= questions.length - 1) {
          return <i>No more questions</i>
        }

        return (
          <Button
            variant="contained"
            onClick={() => {
              setGameState(GameState.READING_QUESTION)
              setQuestionIndex(questionIndex + 1)
            }}
          >
            Next question
          </Button>
        )
    }
  }

  const AnswerArea = () => {
    if (answers.length === 0) {
      return <></>
    }

    const answerIndex = answers.length - 1
    const correctAnswer = questions[answerIndex].answer
    const yourAnswer = answers[answerIndex]
    const isCorrect = correctAnswer
      .replace(/\((.*?)\)|\[(.*?)\]/g, '')
      .trim()
      .toLowerCase() === yourAnswer.trim().toLowerCase()

    return (
      <>
        <p>Correct Answer: {correctAnswer}</p>
        <p>
          Your response: {yourAnswer} 
          {isCorrect ? <b style={{color: 'green'}}> (Correct)</b> : <b style={{color: 'red'}}> (Incorrect)</b>}
        </p>
      </>
    )
  }

  if (gameState === GameState.INITIAL) {
    return (
      <Container maxWidth="md">
        <Button
          variant="contained"
          onClick={() => {
            setGameState(GameState.READING_QUESTION)
          }}
        >
          Start
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="md">
      <Grid
        container
        direction="row"
        spacing={4}
      >
        <Grid item lg={8}>
          <p>Question {questionIndex + 1} of {questions.length}</p>
          <p>{prompt}</p>

          <GameArea />
        </Grid>
        <Grid item lg={4}>
          <AnswerArea />
        </Grid>
      </Grid>
    </Container>
  )
}

export default Quiz
