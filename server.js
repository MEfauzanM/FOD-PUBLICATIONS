const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static files from root (HTML files)
app.use(express.static(__dirname));
// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure folders exist
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./data/users.json')) fs.writeFileSync('./data/users.json', '[]');
if (!fs.existsSync('./data/works.json')) fs.writeFileSync('./data/works.json', '[]');

// Set up Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});
const upload = multer({ storage });

// 📌 SIGN-UP: POST /signup
app.post('/signup', upload.single('photo'), (req, res) => {
  const { name, place, email, username, password, bio } = req.body;
  const photo = req.file ? '/uploads/' + req.file.filename : '';

  const users = JSON.parse(fs.readFileSync('./data/users.json'));
  if (users.find(u => u.username === username)) {
    return res.send('Username already exists. <a href="/signup.html">Try again</a>');
  }

  const newUser = { name, place, email, username, password, bio, image: photo };
  users.push(newUser);
  fs.writeFileSync('./data/users.json', JSON.stringify(users, null, 2));

  res.send(`<h2>Welcome ${name}!</h2><p>You are now signed up.</p><a href="/">Home</a>`);
});


// 📌 PUBLISH WORK: POST /publish
app.post('/publish', upload.fields([{ name: 'file' }, { name: 'cover' }]), (req, res) => {
  const { title, language, type, username, password } = req.body;
  const file = req.files['file'] ? '/uploads/' + req.files['file'][0].filename : '';
  const cover = req.files['cover'] ? '/uploads/' + req.files['cover'][0].filename : '';

  const users = JSON.parse(fs.readFileSync('./data/users.json'));
  const author = users.find(u => u.username === username && u.password === password);

  if (!author) {
    return res.send('Author not found or incorrect password. <a href="/signup.html">Sign Up</a>');
  }

  const works = JSON.parse(fs.readFileSync('./data/works.json'));
  const newWork = { title, language, type, author: username, file, cover };
  works.push(newWork);
  fs.writeFileSync('./data/works.json', JSON.stringify(works, null, 2));

  res.send(`<h2>Work published!</h2><a href="/works.html">View Works</a>`);
});

// 📌 API: GET /api/authors
app.get('/api/authors', (req, res) => {
  const users = JSON.parse(fs.readFileSync('./data/users.json'));
  res.json(users);
});

// 📌 API: GET /api/works
app.get('/api/works', (req, res) => {
  let works = JSON.parse(fs.readFileSync('./data/works.json'));
  const { language, type } = req.query;
  if (language) works = works.filter(w => w.language === language);
  if (type) works = works.filter(w => w.type === type);
  res.json(works);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
