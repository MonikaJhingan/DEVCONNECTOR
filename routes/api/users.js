const express=require('express');
const router=express.Router();
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const normalize = require('normalize-url');


const User = require('../../models/User');


// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
   '/',
   check('name', 'Name is required').notEmpty(),
   check('email', 'Please include a valid email').isEmail(),
   check(
     'password',
     'Please enter a password with 6 or more characters'
   ).isLength({ min: 6 }),
   async (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }

     const { name, email, password } = req.body;  // Destructured means pulled name emaila nd password from rq.body


try{
   //   1.See if user exists.

   let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }
   //   2. get gravatar

   
   const avatar = normalize(
      gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      }),
      { forceHttps: true }
    );

    user = new User({
      name,
      email,
      avatar,
      password
    });
   //   3.encrypt password

   const salt = await bcrypt.genSalt(10);

   user.password = await bcrypt.hash(password, salt);

   await user.save();

   //   4 return jsonwebtoken
   const payload = {
      user: {
        id: user.id
      }
    };
   jwt.sign(
      payload,
      config.get('jwtSecret'),
      { expiresIn: '5 days' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );


}catch(err)
{
   console.error(err.message);
   res.status(500).send('Server error');

}
   })

module.exports=router;