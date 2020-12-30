import Head from 'next/head'
import {Container, Grid} from '@material-ui/core'
import naturalSort from 'javascript-natural-sort'
import {QUESTIONS_DIR} from './quiz'

const fs = require('fs')

export const getStaticProps = async () => {
  const filenames = fs.readdirSync(QUESTIONS_DIR).sort(naturalSort)
  return {
    props: {filenames}
  }
}

const Home = ({filenames}) => {
  return (
    <div className="container">
      <Head>
        <title>Chit Chat Trivia Time</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxWidth="md">
        <Grid container direction="column" justify="center" alignItems="center">
          <h1 className="title">
            It's Chit Chat Trivia Time!
          </h1>

          <p className="description">
            Pick a game...
          </p>

          {filenames.map((filename, i) => {
            const name = encodeURIComponent(filename)
            return (<a href={`/quiz?name=${name}`} className="row" key={i}>{filename}</a>)
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
    </div>
  )
}

export default Home
