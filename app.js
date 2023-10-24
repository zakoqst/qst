const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({ secret: 'secret-key', resave: true, saveUninitialized: true }));

let userQuestions = {};

app.get('/', (req, res) => {
    const loggedIn = req.session.loggedIn;
    const username = req.session.username;
    const userType = req.session.userType;

    if (loggedIn) {
        let html = `
        <html>
        <head>
            <title>Question Form</title>
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
    
    if (userType === 'conference') {
        let questions = [];
        for (const key in userQuestions) {
            questions = questions.concat(userQuestions[key]);
        }
        html += `
            <img src="images/cdec (2).jpg" alt=" Image" style="width: 150px; height: 150px;">
            <h2>All Questions</h2>
            <ul>

   
        `;
    
        for (let i = 0; i < questions.length; i++) {
            html += `<li>${questions[i]}</li>`;
        }
    
        html += `
        
            </ul>

            <form action="/logout" method="post">
            <input type="submit" value="Logout">
        </form>
        `;
    }
    if (userType === 'student') {
    html += `
    
<head>
    <title>Login</title>
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
        .rating input {
            display: none;
        }
        .rating label {
            display: inline-block;
            font-size: 30px;
            color: #ccc;
            cursor: pointer;
        }
        .rating label:before {
            content: '\2606'; /* Unicode character for empty star */
        }
        .rating input:checked ~ label:before {
            color: #ffca08; /* Color for the selected star */
            content: '\2605'; /* Unicode character for filled star */
        }
    </style>
</head>

        <h2>Submit a Question</h2>
        <form action="/submit" method="post">
            <label for="question">Enter your question:</label><br>
            <input type="text" id="question" name="question"><br><br>
            <input type="submit" value="Submit">

            
         <div class="rate-section">
            <h3>Rate Me</h3>
            <p>Please provide your feedback by rating our service:</p>
            <div class="rating">
                <input type="radio" id="star5" name="rating" value="5" />
                <label for="star5">☆</label>
                <input type="radio" id="star4" name="rating" value="4" />
                <label for="star4">☆</label>
                <input type="radio" id="star3" name="rating" value="3" />
                <label for="star3">☆</label>
                <input type="radio" id="star2" name="rating" value="2" />
                <label for="star2">☆</label>
                <input type="radio" id="star1" name="rating" value="1" />
                <label for="star1">☆</label>
            </div>
        </div>
        </form>
        <form action="/logout" method="post">
            <input type="submit" value="Logout">
        </form>
        </body>
        </html>
    `;}
    
        res.send(html);
    } else {
        res.sendFile(__dirname + '/login.html');
    }
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const userType = req.body.userType; // Assuming you have a field in your form for selecting the user type

    // Check the username, password, and userType (this is just a basic example)
    if (username === req.body.username && password === req.body.password) {
        req.session.loggedIn = true;
        req.session.username = username;
        req.session.userType = userType; // Save the user type in the session

        if (!userQuestions[username]) {
            userQuestions[username] = [];
        }
        res.redirect('/');
    } else {
        res.send('Login failed. Please try again.');
    }
});

app.post('/submit', (req, res) => {
    const username = req.session.username;
    const userType = req.session.userType;
    const question = req.body.question;

    if (userType === 'student') {
        userQuestions[username].push(question);
        saveQuestionToFile(username, question);
    }

    res.redirect('/');
});

app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return console.log(err);
        }
        res.redirect('/');
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

function saveQuestionToFile(username, question) {
    fs.appendFile('questions.txt', `${username}: ${question}\n`, (err) => {
        if (err) throw err;
        console.log('Question is saved.');
    });
}
