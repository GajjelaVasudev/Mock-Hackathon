function errorHandler(err, req, res, next) {
    console.error(err);

    if (err.name === 'CastError') {
        return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    }
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    if (err.code === 11000) {
        return res.status(409).json({ message: 'That already exists' });
    }

    res.status(500).json({ message: 'Something went wrong. Please try again.' });
}
module.exports = errorHandler;