const passport = require("passport");
// exports.isAuth = (req, res, next)=> {
//   if (req.user) {
//     // done();
//     next();
//   } else {
//     res.send(401);


exports.isAuth = (req, res, next) => {
  return passport.authenticate("jwt", { session: false });
};

// exports.isAuth = passport.authenticate('jwt', { session: false });   
exports.sanitizeUser = (user) => {
  return { id: user.id, role: user.role };
};

exports.cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies["jwt"]; // or whatever your cookie name is
  }
  console.log("Token from cookie:", token);
  // token =
  //   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzY0NWY2NmE3YTRiMTYxNzA2NWEyMyIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzUyNTkxNzc3fQ.km8eYWoGzi6FNZ7ansGMoNc3oeVtT71_aY2lQQldzqc";
  return token;
};
