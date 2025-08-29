const { Product } = require("../model/Product");

// exports.createProduct = (req, res) => {
//   const product = new Product(req.body);
//   product.save((err, doc) => {
//     console.log({ err, doc });
//     if (err) {
//       res.status(400).json(err);
//     } else {
//       res.status(200).json(doc);
//     }
//   });
// };
// above the mongoose 7  version we use asyn awai approach
// exports.createProduct = async(req, res) => {
//   const product = new Product(req.body);
//   const response = await product.save();
//   console.log(response)
// };

// sending a response after success or error
exports.createProduct = async (req, res) => {
  const product = new Product(req.body);
  try {
    const docs = await product.save();
    res.status(201).json(docs); // whe virtuals used this doc to tge frontend goes without _
    console.log(docs); // when virtuals used it logs with _
  } catch (err) {
    res.status(400).json(err);
    console.log(err);
  }
};
exports.fetchAllProducts = async (req, res) => {
  //TODO: we have to try with multiple categories and brands
  //TODO: to get sorting using discountedPrice
  // let query = Product.find({}); 
  let condition ={  }
  if(!req.query.admin){
    condition.deleted = {$ne:true}
  }
  let query = Product.find(condition);   //ne means not equal to 
  let totalProductsQuery = Product.find(condition); //another method without using .clone()

  if (req.query.category) {
    query = query.find({ category: req.query.category });
    totalProductsQuery = totalProductsQuery.find({
      category: req.query.category,
    }); //another method without using .clone()
  }
  if (req.query.brand) {
    query = query.find({ brand: req.query.brand });
    totalProductsQuery = totalProductsQuery.find({ brand: req.query.brand }); // another method without using .clone()
  }
  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
    totalProductsQuery = totalProductsQuery.sort({
      [req.query._sort]: req.query._order,
    }); // another method without using .clone()
  }

  // because the header  X_Total_Count header isnt present in
  //to find the totalItems for pagination. .count() This line tells Mongoose to count the total number of documents that match the current query (but without actually fetching them), and it returns that count as a number.
  // const totalDocs = await query.clone().countDocuments().exec(); //with clone
  const totalDocs = await totalProductsQuery.countDocuments().exec(); //another method without using .clone()
  // const totalDocs = await query.count().exec(); //.count() is deprecated in newer Mongoose versions in favor of
  // console.log({ totalDocs });

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
    // console.log(docs); // when virtuals used it logs with _
  } catch (err) {
    res.status(400).json(err);
    console.log(err);
  }
};

// Product.find({ category: 'phone', brand: 'samsung' })
//        .sort({ price: 1 })
//        .skip(5)
//        .limit(5)
//        .exec()

//pagination
//if page 3
// Product.find()
//   .skip(10)  // skips first 10 items (page 1 and 2)
//   .limit(5)  // returns next 5 items (items 11 to 15)
//   .exec();

exports.fetchProductsById = async (req, res) => {
  // const { id } = req.user;
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findByIdAndUpdate(id, req.body, {new:true});
    // { new: true } By default, Mongoose returns the old document before the update.This option tells Mongoose: "Give me the updated product instead."
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json(err);
  }
};
