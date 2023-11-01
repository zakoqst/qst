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
const uri = process.env.DB_URI;
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
// const { render } = require('ejs');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
// const csrfProtection = csrf({ cookie: true });
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const notifier = require('node-notifier');
const options = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem'),
};



// const SESSION_SECRET = 'your-random-session-secret';
// const sessionSecret = crypto.randomBytes(32).toString('hex');
// Connect to MongoDB

// Connect to MongoDB
async function connectToMongo() {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB Atlas');
  } catch (err) {
    console.error(err);
  }
}

  connectToMongo();


const userRegistrationSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  userType: { type: String, required: true, enum: ['ETUDIANT', 'PROFESSEUR'] }
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

const UserQuestions = mongoose.model('UserQuestions', userQuestionsSchema);


// Add pre-save hook to hash passwords
userRegistrationSchema.pre('save', async function(next) {
  const user = this;

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  
  next();
});

const UserQuestionsCollection = mongoose.model('UserQuestions', userQuestionsSchema);

// const sessionSecret = 'secret';

const sessionSecret = crypto.randomBytes(32).toString('hex');
// app.use(cookieParser());

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true
}));

// const csrfProtection = csrf({
//   cookie: true,
//   ignoreMethods: ['GET'] // CSRF protection will be disabled for GET requests
// });

// app.use(csrfProtection);
// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.set('view engine', 'ejs');

// Authentication middleware
function requireAuth(req, res, next) {
  if (req.session.loggedIn) {
  return next();
  }
  res.redirect('/login');
}


function fetchUserQuestions(username) {
  return UserQuestions.find({ username }).exec();
}
// Set CSRF token in response locals
// app.use((req, res, next) => {
//   res.locals.csrfToken = req.csrfToken();
//   next();
// });


// Registration route
app.get('/register', (req, res) => {
  const loginError = req.session.loginError;
  const answer = req.query.answer;

  res.render('register', { loginError, answer });
});

app.post('/register', async (req, res) => {
  try {
    const { username, password, userType } = req.body;
    const existingUser = await UserRegistration.findOne({ username: username });

    if (existingUser) {
      return res.status(409).send('User already exists.');
    }

    const newUser = new UserRegistration({
      username: username,
      password: password,
      userType: userType
    });

    await newUser.save();

    res.redirect('/');
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).send('An error occurred while registering the user.');
  }
});

// Login routes
app.get('/login', async (req, res) => {
  try {
    const loginError = req.session.loginError;
    req.session.loginError = null;
    const answer = req.query.answer;

    res.render('login.ejs', { loginError, answer });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while rendering the login page.');
  }
});

app.post('/login', async (req, res) => {
  const username = req.body.username;

  const password = req.body.password;
  const userType = req.body.userType;
  const answer = req.body.answer;

  UserRegistration.findOne({ username: username, password: password, userType: userType })
    .then(user => {

      if (user) {
        req.session.loggedIn = true;
        req.session.username = username;
        req.session.password = password;
        req.session.userType = userType;
        req.session.answer = answer;

        res.redirect(`/${username}/${userType}`);
      } else {
        req.session.loginError = 'Invalid username, password, or user type.';
        res.redirect('/login');
      }
    })
    .catch(error => {
      res.status(500).send('An error occurred while logging in.');
    });
});

// Logout route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred while logging out.');
    }

    res.redirect('/');
  });
});

app.post('/submit', (req, res) => {
  const username = req.session.username; // get from session
  const userType = req.session.userType;
  const question = req.body.question;

  if (!('username' in req.session) || !('question' in req.body)) {
    return res.status(400).json({
      error: 'Username and question text are required'
    });
  }

console.log(question);
  // Create question document
  UserQuestionsCollection.create({
    text: question,
    username
  })
    .then(question => {
      // sendNotification(username);
      sendNotification('New Message', 'You have a new message.',username);

      io.emit('notification', { message: 'Notification sent' });
    
      res.redirect(`/${username}/${userType}`);

    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: `Error creating question: ${err.message}`
      });
    });
});

// Answer submission route
app.post('/answer', requireAuth, async (req, res) => {
  try {
    const { questionId, username,userType } = req.body;

    const updatedQuestion = await UserQuestionsCollection.findByIdAndUpdate(
      questionId,
      { answer: req.body.answer },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).send('السؤال غير موجود.');
    }

    res.redirect(`/${username}/${userType}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating answer');
  }
});

// User profile route
app.get('/:username/:userType', requireAuth, async (req, res) => {
  try {
    // const csrfToken = req.csrfToken();
    const userType = req.session.userType;
    const loggedIn = req.session.loggedIn;
    const username = req.params.username;
    const questions = await UserQuestionsCollection.find();
    const updatedQuestion = await UserQuestionsCollection.findOneAndUpdate(
      { username: username },
      { answer: req.body.answer },
      { new: true, sort: { timestamp: -1 } }
    );

    let answer = null;
    if (updatedQuestion) {
      answer = updatedQuestion.answer;
    }

    let template;
    let params = {};

    if (userType === 'ETUDIANT') {
      template = 'template';
      params = { userType, questions, answer };
    } else if (userType === 'PROFESSEUR') {
      template = 'teacher-template';
      params = { userType, questions };
    } else {
      throw new Error('Invalid user type');
  }

  // Render the HTML template using the correct template and params
  res.render(template, params);
} catch (error) {
  console.error(error);
  res.status(500).send('حدث خطأ أثناء جلب الأسئلة.');
}

});



// const port = 4000;
app.get('/', (req, res) => {
  res.sendFile('views/home.html', { root: __dirname });
});





function sendNotification(title, message, username) {
  // Configure the notification
  const notificationOptions = {
    title: "hالجواب",
    message: "message",
    sound: true, // Enable notification sound
    wait: true, // Wait for notification to be dismissed by the user
  };

  // Send the notification
  notifier.notify(notificationOptions, function (err, response) {
    if (err) {
      console.error('Failed to send notification:', err);
    } else {
      console.log('Notification sent');
    }
  });
}

// Example usage

// Wait for the notification to be dismissed
notifier.on('click', function (notifierObject, options) {
  console.log('Notification clicked');
});


// // Function to send notification
// function sendNotification(username) {
//   // Customize this function to send the notification to the user
//   // You can use email, SMS, push notifications, or any other method
//   console.log(`Notification sent to ${username}`);
// }

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected');
});

// Start the server
http.listen(process.env.PORT, () => {
  console.log('Server listening on port ');
});