///////////////////////////
// Set-up
//////////////////////////

const express = require('express');
const morgan = require('morgan');
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 8080; // default port 8080

// Configuration

app.set("view engine", "ejs");

///////////////////////////
// Middleware
//////////////////////////

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ["Purple", "Super Dog", "House cat"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))


///////////////////////////
// "Database"
//////////////////////////


// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };

const urlDatabase = {
  // b6UTxQ: {
  //   longURL: "https://www.tsn.ca",
  //   userID: "aJ48lW",
  // },
  // i3BoGr: {
  //   longURL: "https://www.google.ca",
  //   userID: "aJ48lW",
  // },
};

const users = {
  // aJ48lW: {
  //   id: "aJ48lW",
  //   email: "a@a.com",
  //   password: "a",
  // },
  // aJ48lW: {
  //   id: "aJ48lW",
  //   email: "b@b.com",
  //   password: "b",
  // },
};

/////////////////////////
// Helpers
////////////////////////
// generate random string function
const generateRandomString = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  while (randomString.length < 6) {
    randomString += chars[Math.floor(Math.random() * chars.length)];
  }
  return randomString;
};

const getUserByEmail = (email, data) => {
  for (const user in data) {
    if (data[user].email === email) {
      return data[user];
    }
  }
  return undefined;
}


const findUserWithEmail = (email) => {
  for (const userId in users) {
    const user = users[userId];

    if (user.email === email) {
      // found user!
      return user;
    }
  }
  return null;
}

const urlsForUser = (id) => {
  let userUrls = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/users.json", (req, res) => {
  res.json(users);
});

// POST urls - generates short URL;
// add new short URL to dbase then redirect to urls and show short url
app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: req.body.longURL,
      userID: req.cookies["user_id"]
    };
    res.redirect(`/urls/${shortURL}`);
  } else {
    // prevent non-logged in users from posting changes to database
    res.statusCode = 403;
    res.send("<h1>403 Fobidden</h1><p>Not logged in.</p>")
  }
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
  const userID = req.cookies["user_id"];
  const userUrls = urlsForUser(userID);
  const templateVars = {
    urls: userUrls,
    user: users[userID] }; // route the user_id
  res.render("urls_index", templateVars);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!"};
  res.render("hello_world", templateVars);
});

// Add a GET Route to Show the Form
// new url creation page
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = {
      user: users[req.cookies['user_id']]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});


// show urlDatabase short and long url
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

// Redirect any request to "/u/:id" to its longURL
// Check if :id is available - if not - return 404.
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL) {
    res.redirect(urlDatabase[req.params.shortURL].longURL);
  } else {
    res.statusCode = 404;
    res.send("<h1>404 Not Found!</h1><p>This short URL is invalid.</p>")
  }
});

// show short/long version - short URL page
app.get("/urls/:shortURL", (req, res) => {
  const userID = req.cookies["user_id"];
  const userUrls = urlsForUser(userID);
  const templateVars = {
    urls: userUrls,
    user: users[userID],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user: users[req.cookies["user_id"]]
  };
    res.render("urls_show", templateVars);
  });


// update longURL in the database
app.post('/urls/:shortURL', (req, res) => {
  if (req.cookies["user_id"]) {
    const shortURL = req.params.shortURL;
    urlDatabase[shortURL].longURL = req.body.updatedURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.statusCode = 403;
    res.send("<h1>403 Fobidden</h1><p>Not logged in.</p>")
  }
});



// Delete url from database then redirect to index page
// Add POST route for /urls/:id/delete to remove URLs
app.post("/urls/:shortURL/delete", (req, res) => {
  if (req.cookies["user_id"]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.statusCode = 403;
    res.send("<h1>403 Fobidden</h1><p>Not logged in.</p>")
  }
});

// app.get to login page
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      user: users[req.cookies["user_id"]]};
      res.render("urls_login", templateVars);
  }
  });


// add endpoint to handle POST to /login
app.post('/login', (req, res) => {
  const user = getUserByEmail(req.body.email, users);
  if (user) {
    if (req.body.password === user.password) {
      res.cookie("user_id", user.userID);
      res.redirect("/urls");
    } else {
      res.statusCode = 403;
      res.send("<h1>403 Fobidden</h1><p>Wrong password.</p>")
    }
  } else {
    res.statusCode = 403;
    res.send("<h1>403 Forbidden</h1><p>Email address not registered.</p>")
  }
});

// add endpoint to handle POST to /logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// add endpoint for GET /register
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  } else {
    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id],
      user: users[req.cookies["user_id"]],
    };
    res.render("urls_register", templateVars);
  }
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
      }
      res.cookie('user_id', userID);
      res.redirect('/urls');
    } else {
      res.statusCode = 400;
      res.send("<h1>400 Bad Request</h1><p>Email already exists</p>")
    }
  } else {
    res.statusCode = 400;
    res.send("<h1>400 Bad Request</h1><p>Please don't leave the email and password fields empty.")
  }
});

///////////////////////////
// Listener
//////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
