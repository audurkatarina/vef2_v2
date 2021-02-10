import express from 'express';
import dotenv from 'dotenv';
import pkg from 'express-validator';
import { query } from './db.js';

const { body, validationResult } = pkg

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

const app = express();

app.use(express.urlencoded({ extended: true }));

const nationalIdPattern = '^[0-9]{6}-?[0-9]{4}$';

function template(name = '', nationalId = '', comment= '') {
  return `
  <h1>Undirskriftarlisti</h1>
  <form method="post" action="/post">
    <label>
      Nafn*
      <input required type="text" name="name" value="${name}">
    </label>
    <label>
      Kennitala*
      <input
        required
        type="text"
        pattern="${nationalIdPattern}"
        name="nationalId"
        value="${nationalId}"
        placeholder="000000-0000"
      >
    </label>
    <label>
      Athugasemd:
      <textarea id="comment" name="comment" value="${comment}"></textarea>
    </label>
    <div>
      <input type="checkbox" id="anon" name="anon">
      <label for="anon">Ekki birta nafn á lista</label>
    </div>
    <button>Skrifa undir</button>
  </form>
  `;
}

app.get('/', (req, res) => {
  res.send(template());
});

app.post(
  '/post',

  // Þetta er bara validation, ekki sanitization
  body('name')
    .isLength({ min: 1 })
    .withMessage('Nafn má ekki vera tómt'),
  body('nationalId')
    .isLength({ min: 1 })
    .withMessage('Kennitala má ekki vera tóm'),
  body('nationalId')
    .matches(new RegExp(nationalIdPattern))
    .withMessage('Kennitala verður að vera á formi 000000-0000 eða 0000000000'),


  (req, res, next) => {
    const {
      name = '',
      nationalId = '',
      comment = '',
    } = req.body;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(i => i.msg);
      return res.send(
        `${template(name, nationalId, comment)}
        <p>Villur við undirskrift:</p>
        <ul>
          <li>${errorMessages.join('</li><li>')}</li>
        </ul>
      `);
    }

    return next();
  },
  /* Nú sanitizeum við gögnin, þessar aðgerðir munu breyta gildum í body.req */
  // Fjarlægja whitespace frá byrjun og enda
  // „Escape“ á gögn, breytir stöfum sem hafa merkingu í t.d. HTML í entity
  // t.d. < í &lt;
  body('name').trim().escape(),

  // Fjarlægjum - úr kennitölu, þó svo við leyfum í innslátt þá viljum við geyma
  // á normalizeruðu formi (þ.e.a.s. allar geymdar sem 10 tölustafir)
  // Hér gætum við viljað breyta kennitölu í heiltölu (int) en... það myndi
  // skemma gögnin okkar, því kennitölur geta byrjað á 0
  body('nationalId').blacklist('-'),

  async (req, res) => {

    const {
      name,
      nationalId,
      comment,
    } = req.body;

    const result = await query('INSERT INTO signatures (name, nationalId, comment) VALUES ($1, $2, $3)', [name, nationalId, comment]);

    res.redirect('/');
  },
);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
