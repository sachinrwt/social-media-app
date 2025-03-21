// creating express server 
import express, { urlencoded } from "express";
import dotenv from "dotenv";
import { connect } from "mongoose";
import connectMongoDB from "./db/connectMongoDB.js";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary" ;

import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import postRoutes from "./routes/post.routes.js"
import notificationRoutes from "./routes/notification.routes.js"

//using this we will be able to read 
dotenv.config(); 

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
const PORT= process.env.PORT || 5000;

//Middle layers
app.use(express.json({limit: "10mb"})); //to parse req.body in auth.controllers.js(limit should not be too large 
//otherwise DOS attack is easy on this)
app.use(express.urlencoded({ extended:true })) ; //to parse form data
app.use(cookieParser()) ;

//getting undeffined because we cannot read it(go to line 6 now)
// console.log(process.env.MONGO_URI);

app.use("/api/auth", authRoutes) ;
app.use("/api/users", userRoutes) ;
app.use("/api/posts", postRoutes) ;
app.use("/api/notifications", notificationRoutes) ;


app.listen(PORT,()=>{
    console.log(`Server is running at port: ${PORT}`);
    connectMongoDB()
});
