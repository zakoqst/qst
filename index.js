const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();
const path = require('path');
const app = express();
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const ngrok = require('ngrok');
const uri = "mongodb+srv://zhoudache:alcahyd2023@cluster0.ughawgz.mongodb.net/qst";
// Set up MongoDB connection
// const uri = '€';
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');

const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem'),
};

// Create the HTTPS server
const server = https.createServer(options, (req, res) => {
  // Your server logic here
  res.sendFile('/home.html');
});


// const SESSION_SECRET = 'your-random-session-secret';
const sessionSecret = crypto.randomBytes(32).toString('hex');
// Connect to MongoDB
async function connectToMongo() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(err);
  }
}

// Start the server and connect to MongoDB
server.listen(5000, () => {
  console.log('Server is running on port 5000');
  connectToMongo();
});

app.get('/', (req,res)=> {
  res.sendFile('/home.html');

})

const userRegistrationSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  userType: { type: String, required: true, enum: ['طالب', 'مدرس'] }
});

const UserRegistration = mongoose.model('UserRegistration', userRegistrationSchema);

const userQuestionsSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  answer: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Add pre-save hook to hash passwords
userRegistrationSchema.pre('save', async function(next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  
  next();
});

const UserQuestionsCollection = mongoose.model('UserQuestions', userQuestionsSchema);
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: sessionSecret,
  resave: true,
  saveUninitialized: true
}));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));


function fetchUserQuestions(userId) {
    return UserQuestion.find({ userId }).exec();
  }

// POST route to handle answering a question
app.post('/answer', async (req, res) => {
  try {
    const { questionId, answer, username } = req.body;

    // Update the question with the provided answer
    const updatedQuestion = await UserQuestionsCollection.findByIdAndUpdate(
      questionId,
      { answer },
      { new: true }
    );

    if (!updatedQuestion) {
      // Question not found
      return res.status(404).send('السؤال غير موجود.');
    }

    // Render the template.ejs template with the updated answer
    res.render('template', { answer: updatedQuestion.answer, username });

  } catch (error) {
    console.error(error);
    res.status(500).send('حدث خطأ أثناء إرسال الإجابة.');
  }
});
app.get('/:username', async (req, res) => {
  try {
    // Retrieve the user type and login status from the session
    const userType = req.session.userType; // Adjust this based on your authentication mechanism
    const loggedIn = req.session.loggedIn; // Adjust this based on your authentication mechanism
    const answer = req.session.answer; // Retrieve the answer from the session

    // Retrieve the questions from the database
    const questions = await UserQuestionsCollection.find();

    if (loggedIn) {
      if (userType === 'طالب') {
        // Additional logic for students
        res.render('template', { userType, questions, answer, username: req.params.username });
      } else if (userType === 'مدرس') {
        // Template for teachers
        res.render('teacher-template', { userType, questions, username: req.params.username });
      } else {
        // Invalid user type, handle accordingly
        res.status(400).send('Invalid user type');
      }
    } else {
      // User not logged in, handle accordingly
      res.redirect('/login'); // Redirect to login page or display an error message
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while retrieving the user-specific page.');
  }
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Verify user credentials against stored user information
    const user = await UserRegistration.findOne({ username });

    if (user && bcrypt.compareSync(password, user.password)) {
      // User authenticated
      req.session.loggedIn = true;
      req.session.username = username;

      // Retrieve the user type from the stored user information
      const userType = user.userType;
      req.session.userType = userType;

      // Clear any previous login error
      delete req.session.loginError;

      // Redirect to the user-specific page
      return res.redirect(`/${username}`);
    }

    // Invalid credentials
    req.session.loginError = 'Invalid username or password.';

    // Redirect back to the login page
    return res.redirect('/login');
  } catch (error) {
    console.error(error);
    return res.status(500).send('An error occurred while logging in.');
  }
});

app.get('/login', async (req, res) => {
  try {
    const loginError = req.session.loginError; // Retrieve the login error message from the session
    req.session.loginError = null; // Clear the login error message from the session

    const answer = req.query.answer; // Retrieve the answer from the query parameters

    // Render the login page with the login error and answer
    res.render('login', { loginError, answer });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while rendering the login page.');
  }
});
app.get('/register', (req, res) => {
  const loginError = req.session.loginError; // Retrieve the login error message from the session
  const answer = req.query.answer; // Retrieve the answer from the query parameters

  res.render('D:/qst/register', { loginError, answer });
});


// Registration route
app.post('/register', async (req, res) => {
  const { username, password, userType } = req.body;

  try {
    // Validate the input data
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
      userType: Joi.string().valid('طالب', 'مدرس').required()
    });

    const { error } = schema.validate({ username, password, userType });
    if (error) {
      return res.status(400).send(error.details[0].message);
    }

    // Check if the user already exists
    const existingUser = await UserRegistration.findOne({ username });
    if (existingUser) {
      return res.status(409).send('User already exists.');
    }

    // Create a new user
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new UserRegistration({
      username,
      password: hashedPassword,
      userType
    });

    await newUser.save();

    // Redirect to the login page
    res.redirect('/login');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send('An error occurred while registering the user.');
  }
});
  
// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error('Logout error:', error);
      return res.status(500).send('An error occurred while logging out.');
    }
    res.redirect('/login');
  });
});


// Submit route
app.post('/submit', (req, res) => {
    const loggedIn = req.session.loggedIn;
    const username = req.session.username;
    
    if (loggedIn) {
      const question = req.body.question;
  
      UserQuestionsCollection.create({
        text: question,
        username: username
      })
        .then(() => {
          res.redirect(`/${username}`);
        })
        .catch(error => {
          res.status(500).send('An error occurred while submitting the question.');
        });
    } else {
      res.redirect('/');
    }
  });

// Start the server
// const port = 3000;

// const port = 5000;
// const port = process.env.PORT || 5000;

// server.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

// app.listen( process.env.PORT, () => {
//   console.log(`Server is running on https://localhost:${process.env.PORT}`);
//   // console.log('Access the application at ' + process.env.NGROK);

// });


// const express = require('express');
// const app = express();
// const port = 4000;

// app.get('/', (req, res) => {
//   res.send('Hello, World!');
// });

// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });