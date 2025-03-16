import mongoose from "mongoose";
import colors from "colors";
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.DEV_MODE === 'test' ? process.env.MONGO_URL_TEST : process.env.MONGO_URL);
        console.log(`Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white);
    } catch (error) {
        console.log(`Error in Mongodb ${error}`.bgRed.white);
    }
};

export default connectDB;