const express = require('express');
const router = express.Router();
const User = require('../models').User;
const { check, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

// auth middleware
const authenticateUser = async (req, res, next) => {
  let message = null;
  const credentials = auth(req);
  if (credentials) {
    const user = await User.findOne({where: {emailAddress: credentials.name} });
    if (user) {
      const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
      if (authenticated) {
        req.currentUser = user;
      } else {
        message = `Authentication failure for username : ${user.emailAddress}`;
      }
    } else {
      message = `User not found for username: ${credentials.name}`;
    }
  } else {
    message = 'Auth header not found';
  }
  if (message) {
    console.warn(message);
    res.status(401).json({message: 'Access Denied'});
  } else {
    next();
  }
};

// retrieve authenticated user
router.get('/users', authenticateUser, async (req, res) => {  
  let user = req.currentUser;
  // filter out password, createdAt, updatedAt
  user = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    emailAddress: user.emailAddress
  }
  res.status(200).json(user).end();
});

// create new user
router.post('/users', [
  check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "firstName"'),
  check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "lastName"'),
  check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "email"')
    .isEmail()
    .withMessage('Please provide a valid email address for "email"'), 
  check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "password"')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
      const user = req.body;
      user.password = bcryptjs.hashSync(user.password);
      await User.create(user);
      res.status(201).location('/').end();
    }
  } catch (error) {
    res.status(500).json(error).end();
  }
  
});

module.exports = router;