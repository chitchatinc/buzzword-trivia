import {useRouter} from 'next/router'

const fs = require('fs')
const readline = require('readline');

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
      question['answer'] = line.replace('ANSWER: ', '')
      questions.push(question)

      question = {prompt: ''}
    } else {
      question['prompt'] += line
    }
  }

  const data = fs.readFileSync(`${QUESTIONS_DIR}/${quizName}`, 'utf8')
  return {
    props: {questions}
  }
}

const Quiz = ({questions}) => {
  console.log(questions)
  return (<div>YOYO</div>)
}

export default Quiz
