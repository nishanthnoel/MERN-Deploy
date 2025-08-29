const { Order } = require("../model/Order");

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
  try {
    const doc = await order.save();
    // const result = await doc.populate("product");
    res.status(200).json(doc);
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
  //TODO: we have to try with multiple categories and brands
  //TODO: to get sorting using discountedPrice
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
