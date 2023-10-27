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





  const userQuestionsSchema = new mongoose.Schema({
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


  const UserQuestionsCollection = mongoose.model('UserQuestions', userQuestionsSchema);


// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.set('view engine', 'ejs');



function fetchUserQuestions(userId) {
    return UserQuestion.find({ userId }).exec();
  }

  // app.post('/answer', async (req, res) => {
  //   try {
  //     const { questionId, answer } = req.body;
  
  //     // Update the question with the provided answer
  //     const updatedQuestion = await UserQuestionsCollection.findByIdAndUpdate(
  //       questionId,
  //       { answer },
  //       { new: true }
  //     );
  
  //     if (!updatedQuestion) {
  //       // Question not found
  //       return res.status(404).send('السؤال غير موجود.');
  //     }
  
  //     // Generate the updated HTML content
  //     const html = generateUpdatedHtml(updatedQuestion);
  
  //     // Send the updated HTML as the response
  //     res.send(html);
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).send('حدث خطأ أثناء إرسال الإجابة.');
  //   }
  // });

  // app.get('/', async (req, res) => {
  //   const loggedIn = req.session.loggedIn;
  //   const userType = req.session.userType;
  
  //   if (loggedIn && userType === 'أستاذ') {
  //     try {
  //       UserQuestionsCollection.find()
  //         .exec()
  //         .then(async (questions) => {
  //           // const questions = await UserQuestionsCollection.find().exec();

  //           // Sort questions in descending order based on timestamp
  //           questions.sort((a, b) => b.timestamp - a.timestamp);
  
  //           let cardsHtml = '';
  
  //           questions.forEach((question) => {
  //             cardsHtml += `
  //               <div class="col-md-4 mb-4">
  //                 <div class="card">
  //                   <div class="card-body">
  //                     <h5 class="card-title">${question.text}</h5>
  //                     <form action="/answer" method="post">
  //                       <div class="mb-3">
  //                         <textarea class="form-control" name="answer" rows="3" placeholder="Enter your answer"></textarea>
  //                       </div>
  //                       <input type="hidden" name="questionId" value="${question._id}">
  //                       <button type="submit" class="btn btn-primary">إجابة</button>
  //                     </form>
  //                   </div>
  //                 </div>
  //               </div>
  //             `;
  //           });
  
  //           let html = `
  //             <html>
  //             <head>
  //               <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.3.0/css/bootstrap.min.css">
  //               <title>إطرح سؤالك</title>
  //               <style>
  //                 .card {
  //                   margin-bottom: 20px;
  //                 }
                  
  //                 .card-title {
  //                   font-size: 1.2rem;
  //                   font-weight: bold;
  //                 }
                  
  //                 .btn {
  //                   margin-top: 10px;
  //                 }
  //               </style>
  //             </head>
  //             <body>
  //               <img src="images/speaker.jpg" alt="Image" style="width: 150px; height: 150px;">
  //               <h2>جميع الأسئلة</h2>
  //               <div class="container">
  //                 <div class="row">
  //                   ${cardsHtml}
  //                 </div>
  //               </div>
  //               <form action="/logout" method="post">
  //                 <input type="submit" value="Logout" class="btn btn-danger"> 
  //               </form>
  //               <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
  //             </body>
  //             </html>
  //           `;
  
  //         res.send(html);
  //       })
  //       .catch(err => {
  //         res.status(500).send('حدث خطأ أثناء استرداد الأسئلة.');
  //       });
  //   } catch (error) {
  //     res.status(500).send('حدث خطأ أثناء استرداد الأسئلة.');
  //   }
  //   } else if (userType === 'طالب') {
  //       let html = `
  //       <html>
  //       <head>
  //         <title>الدخول</title>
  //         <style>
  //         body {
  //           font-family: Arial, sans-serif;
  //           background-color: #f8f8f8;
  //           margin: 0;
  //           padding: 0;
  //         }
          
  //         .container {
  //           max-width: 600px;
  //           margin: 0 auto;
  //           padding: 20px;
  //           background-color: #fff;
  //           border-radius: 5px;
  //           box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  //           transform: translateX(-31px) translateY(0px);
  //         }
          
  //         h2 {
  //           text-align: center;
  //           color: #333;
  //         }
          
  //         form {
  //           margin-top: 20px;
  //         }
          
  //         label {
  //           display: block;
  //           margin-bottom: 10px;
  //           color: #333;
  //           font-weight: bold;
  //         }
          
  //         input[type="text"] {
  //           width: 100%;
  //           padding: 10px;
  //           font-size: 16px;
  //           border-radius: 5px;
  //           border: 1px solid #ddd;
  //           outline: none;
  //         }
          
  //         input[type="submit"] {
  //           display: block;
  //           margin: 18px auto;
  //           padding: 10px 20px;
  //           font-size: 18px;
  //           background-color: #4caf50;
  //           color: #fff;
  //           border: none;
  //           border-radius: 5px;
  //           cursor: pointer;
  //           transition: background-color 0.3s ease-in-out;
  //         }
  //         input[type="submit"]:hover {
  //           background-color: #45a049;
  //         }
          
  //         .rate-section {
  //           margin-top: 20px;
  //         }
          
  //         .rating {
  //           display: flex;
  //           justify-content: center;
  //           align-items: center;
  //           flex-direction: row;
  //           font-size: 30px;
  //         }
          
  //         .rating input {
  //           display: none;
  //         }
          
  //         .rating label {
  //           color: #ddd;
  //           margin: 0 5px;
  //           cursor: pointer;
  //           transition: color 0.3s ease-in-out;
  //         }
          
  //         .rating input:checked ~ label,
  //         .rating input:hover ~ label {
  //           color: #ffca08; /* Color for the selected star */
  //         }
          
  //         .container img {
  //           display: inline-block;
  //           transform: translateX(218px) translateY(0px);
  //         }
          
  //         #question {
  //           transform: translateX(0px) translateY(3px) !important;
  //         }
          
  //         .container form p {
  //           text-align: center;
  //         }
          
  //         .container form h3 {
  //           text-align: center;
  //           position: relative;
  //           top: 6px;
  //         }
  //         /* Container */
  //         .container{
  //          transform:translatex(-12px) translatey(155px);
  //          border-width:1px;
  //          border-color:#a0a0a0;
  //          border-style:solid;
  //          margin-right:auto !important;
  //         }
          
  //         /* Label */
  //         .container form label{
  //          text-align:right;
  //          position:relative;
  //          left:-6px;
  //         }
          
          
  //         </style>
  //       </head>
  //       <body>
  //         <div class="container">
  //           <img src="images/student.webp" alt="Image" style="width: 150px; height: 150px;">
  //           <h2>إطرح سؤالك</h2>
  //           <form action="/submit" method="post">
  //             <label for="question">أكتب سؤالك هنا</label>
  //             <input type="text" id="question" name="question">
  //             <input type="submit" value="Submit">
  //             <div class="rate-section">
  //               <h3>إعطي تقييما للأستاذ</h3>
  //               <p>Please provide your feedback by rating our service:</p>
  //               <div class="rating">
  //                 <input type="radio" id="star5" name="rating" value="5" />
  //                 <label for="star5">&#9733;</label>
  //                 <input type="radio" id="star4" name="rating" value="4" />
  //                 <label for="star4">&#9733;</label>
  //                 <input type="radio" id="star3" name="rating" value="3" />
  //                 <label for="star3">&#9733;</label>
  //                 <input type="radio" id="star2" name="rating" value="2" />
  //                 <label for="star2">&#9733;</label>
  //                 <input type="radio" id="star1" name="rating" value="1" />
  //                 <label for="star1">&#9733;</label>
  //               </div>
  //             </div>
  //           </form>
  //           <form action="/logout" method="post">
  //             <input type="submit" value="Logout">
  //           </form>
  //         </div>
      
  //         <script>
  //           const ratingInputs = document.querySelectorAll('.rating input');
  //           const labels = document.querySelectorAll('.rating label');
      
  //           ratingInputs.forEach((input, index) => {
  //             input.addEventListener('change', () => {
  //               resetColors();
  //               colorStars(index);
  //             });
  //           });
      
  //           function resetColors() {
  //             labels.forEach(label => {
  //               label.style.color = '#ddd';
  //             });
  //           }
      
  //           function colorStars(index) {
  //             for (let i = 0; i <= index; i++) {
  //               labels[i].stylecolor = '#ffca08';
  //             }
  //           }
  //         </script>
  //       </body>
  //       </html>
  //     `;
  //     res.send(html);
  //   } else {
  //     const loginError = req.session.loginError; // Retrieve the login error message from the session
  //     req.session.loginError = null; // Clear the login error message from the session
  
  //     res.render('login.ejs', { loginError: loginError }); // Render the login template with the loginError variable
  //   }
  // });

app.get('/', (req,res)=> {
  res.sendFile(__dirname + '/home.html');

})


// POST route to handle answering a question
app.post('/answer', async (req, res) => {
  try {
    const { questionId, answer } = req.body;

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
    res.render('template', { answer: updatedQuestion.answer });

  } catch (error) {
    console.error(error);
    res.status(500).send('حدث خطأ أثناء إرسال الإجابة.');
  }
});

// GET route for the login page
app.get('/login', async (req, res) => {
  try {
    const loginError = req.session.loginError; // Retrieve the login error message from the session
    req.session.loginError = null; // Clear the login error message from the session

    const answer = req.query.answer; // Retrieve the answer from the query parameters

    res.render('login.ejs', { loginError: loginError, answer: answer });
  } catch (error) {
    console.error(error);
    res.status(500).send('حدث خطأ أثناء تسجيل الدخول.');
  }
});

// GET route for the user-specific page
app.get('/:username', async (req, res) => {
  try {
    // Retrieve the user type from the session or wherever it is stored
    const userType = req.session.userType; // Adjust this based on your authentication mechanism
    const loggedIn = req.session.loggedIn; // Adjust this based on your authentication mechanism
    const answer = req.session.answer; // Retrieve the answer from the session

    // Retrieve the questions from the database
    const questions = await UserQuestionsCollection.find();

    // Render the HTML template and pass the user type and questions as data
    if (loggedIn && userType === 'طالب') {
      // Additional logic for students
      res.render('template', { userType, questions, answer });
    } else {
      // Default template for other user types
      res.render('teacher-template', { userType, questions });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('حدث خطأ أثناء جلب الأسئلة.');
  }
});

// Login route
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const userType = req.body.userType;
  const answer = req.body.answer; // Add the answer variable

  UserRegistration.findOne({ username: username, password: password, userType: userType })
    .then(user => {
      if (user) {
        req.session.loggedIn = true;
        req.session.username = username;
        req.session.password = password;
        req.session.userType = userType;
        req.session.answer = answer; // Store the answer in the session
        res.redirect(`/${username}`);
      } else {
        req.session.loginError = 'Invalid username, password, or user type.';
        res.redirect('/login');
      }
    })
    .catch(error => {
      res.status(500).send('An error occurred while logging in.');
    });
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
app.listen( process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});