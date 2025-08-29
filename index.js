require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const crypto = require("crypto");
const LocalStrategy = require("passport-local").Strategy;
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser"); //for cookies from client side
const path = require("path");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// 🚀 Init express app
const server = express();

//PASSPORT CONFIG
const { User } = require("./model/User");
const { isAuth, sanitizeUser, cookieExtractor } = require("./services/common");

//JWT options
// 🔐 JWT config
const opts = {
  // opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); without cookies
  // opts.jwtFromRequest = cookieExtractor;
  // opts.secretOrKey = process.env.JWT_SECRET_KEY;
  jwtFromRequest: cookieExtractor,
  secretOrKey: process.env.JWT_SECRET_KEY,
};

//payments
// server.use("/api/stripe", require("./routes/stripe"));

// Passport Local Strategy
passport.use(
  "local",
  new LocalStrategy({ usernameField: "email" }, async function (
    // usernameField has been added as email.
    // username, // we pass email at all the places
    email,
    password,
    done
  ) {
    {
      try {
        // const user = await User.findOne({ email: username }).exec();
        const user = await User.findOne({ email: email }).exec();
        if (!user) {
          done(null, false, { message: "no such user email" });
          // return res.status(401).json({ message: "no such user email" });
        }
        crypto.pbkdf2(
          password,
          user.salt,
          310000,
          32,
          "sha256",
          async (err, hashedPassword) => {
            if (err) {
              return done(err);
            }
            if (!crypto.timingSafeEqual(user.password, hashedPassword)) {
              return done(null, false, { message: "invalid credentials" });
            } else {
              //creating a token
              const token = jwt.sign(
                sanitizeUser(user),
                process.env.JWT_SECRET_KEY
              );
              // done(null, sanitizeUser(user));
              console.log("localstrargy", token);
              // return done(null, { token });//old code  // this line sends to serialize
              // return done(null, { id: user.id, role: user.role }); // this throws an error, because it serializes
              return done(null, { id: user.id, role: user.role, token }); // this works, because we are sending token // this is req.user
            }
          }
        );
      } catch (err) {
        return done(err);
      }
    }
  })
);

passport.use(
  "jwt",
  new JwtStrategy(opts, async function (jwt_payload, done) {
    // console.log(jwt_payload);

    try {
      const user = await User.findById(jwt_payload.id); //this is also a important part
      if (user) {
        return done(null, sanitizeUser(user)); //this calls serializer
      } else {
        return done(null, false);
        // or you could create a new account
      }
    } catch (err) {
      return done(err, false);
    }
  })
);

//this creates session variable req.user on being called
passport.serializeUser(function (user, cb) {
  console.log("serialize", user);
  process.nextTick(function () {
    return cb(null, { id: user.id, role: user.role });
  });
});

//this changes session variable req.user when called from authorized requests
passport.deserializeUser(function (user, cb) {
  console.log("de-serialize", user);

  process.nextTick(function () {
    return cb(null, user);
  });
});

//webhook
// ✅ Stripe Webhook Route FIRST — uses raw body parser!

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
// console.log("Webhook secret loaded:", endpointSecret);

// server.use("/webhook", express.raw({ type: "application/json" }));
// server.use("/webhook");

// server.post("/webhook", (req, res) => {
//   const sig = req.headers["stripe-signature"];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//     console.log("✅ Webhook verified:", event.type);
//   } catch (err) {
//     console.error("❌ Webhook signature error:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   // Handle the event
//   if (event.type === "payment_intent.succeeded") {
//     const paymentIntent = event.data.object;
//     console.log("💰 PaymentIntent succeeded:", paymentIntent.id);
//   }
// })

//webhook
//TODO: we will capture actual order after deploying out server live on public url
server.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("❌ Error verifying webhook signature:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle event
    if (event.type === "payment_intent.succeeded") {
      console.log("✅ PaymentIntent succeeded!");
      const paymentIntent = event.data.object;
      console.log("💰 PaymentIntent succeeded:", paymentIntent.id); //works
    }

    res.status(200).json({ received: true });
  }
);

