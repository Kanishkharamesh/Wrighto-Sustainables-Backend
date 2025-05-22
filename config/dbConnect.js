// const {default: mongoose} = require("mongoose")

// const dbConnect = () => {
//     try{
//         const conn= mongoose.connect(process.env.MONGODB_URL);
//         console.log("Database connected successfully");
//     }
//     catch(error){
//         console.log("Database error");
//     }
// };

// module.exports = dbConnect;

const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
};

module.exports = dbConnect;
