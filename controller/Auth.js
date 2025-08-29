const { User } = require("../model/User");
const crypto = require("crypto");
const { sanitizeUser } = require("../services/common");
const jwt = require("jsonwebtoken");

const SECRET_KEY = "SECRET_KEY";

exports.createUser = async (req, res) => {
  try {
    const salt = crypto.randomBytes(16); // generate 16-byte salt

    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async (err, hashedPassword) => {
        if (err) {
          return res.status(500).json({ error: "Password hashing failed" });
        }

        const user = new User({
          ...req.body,
          password: hashedPassword,
          salt: salt,
        });

        const doc = await user.save(); // creates a user in the DB
        req.login(sanitizeUser(doc), (err) => {
          // this also calls a serializer and calls a session
          if (err) {
            res.status(400).json(err);
          } else {
            const token = jwt.sign(sanitizeUser(doc), SECRET_KEY);
            console.log("create userlogin", token);
            res
              .cookie("jwt", token, {
                expires: new Date(Date.now() + 3600000),
                httpOnly: true,
                sameSite: "None",
              })
              .status(201)
              // .json(token);//old code
              .json({ id: doc.id, role: doc.role });
          }
        });
      }
    );
  } catch (err) {
    res.status(400).json(err);
    console.error(err);
  }
};
exports.loginUser = async (req, res) => {
  // res.json(req.user); //commented becaose we send token by cookie
  console.log("login", req.user.token);

  res
    .cookie("jwt", req.user.token, {
      expires: new Date(Date.now() + 3600000),
      sameSite: "Lax", // Use "Lax" for localhost, "None" for HTTPS
      secure: false, // Use true only in production with HTTPS
      httpOnly: true,
    })
    .status(201)
    // .json(req.user.token);//old code
    .json({ id: req.user.id, role: req.user.role }); // sending user id and role is actually helping in logging in

  // res.json({status:"success"});

  // try {
  //   const user = await User.findOne(
  //     { email: req.body.email }
  //     //   "id name email" //because of this projection the password info isnt going to the below logic hence you cant compare the passwords
  //   ).exec(); //The second argument "id name email" is a projection, meaning:Only return these fields (id, name, and email) in the result.All other fields (like password) are excluded.
  //   console.log(user);
  //   if (!user) {
  //     return res.status(401).json({ message: "no such user email" });
  //   } else if (user.password === req.body.password) {
  //     try {
  //       console.log("login success");
  //       return res
  //         .status(200)
  //         // .json({ id: user.id, email: user.email, name: user.name, addresses : user.addresses }); //userInfo vs loggedInUser
  //         .json({ id: user.id, role:user.role });
  //     } catch (err) {
  //       return res.status(401).json({ message: "invalid credentials" });
  //     }
  //   } else {
  //     return res.status(401).json({ message: "invalid credentials" });
  //   }
  //   // console.log(docs);
  // } catch (err) {
  //   return res.status(400).json({ message: "something went wrong" });
  //   console.log("not happening", err);
  // }
};
// exports.checkUser = async (req, res) => {
//   res.json({ status: "success", user: req.user });
// };
exports.checkAuth = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.sendStatus(401);
  }
};
