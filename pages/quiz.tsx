import {useRouter} from 'next/router'
import {Box, Button, Container, Grid, Input, Tab} from '@material-ui/core'
import React, {useState, useRef, useEffect} from 'react'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'

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
    props: {quizName, questions}
  }
}


enum GameState {
  INITIAL,
  READING_QUESTION,
  GUESSING,
  GUESSED,
  VIEW_RESULTS,
}

const Quiz = ({quizName, questions}) => {
  const [gameState, setGameState] = useState(GameState.INITIAL)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  let inputRef = useRef(null)

  const {prompt, answer} = questions[questionIndex]

  useEffect(() => {
    // autofocus on the first button if no input is present
    const buttons = document.querySelectorAll('button')
    const inputs = document.querySelectorAll('input')
    if (buttons.length > 0 && inputs.length === 0) {
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

    const input = inputRef.current.value || ''
    const correctAnswer = answer.replace(/\((.*?)\)|\[(.*?)\]/g, '')
    const isCorrect = correctAnswer.trim().toLowerCase() === input.trim().toLowerCase()

    setAnswers([...answers, {input, correctAnswer, isCorrect}])
  }

  const nextQuestionFn = () => {
    setGameState(GameState.READING_QUESTION)
    setQuestionIndex(questionIndex + 1)
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
            <Input
              placeholder="Your answer..."
              fullWidth
              onKeyPress={(event) => {
                if (event.key === "Enter") {
                  guessFn()
                }
              }}
              inputRef={inputRef}
              autoFocus
            />
            <AnswerTimer />
          </>
        )
      case GameState.GUESSED:
      default:
        if (questionIndex >= questions.length - 1) {
          return (
            <Button
              variant="contained"
              onClick={() => {
                setGameState(GameState.VIEW_RESULTS)
              }}
            >
              View results
            </Button>
          )
        }

        return (
          <>
            <p>{prompt}</p>
            <Box paddingTop={1}>
              <Button
                variant="contained"
                onClick={nextQuestionFn}
              >
                Next question
              </Button>
            </Box>
          </>
        )
    }
  }

  const IsCorrectText = ({isCorrect}) => {
    if (isCorrect) {
      return <b style={{color: 'green'}}> (Correct)</b>
    } else {
      return <b style={{color: 'red'}}> (Incorrect)</b>
    }
  }

  const AnswerArea = () => {
    if (answers.length === 0) {
      return <></>
    }

    const answerIndex = answers.length - 1
    const correctAnswer = questions[answerIndex].answer
    const yourAnswer = answers[answerIndex]

    return (
      <>
        <h3>Previous question result</h3>
        <p>Correct Answer: {correctAnswer}</p>
        <p>
          Your response: {yourAnswer.input}
          <IsCorrectText isCorrect={yourAnswer.isCorrect} />
        </p>
        {!yourAnswer.isCorrect && (
          <Button
            variant="contained"
            onClick={() => {
              yourAnswer.isCorrect = true
              yourAnswer.isContested = true
              setAnswers([...answers])
            }}
          >
            Contest
          </Button>
        )}
      </>
    )
  }

  const QuizBody = () => {
    switch (gameState) {
      case GameState.INITIAL:
        return (
          <Button
            variant="contained"
            onClick={() => {
              setGameState(GameState.READING_QUESTION)
            }}
          >
            Start
          </Button>
        )
      case GameState.VIEW_RESULTS:
        // const mockAnswers = [
        //   {input: 'Horus', correctAnswer: 'Horus', isCorrect: true, isContested: true},
        //   {input: 'Simpson', correctAnswer: 'Beowulf', isCorrect: false},
        // ]

        const numCorrectAnswers = answers.reduce((numCorrectAnswers, {isCorrect}) => {
          return isCorrect ? numCorrectAnswers + 1 : numCorrectAnswers
        }, 0)
        const totalAnswers = answers.length

        return (
          <>
            <p>
              You got {numCorrectAnswers} out of {totalAnswers} questions correct ({Math.round(100.0 * numCorrectAnswers / totalAnswers)}%)
            </p>
            <TableContainer component={Paper} elevation={3}>
              <Table size="small">
                <TableHead>
                  <TableCell align="left"></TableCell>
                  <TableCell>Correct Answer</TableCell>
                  <TableCell>Your Answer</TableCell>
                  <TableCell>Contested?</TableCell>
                </TableHead>
                <TableBody>
                  {answers.map((answer, index) => {
                    const {input, correctAnswer, isCorrect, isContested} = answer
                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{correctAnswer}</TableCell>
                        <TableCell>
                          {input}
                          <IsCorrectText isCorrect={isCorrect} />
                        </TableCell>
                        <TableCell>{isContested ? <b>Yes</b> : 'No'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )
      default:
        return (
          <Grid
            container
            direction="row"
            spacing={6}
          >
            <Grid item lg={8}>
              <h3>Question {questionIndex + 1} of {questions.length}</h3>

              <GameArea />
            </Grid>
            <Grid item lg={4}>
              <AnswerArea />
            </Grid>
          </Grid>
        )
    }
  }
  return (
    <Container maxWidth="md">
      <h1>{quizName}</h1>

      <QuizBody />
    </Container>
  )
}

export default Quiz
