///////////////////////////
// Set-up
//////////////////////////

const express = require('express');
const morgan = require('morgan');
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');


///////////////////////////
// Middleware
//////////////////////////

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

///////////////////////////
// "Database"
//////////////////////////


const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};



// generate random string function
const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  while (randomString.length < 6) {
    randomString += chars[Math.floor(Math.random() * chars.length)];
  }
  return randomString;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

///////////////////////////
// Listener
//////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// POST urls - generates short URL;
// add new short URL to dbase then redirect to urls and show short url
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});


app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});
 
app.get("/fetch", (req, res) => {
  res.send(`a = ${a}`);
});

// new route handler for "/urls" and use res.render() to pass the URL data to our template
// urls index page
app.get("/urls", (req, res) => {
  const templateVars = {
    username: req.cookies["username"], // route the username
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!"};
  res.render("hello_world", templateVars);
});

// Add a GET Route to Show the Form
// New url creating page
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies['username']};
  res.render("urls_new", templateVars);
});
// new url creation page

// show urlDatabase short and long url
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});

// Redirect any request to "/u/:id" to its longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});


// update longURL in the database
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = req.body.updatedURL;
  res.redirect(`/urls/${shortURL}`);
});


// Delete url from database then redirect to index page
// Add POST route for /urls/:id/delete to remove URLs
app.post('/urls/:shortURL/delete', (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');
});

// add endpoint to handle POST to /login
app.post('/login', (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

// add endpoint to handle POST to /logout
app.post('/logout', (req, res) => {
  res.clearCookie('username', req.body.username);
  res.redirect('/urls');
});

// add endpoint for GET /register
app.get("/register", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"],
  };
  res.render("urls_register", templateVars);
});

// register page function
app.post("/register", (req, res) => {
  const userID = generateRandomString();
  users[userID] = {
    userID,
    email: req.body.email,
    password: req.body.password
  }
res.cookie('user_id', userID);
res.redirect('/urls');
});