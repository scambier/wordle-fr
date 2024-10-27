const fs = require('fs')
const path = require('path')

// Solutions
fs.readFile(path.join(__dirname, '/liste-reduite.txt'), function (err, data) {
  if (err) {
    throw err
  }
  const words = data
    .toString()
    .split(/\r?\n/)
    // Remove proper nouns
    .filter(o => o[0] === o[0].toLowerCase())
    .join(' ')
    .split(' ')

  // keep only 5 letters long, and filter out bad words
  const filtered = words.filter(
    w =>
      w.length === 5 &&
      !['cedex', 'nègre', 'conne', 'sicav', 'vulgo'].includes(w),
  )

  // Add some others
  filtered.push('kayak')

  // Removed identical words, with different accents
  const withoutDupes = []
  for (const word of filtered) {
    if (!withoutDupes.map(normalize).includes(normalize(word))) {
      withoutDupes.push(word)
    }
  }
  const set = [...new Set(withoutDupes)]

  fs.writeFileSync(
    path.join(__dirname, '/../src/words-list.ts'),
    `const words = ${JSON.stringify(
      set.map(o => o.toLowerCase()).filter(o => !o.includes('-')),
    )}; export default words`,
  )
})

// Guesses
fs.readFile(path.join(__dirname, '/ods6.txt'), function (err, data) {
  if (err) {
    throw err
  }
  const words = data.toString().split(/\r?\n/).join(' ').split(' ')

  const filtered = words.filter(o => o.length === 5)
  const set = [...new Set(filtered)]

  fs.writeFileSync(
    path.join(__dirname, '/../src/guesses-list.ts'),
    `const guesses = ${JSON.stringify(
      set.map(normalize),
    )}; export default guesses`,
  )
})

function normalize(word) {
  return word.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}
