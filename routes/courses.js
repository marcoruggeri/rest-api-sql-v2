const express = require('express');
const router = express.Router();
const { Course, User } = require('../models');
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

// retrieve all courses
router.get('/courses', async (req, res) => {
  try {
    let courses = await Course.findAll({
      attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId']
    });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json(error.errors).end();
  }
});

// retrieve specific course
router.get('/courses/:id', async (req, res) => {
  try {
    let course = await Course.findByPk(req.params.id, {
      attributes: ['id', 'title', 'description', 'estimatedTime', 'materialsNeeded', 'userId']
    });
    if (course) {
      res.status(200).json(course);
    } else {
      res.status(404).end();
    }
  } catch (error) {
    res.status(500).json(error.errors).end();
  }
});

// create new course
router.post('/courses', authenticateUser, [
  check('title')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "title"'),
  check('description')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "description"')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
      let course = await Course.create(req.body);
      res.status(201).location(`/courses/${course.id}`).end();
    }
  } catch (error) {
    res.status(500).json(error).end();
  }

});

// edit an existing course
router.put('/courses/:id', authenticateUser, [
  check('title')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "title"'),
  check('description')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "description"')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      res.status(400).json({ errors: errorMessages });
    } else {
        let course = await Course.findByPk(req.params.id);
        if (course.userId === req.currentUser.id) {
          await course.update(req.body);
          res.status(204).end();
        } else {
          res.status(403).end();
        }
    }
  } catch (error) {
    res.status(500).json(error).end();
  }
});

// delete an existing course
router.delete('/courses/:id', authenticateUser, async (req, res) => {
  try {
    let course = await Course.findByPk(req.params.id);
    if (course) {
      if (course.userId === req.currentUser.id) {
        await course.destroy();
        res.status(204).end();
      } else {
        res.status(403).end();
      }  
    } else {
      res.status(404).end();
    }
  } catch (error) {
    res.status(500).json(error).end();
  }
});

module.exports = router;