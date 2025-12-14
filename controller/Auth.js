const { User } = require("../model/User");
const crypto = require("crypto");
const { sanitizeUser, sendMail } = require("../services/common");
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

// export function loginUser(loginInfo) {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const response = await fetch("/auth/login", {
//         method: "POST",
//         body: JSON.stringify(loginInfo),
//         credentials: "include",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       // Read body safely
//       let data;
//       try {
//         data = await response.json(); // parse JSON once
//       } catch {
//         const text = await response.text(); // fallback if not JSON
//         data = { message: text };
//       }

//       if (response.ok) {
//         resolve({ data });
//       } else {
//         reject({ error: data }); // always pass a plain object
//       }

//     } catch (error) {
//       reject({ error: { message: error.message } }); // serializable error
//     }
//   });
// }

// ************working code bu with few response.text error*************** */
// exports.loginUser = async (req, res) => {
//   try {
//     // res.json(req.user);
//     // ❌ Mistake: sending a response here would terminate the request
//     // You commented it out, which is good.

//     console.log("login", req.user.token);
//     // ❌ Mistake: req.user.token does not exist. Passport does not create it.
//     // Logging undefined token can be confusing.

//     const user = req.user;
//     if (!user) {
//       // ❌ Good fallback, although normally passport should handle this
//       return res.status(401).json({ message: "Authentication failed" });
//     }

//     const token = jwt.sign(sanitizeUser(user), process.env.JWT_SECRET_KEY);

//     res
//       .cookie("jwt", req.user.token, {
//         // ❌ Mistake: storing undefined in cookie, should be `token`
//         expires: new Date(Date.now() + 3600000),
//         sameSite: "Lax",
//         secure: false,
//         httpOnly: true,
//       })
//       .status(201)
//       // ❌ Mistake: 201 is "Created", login should return 200 OK
//       .json({ id: req.user.id, role: req.user.role });
//       // ❌ Mistake: first response sent here
//       // Any code after this line is **unreachable** or will cause "Cannot set headers after sent"

//   } catch (err) {
//     console.error("Login failed:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//     // ❌ Mistake: missing return, function continues executing
//   }

//   res.json({ status: "success" });
//   // ❌ Mistake: second response! Already sent above
//   // This will throw "Cannot set headers after they are sent to the client"

//   try {
//     const user = await User.findOne(
//       { email: req.body.email }
//       //   "id name email" //projection commented out
//     ).exec();
//     console.log(user);

//     if (!user) {
//       return res.status(401).json({ message: "no such user email" });
//       // ❌ Mistake: unreachable code if the first response already fired
//     } else if (user.password === req.body.password) {
//       // ❌ Mistake: comparing passwords in plaintext, very insecure
//       try {
//         console.log("login success");
//         return (
//           res
//             .status(200)
//             .json({ id: user.id, role: user.role })
//             // ❌ Mistake: duplicate response possible, also unreachable if passport already handled login
//         );
//       } catch (err) {
//         return res.status(401).json({ message: "invalid credentials" });
//         // ❌ Mistake: nested try/catch unnecessary
//       }
//     } else {
//       return res.status(401).json({ message: "invalid credentials" });
//       // ❌ Mistake: unreachable if previous responses already sent
//     }
//   } catch (err) {
//     return res.status(400).json({ message: "something went wrong" });
//     console.log("not happening", err);
//     // ❌ Mistake: unreachable console.log after return
//   }
// };

//the working code
exports.loginUser = async (req, res) => {
  try {
    console.log("Inside loginUser controller", req.user);
    // res.json(req.user);
    // console.log("login", req.user.token); //commented becaose we send token by cookie
    const user = req.user;
    if (!user) {
      // This case should be handled by passport, but as a fallback
      return res.status(401).json({ message: "Authentication failed" });
    } else {
      const token = jwt.sign(
        // sanitizeUser(user),
        // sanitizeUser(user), // this logs in but the json parse error is still there
        // {
        //   id: user._id.toString(), // not working throws 500 error
        //   role: user.role,
        // },
        {
          id: user.id, // working
          role: user.role,
        },
        process.env.JWT_SECRET_KEY
      );
      res
        .cookie("jwt", token, {
          expires: new Date(Date.now() + 3600000),
          sameSite: "Lax", // Use "Lax" for localhost, "None" for HTTPS
          secure: false, // Use true only in production with HTTPS
          httpOnly: true,
        })
        .status(200)
        // .json(req.user.token);//old code
        .json({ id: user.id, role: user.role }); // sending user id and role is actually helping in logging in
    }
  } catch (err) {
    console.error("Login failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.logout = async (req, res) => {
  res
    .cookie("jwt", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
      // sameSite: "Lax",
      // secure: false, 
    })
    .sendStatus(200)
};

// res.json({ status: "login controller success" });
// **********old code with plain text password comparison*************
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
//       return (
//         res
//           .status(200)
//           // .json({ id: user.id, email: user.email, name: user.name, addresses : user.addresses }); //userInfo vs loggedInUser
//           .json({ id: user.id, role: user.role })
//       );
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

// exports.checkUser = async (req, res) => {
//   res.json({ status: "success", user: req.user });
// };
exports.checkAuth = async (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};
exports.resetPasswordRequest = async (req, res) => {
  //lets send email and a token in the body to verify that user to make sure tha he has clicked the right link
  const email = req.body.email;
  const user = await User.findOne({ email: email });
  if (user) {
    const token = crypto.randomBytes(64).toString("hex");
    user.resetPasswordToken = token;
    await user.save();
    //Also set the token in email
    // the below section only comes after the user is verified
    const resetPageLink =
      "http://localhost:3000/reset-password?token=" + token + "&email=" + email;
    const subject = "Password Reset Request";
    const html = `<p> click <a href= "${resetPageLink}" >here</a> to reset password </p>`;
    console.log("EMAIL RECEIVED IN BACKEND:", email);
    console.log("resetPageLink:", resetPageLink);

    if (email) {
      const response = await sendMail({
        to: email, //this is req.body.email.email
        subject,
        html,
      });
      res.status(200).json(response);
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
  }
};
exports.resetPassword = async (req, res) => {
  const { email, token, password } = req.body;

  const user = await User.findOne({ email: email, resetPasswordToken: token });
  if (user) {
    const salt = crypto.randomBytes(16); // generate 16-byte salt

    crypto.pbkdf2(
      req.body.password,
      salt,
      310000,
      32,
      "sha256",
      async (err, hashedPassword) => {
        user.password = hashedPassword;
        user.salt = salt;
        await user.save();

        const subject = "Password Reset Successful";
        const html = `<p> Password Reset Successful</p>`;

        if (email) {
          const response = await sendMail({
            to: email, //this is req.body.email.email
            subject,
            html,
          });
          res.status(200).json(response);
        } else {
          res.sendStatus(401);
        }
      }
    );
  } else {
    res.sendStatus(401);
  }
};
