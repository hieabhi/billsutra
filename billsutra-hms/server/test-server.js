import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5052;

app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Test server working!' });
});

app.post('/test-login', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { username, password } = req.body;
    res.json({ message: 'Login test', username, received: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
