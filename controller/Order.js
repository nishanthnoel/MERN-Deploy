const { Order } = require("../model/Order");
const { Product } = require("../model/Product");
const { User } = require("../model/User");
const { sendMail, invoiceTemplate } = require("../services/common");

exports.fetchOrdersByUser = async (req, res) => {
  // const { user } = req.query; //old
  const { id } = req.user
  try {
    const orders = await Order.find({ user: id }).populate("user");
    res.status(200).json(orders);
  } catch (err) {
    res.status(400).json(err);
  }
};
// exports.fetchCurrentOrder = async (req, res) => {
//   // const { user } = req.query; //old
//   const { id } = req.user
//   try {
//     const orders = await Order.find({ user: id }).populate("user");
//     res.status(200).json(orders);
//   } catch (err) {
//     res.status(400).json(err);
//   }
// };

exports.createOrder = async (req, res) => {
  const order = new Order(req.body);
  console.log("Order items:", order.items);
  // here we update the stock after the order is placed
  for (let item of order.items) {
    // determine product id (support different shapes)
    const productId =
      (item.product && (item.product.id || item.product._id)) ||
      item.product ||
      item.productId;

    // fetch the product by _id
    const product = await Product.findById(productId);

    // guard: product must exist
    if (!product) {
      return res.status(404).json({ error: `Product not found: ${productId}` });
    }

    // guard: ensure sufficient stock
    if (product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for product ${product.title || productId}` });
    }

    // decrement stock and save
    product.stock = product.stock - item.quantity;
    await product.save();
  }

  try {
    const odr = await order.save();
    const user = await User.findById(order.user);
    sendMail({to: user.email, subject: "Thank you for your order", html: invoiceTemplate(order)});
    // const result = await doc.populate("product");
    res.status(200).json(odr);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByIdAndDelete(id);
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndUpdate(id, req.body, {
      new: true, // it returns the updated document instead of the others.
    });
    // const result = await cart.populate("product");

    // console.log("cart", result)
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.fetchAllOrders = async (req, res) => {
  // let query = Product.find({});
  let query = Order.find(); //ne means not equal to
  let totalOrdersQuery = Order.find(); //another method without using .clone()

  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
    totalOrdersQuery = totalOrdersQuery.sort({
      [req.query._sort]: req.query._order,
    }); // another method without using .clone()
  }

  // because the header  X_Total_Count header isnt present in
  //to find the totalItems for pagination. .count() This line tells Mongoose to count the total number of documents that match the current query (but without actually fetching them), and it returns that count as a number.
  // const totalDocs = await query.clone().countDocuments().exec(); //with clone
  const totalDocs = await totalOrdersQuery.countDocuments().exec(); //another method without using .clone()
  // const totalDocs = await query.count().exec(); //.count() is deprecated in newer Mongoose versions in favor of
  console.log({ totalDocs });

  if (req.query._page && req.query._limit) {
    // const pageSize = req.query._limit
    // const  page = req.query._page
    const pageSize = parseInt(req.query._limit);
    const page = parseInt(req.query._page);
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }
  try {
    const docs = await query.exec();
    res.set("X-Total-Count", totalDocs); //this setting of the header is then used in front end for totalItems
    res.status(200).json(docs); // whe virtuals used this doc to the frontend goes without _
    console.log(docs); // when virtuals used it logs with _
  } catch (err) {
    res.status(400).json(err);
    console.log(err);
  }
};
