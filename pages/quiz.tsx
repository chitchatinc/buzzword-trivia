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

    const synth = window.speechSynthesis
    if (gameState === GameState.READING_QUESTION) {
      const utterance = new SpeechSynthesisUtterance(prompt)
      utterance.rate = 0.9
      utterance.onend = () => {
        setGameState(GameState.GUESSING)
      }
      synth.speak(utterance)
    }
  })

  const buzzFn = () => {
    setGameState(GameState.GUESSING)
    const synth = window.speechSynthesis
    synth.cancel()
  }

  const guessFn = () => {
    setGameState(GameState.GUESSED)
    setAnswers([...answers, inputRef.current.value])
  }

  const nextQuestionFn = () => {
    setGameState(GameState.READING_QUESTION)
    setQuestionIndex(questionIndex + 1)
  }

  const AnswerInput = () => {
    const onKeyPressFn = (event) => {
      if (event.key === "Enter") {
        guessFn()
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

  const AnswerTimer = () => {
    const [timer, setTimer] = useState(15)
    useEffect(() => {
      if (timer <= 0) {
        guessFn()
      }

      const intervalId = setInterval(() => {
        setTimer(timer - 1)
      }, 1000)

      return () => clearInterval(intervalId)
    }, [timer])

    return (<div style={{marginTop: '12px'}}>0: {timer}</div>)
  }

  const GameArea = () => {
    switch (gameState) {
      case GameState.READING_QUESTION:
        return (
          <Button
            variant="contained"
            onClick={buzzFn}
          >
            Buzz
          </Button>
        )
      case GameState.GUESSING:
        return (
          <>
            <AnswerInput />
            <AnswerTimer />
          </>
        )
      case GameState.GUESSED:
      default:
        if (questionIndex >= questions.length - 1) {
          return <i>No more questions</i>
        }

        return (
          <Button
            variant="contained"
            onClick={nextQuestionFn}
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
    const yourAnswer = answers[answerIndex] || ''
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
          {/* <p>{prompt}</p> */}

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
