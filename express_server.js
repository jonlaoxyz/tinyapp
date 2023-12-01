///////////////////////////
// Set-up
//////////////////////////

const express = require('express');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080; // default port 8080


///////////////////////////
// Configure
//////////////////////////
app.set("view engine", "ejs");

///////////////////////////
// Middleware
//////////////////////////
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["Purple", "Super Dog", "House cat"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


///////////////////////////
// "Database"
//////////////////////////
const urlDatabase = {};
const users = {};

/////////////////////////
// Helpers / functions
////////////////////////
const { getUserByEmail } = require('./helpers');

// generate random string function
const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  while (randomString.length < 6) {
    randomString += chars[Math.floor(Math.random() * chars.length)];
  }
  return randomString;
};

const urlsForUser = (id) => {
  let userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

// JSON database checks
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});


// Routing

// if user is logged in - show URLs. if NOT - show login page.
app.get("/", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
  }
  res.redirect("/login");
});



// POST urls - generates short URL;
// add new short URL to dbase then redirect to urls and show short url
app.post("/urls", (req, res) => {
  if (req.session.userID) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.session.userID
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    // prevent non-logged in users from posting changes to database
    res.statusCode = 403;
    res.send("<h1>403 Fobidden</h1><p>Not logged in.</p>");
  }
});


// new route handler for "/urls" and use res.render() to pass the URL data to our template
// urls index page
app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = {
    urls: userUrls,
    user: users[userID]
  };

  if (!userID) {
    res.statusCode = 401;
  }
  res.render("urls_index", templateVars);
});

// app.get("/hello", (req, res) => {
//   const templateVars = { greeting: "Hello World!"};
//   res.render("hello_world", templateVars);
// });

// Add a GET Route to Show the Form
// new url creation page
app.get("/urls/new", (req, res) => {
  if (req.session.userID) {
    const templateVars = {user: users[req.session.userID]};
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});


/* // show urlDatabase short and long url
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
}); */

// Redirect any request to "/u/:id" to its longURL
// Check if :id is available - if not - return 404.
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.statusCode = 404;
    res.send("<h1>404 Not Found!</h1><p>This short URL is invalid.</p>");
  }
});

// show short/long version - short URL page
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.session.userID;
  const shortURL = req.params.shortURL;
  const userUrls = urlsForUser(userID, urlDatabase);
  const templateVars = { urlDatabase, userUrls, shortURL, user: users[userID] };

  if (!urlDatabase[shortURL]) {
    res.statusCode = 404;
    res.send("<h1>404 Not Found!</h1><p>This short URL doesn't exist.</p>");
  } else if (!userID || !userUrls[shortURL]) {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized!</h1><p>Unauthorized user.</p>");
  } else {
    res.render("urls_show", templateVars);
  }
});

// update longURL in the database if it belongs to the user.
app.post('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (req.session.userID  && req.session.userID === urlDatabase[shortURL].userID) {
    urlDatabase[shortURL].longURL = req.body.updatedURL;
    res.redirect("/urls/");
  } else {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized</h1><p>Not logged in.</p>");
  }
});

// Delete url from database then redirect to index page
// Add POST route for /urls/:id/delete to remove URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;

  if (req.session.userID  && req.session.userID === urlDatabase[shortURL].userID) {
    delete urlDatabase[shortURL];
    res.redirect("/urls");
  } else {
    res.statusCode = 401;
    res.send("<h1>401 Unauthorized</h1><p>Not logged in.</p>");
  }
});

// app.get to login page
app.get("/login", (req, res) => {
  if (req.session.userID) {
    res.redirect("/urls");
    return;
  }
  const templateVars = {user: users[req.session.userID]};
  res.render("urls_login", templateVars);
});


// add endpoint to handle POST to /login
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.userID = user.userID;
    res.redirect('/urls');
  } else {
    res.statusCode = 401;
    res.send("<h1>401 Unathorized</h1><p>Wrong username or password.</p>");
  }
});

// add endpoint to handle POST to /logout
app.post('/logout', (req, res) => {
  res.clearCookie('session.sig');
  res.clearCookie('session');
  res.redirect('/login');
});

// add endpoint for GET /register
app.get("/register", (req, res) => {
  if (req.session.userID) {
    res.redirect("/login");
    return;
  }
  const templateVars = {
    user: users[req.session.userID]
  };
  res.render("urls_register", templateVars);
});

// register page function
app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (!getUserByEmail(req.body.email, users)) {
      const userID = generateRandomString();
      users[userID] = {
        userID,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 10)
      };
      req.session.userId = userID;
      res.redirect('/login');
    } else {
      res.statusCode = 400;
      res.send("<h1>400 Bad Request</h1><p>Cannot create new account. Email address already registered.</p>");
    }
  } else {
    res.statusCode = 400;
    res.send("<h1>400 Bad Request</h1><p>Please don't leave Email and Password empty.</p>");
  }
});

///////////////////////////
// Listener
//////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
