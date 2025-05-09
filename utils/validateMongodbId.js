const mongoose = require ('mongoose')
const validateMongoDbId = (id) => {
    const isValid = mongoose.Types.ObjectId.isValid(id);
    if(!isValid) throw new Error('This is is not valid ornot found');
};
module.exports = validateMongoDbId;