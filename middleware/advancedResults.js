const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  // copy req.query so we dont modify the query object itself.
  const reqQuery = { ...req.query };

  // Fields (params) to exclude - "select". We want to use this param to select fields we want to diplay in each result (bootcamp). The remaining params can be used for filtering
  // page, limit - for pagination and limiting number of items per page.
  const removeFields = ["select", "sort", "limit", "page"];

  // Loop over removefields and delete them from req query
  removeFields.forEach((param) => delete reqQuery[param]);

  // stringify the query object
  let queryStr = JSON.stringify(reqQuery);

  // gt, gte etc. are mongoose queries to check for greater than, less than etc. Per documentation, those would need to have a $ sign before them to be interpreted correctly.
  // www.mongodb.com/docs/manual/reference/operator/aggregation/filter/
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // finding resource and use the query params to filter
  query = model.find(JSON.parse(queryStr));

  // Fields to select
  if (req.query.select) {
    // From documentation, the "select" values must be space separated (instead of comma, as we get back from req.query) before passing into the mongoose query.
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    // can use multiple params to sort to break ties.
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    // Default sort: the "-" indicates descending order.
    query = query.sort("-createdAt");
  }

  // Pagination
  // 10 is the radix
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit) || 25;
  // number of items to skip so the next items can be displayed correctly on the screen
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  // Populate
  if (populate) {
    query = query.populate(populate);
  }

  const results = await query;

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };

  next();
};

module.exports = advancedResults;
