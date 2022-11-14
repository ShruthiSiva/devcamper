class ErrorResponse extends Error {
  constructor(message, statusCode) {
    // first call the constructor of the Error class
    super(message);

    this.statusCode = statusCode;
  }
}

module.exports = ErrorResponse;
