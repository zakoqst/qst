const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
require('dotenv').config();
const path = require('path');
const app = express();


const uri = process.env.DB_URI;
// Set up MongoDB connection
// const uri = '€';

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
  userType: { type: String, required: true }
});

const UserRegistration = mongoose.model('UserRegistration', userRegistrationSchema);



// User questions model
const UserQuestionsCollection = mongoose.model('UserQuestionsCollection', new Schema({
    text: { type: String, required: true },
    username: { type: String, required: true }
  }));


// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.set('view engine', 'ejs');

// Define routes
app.get('/', (req, res) => {
  const loggedIn = req.session.loggedIn;
  const username = req.session.username;
  const userType = req.session.userType;

  if (loggedIn) {
    let html = `
      <html>
      <head>
          <title>إطرح سؤالك</title>
          <style>
              body {
                  font-family: Arial, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  flex-direction: column;
                  height: 100vh;
                  margin: 0;
              }
              form, ul {
                  border: 1px solid #ddd;
                  padding: 20px;
                  border-radius: 5px;
                  width: 300px;
                  margin-top: 20px;
              }
              h2 {
                  text-align: center;
              }
              label {
                  display: block;
                  margin: 10px 0 5px;
              }
              input[type="text"] {
                  width: 100%;
                  padding: 8px;
                  margin-bottom: 15px;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  box-sizing: border-box;
              }
              input[type="submit"] {
                  width: 100%;
                  background-color: #4CAF50;
                  color: white;
                  padding: 10px 15px;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
              }
              input[type="submit"]:hover {
                  background-color: #45a049;
              }
              ul {
                  list-style-type: none;
                  padding: 0;
              }
          </style>
      </head>
      <body>
    `;

    if (userType === 'أستاذ') {
      UserQuestionsCollection.find({})
        .then(questions => {
          html += `
            <img src="images/speaker.jpg" alt="Image" style="width: 150px; height: 150px;">
            <h2>جميع الأسئلة</h2>
            <ul>
          `;

          questions.forEach(question => {
            html += `<li>${question.text}</li>`;
          });

          html += `
            </ul>

            <form action="/logout" method="post">
              <input type="submit" value="Logout">
            </form>
          `;

          res.send(html);
        })
        .catch(error => {
          res.status(500).send('An error occurred while retrieving questions.');
        });
    } else if (userType === 'طالب') {
      html += `
        
<head>
<title>الدخول</title>
<style>
    /* Your CSS styles here */
    /* ... */
   .center {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }
    .rate-section {
        margin-top: 20px;
    }
    .rating {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        font-size: 30px;
    }
    .rating input {
        display: none;
    }
    .rating label {
        color: #ddd;
        margin: 0 5px;
        cursor: pointer;
    }
    .rating input:checked ~ label {
        color: #ffca08; /* Color for the selected star */
    }
</style>
</head>

      <img src="images/student.webp" alt=" Image" style="width: 150px; height: 150px;">
        <h2>إطرح سؤالك</h2>
        <form action="/submit" method="post">
          <label for="question">Enter your question:</label><br>
          <input type="text" id="question" name="question"><br><br>
          <input type="submit" value="Submit">
          <div class="rate-section">
          <h3>Rate Me</h3>
          <p>Please provide your feedback by rating our service:</p>
          <div class="rating">
     <input type="radio" id="star5" name="rating" value="5" />
              <label for="star5">&#9733;</label>
              <input type="radio" id="star4" name="rating" value="4" />
              <label for="star4">&#9733;</label>
              <input type="radio" id="star3" name="rating" value="3" />
              <label for="star3">&#9733;</label>
              <input type="radio" id="star2" name="rating" value="2" />
              <label for="star2">&#9733;</label>
              <input type="radio" id="star1" name="rating" value="1" />
              <label for="star1">&#9733;</label>
          </div>
      </div>
        </form>
        <form action="/logout" method="post">
          <input type="submit" value="Logout">
        </form>

        <script>
        const ratingInputs = document.querySelectorAll('.rating input');
        const labels = document.querySelectorAll('.rating label');

        ratingInputs.forEach((input, index) => {
            input.addEventListener('change', () => {
                resetColors();
                colorStars(index);
            });
        });

        function resetColors() {
            labels.forEach(label => {
                label.style.color = '#ddd';
            });
        }

        function colorStars(index) {
            for (let i = 0; i <= index; i++) {
                labels[i].style.color = '#ffca08';
            }
        }
    </script>
        </body>
        </html>
      `;
      res.send(html);
    }
  } else {
    const loginError = req.session.loginError; // Retrieve the login error message from the session
    req.session.loginError = null; // Clear the login error message from the session

    res.render('login.ejs', { loginError:loginError }); // Render the login template with the loginError variable
  
  }
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.post('/register', async (req, res) => {
    const { username, password, userType } = req.body;
  
    try {
      // Check if the user already exists
      const existingUser = await UserRegistration.findOne({ username: username });
  
      if (existingUser) {
        return res.status(409).send('User already exists.');
      }
  
      // Create a new user
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

  // Login route
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const userType = req.body.userType;
  
    UserRegistration.findOne({ username: username, password: password, userType: userType })
      .then(user => {
        if (user) {
          req.session.loggedIn = true;
          req.session.username = username;
          req.session.userType = userType;
          res.redirect('/');
        } else {
          req.session.loginError = 'Invalid username, password, or user type.';
          res.redirect('/');
        }
      })
      .catch(error => {
        res.status(500).send('An error occurred while logging in.');
      });
  });

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('An error occurred while logging out.');
    }

    res.redirect('/');
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
          res.redirect('/');
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
app.listen( process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});