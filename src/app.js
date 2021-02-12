import express from 'express';
import dotenv from 'dotenv';

// eslint-disable-next-line import/extensions
import { router } from './registration.js';

dotenv.config();

const {
  PORT: port = 3000,
} = process.env;

const app = express();

//const viewsPath = new URL('../views', import.meta.url).pathname;

//app.set('views', viewsPath);
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

//app.use(express.static(new URL('./public', import.meta.url).pathname));
app.use('/public', express.static('public'));

/**
 * Hjálparfall til að athuga hvort reitur sé gildur eða ekki.
 *
 * @param {string} field Middleware sem grípa á villur fyrir
 * @param {array} errors Fylki af villum frá express-validator pakkanum
 * @returns {boolean} `true` ef `field` er í `errors`, `false` annars
 */
function isInvalid(field, errors) {
  return Boolean(errors.find(i => i.param === field));
}

app.locals.isInvalid = isInvalid;

app.use('/', router);

function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).render('error', { title: '404', error: '404 fannst ekki' });
}

function errorHandler(error, req, res, next) { // eslint-disable-line
  console.error(error);
  res.status(500).render('error', { title: 'Villa', error });
}

app.use(notFoundHandler);
app.use(errorHandler);

// Verðum að setja bara *port* svo virki á heroku
app.listen(port, () => {
  console.info(`Server running at http://localhost:${port}/`);
});
