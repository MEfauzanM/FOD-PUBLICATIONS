const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure required folders/files exist
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');
if (!fs.existsSync('./data')) fs.mkdirSync('./data');
if (!fs.existsSync('./data/users.json')) fs.writeFileSync('./data/users.json', '[]');
if (!fs.existsSync('./data/works.json')) fs.writeFileSync('./data/works.json', '[]');
if (!fs.existsSync('./data/content.json')) fs.writeFileSync('./data/content.json', '[]');

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ SIGN-UP
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

// ✅ FIXED PUBLISH ROUTE WITH ALWAYS-SAVE CONTENT
app.post('/publish', upload.fields([{ name: 'file' }, { name: 'cover' }]), async (req, res) => {
  const { title, language, type, username, password } = req.body;
  const file = req.files['file'] ? '/uploads/' + req.files['file'][0].filename : '';
  const cover = req.files['cover'] ? '/uploads/' + req.files['cover'][0].filename : '';

  // ✅ Verify author
  const users = JSON.parse(fs.readFileSync('./data/users.json'));
  const author = users.find(u => u.username === username && u.password === password);
  if (!author) {
    return res.send('❌ Author not found or password incorrect. <a href="/signup.html">Sign Up</a>');
  }

  const works = JSON.parse(fs.readFileSync('./data/works.json'));
  const contents = JSON.parse(fs.readFileSync('./data/content.json'));

  const workId = Date.now().toString();
  let extractedText = '';

  // ✅ Try extracting PDF text
  if (file.toLowerCase().endsWith('.pdf')) {
    try {
      const pdfBuffer = fs.readFileSync(`.${file}`);
      const parsed = await pdfParse(pdfBuffer);
      extractedText = parsed.text.trim() || '⚠️ No text found in this PDF.';
    } catch (err) {
      console.error('❌ PDF extraction failed:', err);
      extractedText = '⚠️ PDF extraction failed.';
    }
  } else {
    extractedText = 'ℹ️ This is not a PDF file, so no text extraction was done.';
  }

  // ✅ Save work metadata
  works.push({ id: workId, title, language, type, author: username, file, cover });
  fs.writeFileSync('./data/works.json', JSON.stringify(works, null, 2));

  // ✅ Save extracted text (even if empty or failed)
  contents.push({ workId, text: extractedText });
  fs.writeFileSync('./data/content.json', JSON.stringify(contents, null, 2));

  res.send(`<h2>✅ Work published successfully!</h2><a href="/works.html">View Works</a>`);
});


// ✅ API to get all works
app.get('/api/works', (req, res) => {
  const works = JSON.parse(fs.readFileSync('./data/works.json'));
  res.json(works);
});

// ✅ API to get all authors
app.get('/api/authors', (req, res) => {
  const users = JSON.parse(fs.readFileSync('./data/users.json'));
  res.json(users);
});

// 📌 API: GET /api/work-content?id=WORK_ID
app.get('/api/work-content', (req, res) => {
  const contents = JSON.parse(fs.readFileSync('./data/content.json'));
  const work = contents.find(c => c.workId === req.query.id);
  if (work) {
    res.json({ text: work.text });
  } else {
    res.status(404).json({ error: 'Content not found' });
  }
});

app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));
