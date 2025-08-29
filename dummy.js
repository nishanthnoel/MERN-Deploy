// // ✅ ENV & Required Modules
// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const passport = require("passport");
// const LocalStrategy = require("passport-local").Strategy;
// const JwtStrategy = require("passport-jwt").Strategy;
// const ExtractJwt = require("passport-jwt").ExtractJwt;
// const session = require("express-session");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const crypto = require("crypto");
// const jwt = require("jsonwebtoken");
// const bodyParser = require("body-parser");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// // ✅ App & Constants
// const server = express();
// const SECRET_KEY = "SECRET_KEY";
// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// // ✅ Passport Config
// const { User } = require("./model/User");
// const { isAuth, sanitizeUser, cookieExtractor } = require("./services/common");

// const opts = {
//   jwtFromRequest: cookieExtractor,
//   secretOrKey: SECRET_KEY,
// };

// passport.use(
//   "local",
//   new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
//     try {
//       const user = await User.findOne({ email }).exec();
//       if (!user) return done(null, false, { message: "No such user" });

//       crypto.pbkdf2(password, user.salt, 310000, 32, "sha256", (err, hashedPassword) => {
//         if (err) return done(err);
//         if (!crypto.timingSafeEqual(user.password, hashedPassword))
//           return done(null, false, { message: "Invalid credentials" });

//         const token = jwt.sign(sanitizeUser(user), SECRET_KEY);
//         return done(null, { id: user.id, role: user.role, token });
//       });
//     } catch (err) {
//       return done(err);
//     }
//   })
// );

// passport.use(
//   "jwt",
//   new JwtStrategy(opts, async (jwt_payload, done) => {
//     try {
//       const user = await User.findById(jwt_payload.id);
//       if (user) return done(null, sanitizeUser(user));
//       else return done(null, false);
//     } catch (err) {
//       return done(err, false);
//     }
//   })
// );

// passport.serializeUser((user, cb) => {
//   process.nextTick(() => cb(null, { id: user.id, role: user.role }));
// });

// passport.deserializeUser((user, cb) => {
//   process.nextTick(() => cb(null, user));
// });


// // ✅ Stripe Webhook Route FIRST — uses raw body parser!
// server.post(
//   "/webhook",
//   bodyParser.raw({ type: "application/json" }),
//   (req, res) => {
//     const sig = req.headers["stripe-signature"];
//     let event;

//     try {
//       event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//       console.log("✅ Webhook verified:", event.type);
//     } catch (err) {
//       console.error("❌ Webhook signature error:", err.message);
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     // ✅ Handle Stripe event
//     if (event.type === "payment_intent.succeeded") {
//       const paymentIntent = event.data.object;
//       console.log("💰 PaymentIntent succeeded:", paymentIntent.id);
//     }

//     res.status(200).json({ received: true });
//   }
// );

// // ✅ Middlewares (after webhook)
// server.use(express.json()); // for all JSON routes
// server.use(cookieParser());
// server.use(
//   cors({
//     origin: "http://localhost:3000",
//     credentials: true,
//     exposedHeaders: ["X-Total-Count"],
//   })
// );
// server.use(
//   session({
//     secret: "your_secret_key",
//     resave: false,
//     saveUninitialized: false,
//   })
// );
// server.use(passport.authenticate("session"));
// server.use(express.urlencoded({ extended: true }));

// // ✅ Stripe Payment Intent Route
// server.post("/create-payment-intent", async (req, res) => {
//   const { totalAmount } = req.body;

//   try {
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: totalAmount * 100, // convert to cents
//       currency: "usd",
//       automatic_payment_methods: { enabled: true },
//     });

//     console.log("✅ paymentIntent created:", paymentIntent.id);
//     res.send({ clientSecret: paymentIntent.client_secret });
//   } catch (err) {
//     console.error("❌ Error creating payment intent:", err);
//     res.status(500).send({ error: "Error creating payment intent" });
//   }
// });

// // ✅ Routes
// const productsRouters = require("./routes/Products");
// const categoriesRouter = require("./routes/Categories");
// const brandsRouter = require("./routes/Brands");
// const usersRouter = require("./routes/Users");
// const authRouter = require("./routes/Auth");
// const cartRouter = require("./routes/Cart");
// const ordersRouter = require("./routes/Order");

// server.use("/products", isAuth(), productsRouters.router);
// server.use("/brands", isAuth(), brandsRouter.router);
// server.use("/categories", isAuth(), categoriesRouter.router);
// server.use("/users", isAuth(), usersRouter.router);
// server.use("/auth", authRouter.router);
// server.use("/cart", isAuth(), cartRouter.router);
// server.use("/orders", isAuth(), ordersRouter.router);

// // ✅ DB Connection & Start Server
// main().catch((err) => console.log(err));

// async function main() {
//   await mongoose.connect("mongodb://localhost:27017/ecommerce");
//   console.log("✅ Database connected");

//   server.listen(8080, () => {
//     console.log("✅ Server started on http://localhost:8080");
//   });
// }



// **********************************
// {
//   "builds": [
//     {
//       "src": "index.js",
//       "use": "@vercel/node"
//     },
//     {
//       "src": "build/**",
//       "use": "@vercel/static"
//     }
//   ],

//   "rewrites": [{ "source": "/(.*)", "destination": "index.js" }]
// }

