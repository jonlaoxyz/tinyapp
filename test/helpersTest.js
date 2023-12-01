const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', () => {
    const user = getUserByEmail("user@example.com", testUsers)
    // const expectedUserID = "userRandomID";
    assert.equal(user, testUsers.userRandomID);
  });

  it('should return undefined when looking for a non-existent email', () => {
    const user = getUserByEmail('someuser@example.com', testUsers);
    assert.equal(user, undefined);
  });
});