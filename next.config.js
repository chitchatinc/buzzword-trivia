const basePath = process.env.NODE_ENV === 'production' ? '/buzzword-trivia' : ''

module.exports = {
  basePath,
  assetPrefix: `${basePath}/`
}
