module.exports = (res, err) => {
    res.status(500).json({
        error: {
            ...err,
            message: err.message
        }
    })
}