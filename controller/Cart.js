const { Cart } = require("../model/Cart");

exports.fetchCartByUser = async (req, res) => {
  // const {id} =  req.body.params
  // const { user } = req.query; // we can get the req.user using token in the backend no need give it in the front end.  
  const { id } = req.user;// this takes the user from req.user thatr the rtoken 
  try {
    const cartItems = await Cart.find({ user: id })
      .populate("user")
      .populate("product");
    res.status(200).json(cartItems);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.addToCart = async (req, res) => {
  //we are not sending user id from the front wend rather we are getting  id from backend user
  const {id} = req.user
  const cart = new Cart({...req.body, user:id});
  try {
    const doc = await cart.save();
    // console.log("thedoc",doc)
    const result = await doc.populate("product");
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteFromCart = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await Cart.findByIdAndDelete(id);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateCart = async (req, res) => {
  const { id } = req.params;
  try {
    const cart = await Cart.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    const result = await cart.populate("product");

    console.log("cart", result)
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json(err);
  }
};
