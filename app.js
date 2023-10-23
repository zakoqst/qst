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
            </head>
            <body>
                <h2>Submit a Question</h2>
                <form action="/submit" method="post">
                    <label for="question">Enter your question:</label><br>
                    <input type="text" id="question" name="question"><br><br>
                    <input type="submit" value="Submit">
                </form>
        `;

        if (userType === 'conference') {
            let questions = [];
            for (const key in userQuestions) {
                questions = questions.concat(userQuestions[key]);
            }
            html += `
                <h2>All Questions</h2>
                <ul>
            `;

            for (let i = 0; i < questions.length; i++) {
                html += `<li>${questions[i]}</li>`;
            }

            html += `
                </ul>
            `;
        }

        html += `
            <form action="/logout" method="post">
                <input type="submit" value="Logout">
            </form>
            </body>
            </html>
        `;

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
