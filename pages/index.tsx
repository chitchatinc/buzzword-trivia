import Head from 'next/head'
import { Container, Grid } from '@material-ui/core'
import naturalSort from 'javascript-natural-sort'
import { QUESTIONS_DIR } from './quiz/[quizName]'

const fs = require('fs')

export const getStaticProps = async () => {
  const filenames = fs.readdirSync(QUESTIONS_DIR).sort(naturalSort)
  return {
    props: { filenames },
  }
}

const Home = ({ filenames }) => {
  return (
    <>
      <Head>
        <title>Chit Chat Trivia Time</title>
      </Head>

      <Container maxWidth="md">
        <Grid container direction="column" justify="center" alignItems="center">
          <h1 className="title">It's Chit Chat Trivia Time!</h1>

          <p className="description">Pick a game...</p>

          {filenames.map((filename, i) => {
            const name = encodeURIComponent(filename)
            let href =
              process.env.NODE_ENV === 'production'
                ? `/buzzword-trivia/quiz/${name}.html`
                : `/quiz/${name}`
            return (
              <a href={href} key={i}>
                {filename}
              </a>
            )
          })}
        </Grid>
      </Container>

      <style jsx>{`
        a {
          color: inherit;
          text-decoration: none;
          margin-bottom: 0.5rem;
        }

        a:hover,
        a:focus,
        a:active {
          text-decoration: underline;
        }

        .title {
          margin-top: 80px;
          line-height: 1.15;
          font-size: 3rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }
      `}</style>
    </>
  )
}

export default Home
