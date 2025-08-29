const { User } = require("../model/User");

// exports.createUser = async (req, res) => {
//   const user = new User(req.body);
//   try {
//     const docs = await user.save();
//     res.status(201).json(docs); // whe virtuals used this doc to tge frontend goes without _
//     console.log(docs); // when virtuals used it logs with _
//   } catch (err) {
//     res.status(400).json(err);
//     console.log(err);
//   }
// };

exports.fetchUserById = async (req, res) => {
  res.set('Cache-Control', 'no-store'); //this was added for problem faced for fetchinh userInfo
  const { id } = req.user;

  try {
    const user = await User.findById(id);
 
    res.status(200).json({id: user.id, addresses:user.addresses, role: user.role, email:user.email});
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(user);
  } catch (err) {
    res.status(400).json(err);
  }
};