// 💻 Middleware
server.use(express.json()); //to parse req.body
server.use(express.urlencoded({ extended: true }));
server.use(
  cors({
    origin: "http://localhost:3000", // your React app's URL
    credentials: true, // allow cookies to be sent
    exposedHeaders: ["X-Total-Count"],
  })
); //To protect users. Without it, any website could secretly make requests to any other site where you're logged in — that would be a security risk.

server.use(express.static (path.resolve(__dirname, "build")))
// server.use(express.static (path.join(__dirname, "build")))
// server.use(express.static( "build"))
server.use(cookieParser()); //TO EXTRACT THE COOKIES FROM REQ.COOKIES
server.use(
  session({
    secret: process.env.SESSION_KEY, // use an env variable in production
    resave: false,
    saveUninitialized: false,
  })
);
server.use(passport.authenticate("session"));

//payments

// This is your test secret API key.
// const stripe = require("stripe")(
//   "secrret key"
// );

// const calculateOrderAmount = (items) => {
//   // Calculate the order total on the server to prevent
//   // people from directly manipulating the amount on the client
//   let total = 0;
//   items.forEach((item) => {
//     total += item.amount;
//   });
//   return total;
// };

// server.post("/create-payment-intent", async (req, res) => {
//   const { totalAmount } = req.body;
//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: totalAmount,
//       currency: "usd",
//       automatic_payment_methods: {
//         enabled: true,
//       },
//     });
//     console.log("paymentIntent", paymentIntent);
//     res.send({
//       clientSecret: paymentIntent.client_secret,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send({
//       error: "Error creating payment intent",
//     });
//   }
// });

// main mongoose

// This is your test secret API key.

// const calculateOrderAmount = (items) => {
//   // Calculate the order total on the server to prevent
//   // people from directly manipulating the amount on the client
//   let total = 0;
//   items.forEach((item) => {
//     total += item.amount;
//   });
//   return total;
// };

//   });
//   return total;
// };
// server.use(express.raw({ type: "application/json" }))
// ❌ REMOVE this:
// server.use(express.raw({ type: "application/json" }));
// That will break your /create-payment-intent route and any other JSON parsing.
server.post("/create-payment-intent", async (req, res) => {
  console.log("▶️  Hit CREATE PAYMENT INTENT route", req.method, req.url);
  console.log("▶️  Raw req.body:", req.body);

  const { totalAmount } = req.body; // now it's a proper number

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100,
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log("✅ paymentIntent:", paymentIntent); // clearer logging
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error("❌ Error creating payment intent:", err); // logs the problem
    res.status(500).send({ error: "Error creating payment intent" });
  }
});
//webhook was here
//routes
const productsRouters = require("./routes/Products");
const categoriesRouter = require("./routes/Categories");
const brandsRouter = require("./routes/Brands");
const usersRouter = require("./routes/Users");
const authRouter = require("./routes/Auth");
const cartRouter = require("./routes/Cart");
const ordersRouter = require("./routes/Order");

// server.use("/products", isAuth, productsRouters.router); //we can use jwt toke for client auth only
server.use("/products", isAuth(), productsRouters.router);
server.use("/brands", isAuth(), brandsRouter.router);
server.use("/categories", isAuth(), categoriesRouter.router);
server.use("/users", isAuth(), usersRouter.router);
server.use("/auth", authRouter.router);
server.use("/cart", isAuth(), cartRouter.router);
server.use("/orders", isAuth(), ordersRouter.router);

main().catch((err) => console.log(err));

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("database connected");
}
// server.post("/products", (req, res)=>{
//     createProduct()
//     res.json({status:"success"})
// })

// server.get("/", (req, res) => {
//   res.json({ status: "success" });
// });

// server.post("/products", createProduct); // this routing is done in routes/Products.js

server.listen(process.env.PORT, () => {
  console.log("server started");
});
