import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
// import validator from "validator";


// This code defines a signup function that handles user registration, including input validation, checking if the user or email already exists, hashing the password, and saving the new user to the database.
export const signup = async(req,res) =>{
    try{
        // User ke form se fullName, username, email aur password ko request body se extract kar rahe hain
        const {fullName, username, email, password} = req.body ;

         // Email format check karne ke liye regular expression bana rahe hain
        const emailRegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ ;
        //const emailRegExp = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;


        // Agar email format galat hai toh error response return karo
        if(!emailRegExp.test(email)){
            return res.status(400).json({error:"Invalid Email Format"});
        }

        // Check karo agar username pehle se database mein hai toh error return karo
        const existingUser = await User.findOne({username});
        if(existingUser){
            return res.status(400).json({error:"Username already taken"});
        }

        // Check karo agar email pehle se database mein hai toh error return karo
        const existingEmail = await User.findOne({email});
        if(existingEmail){
            return res.status(400).json({error:"Email already taken"});
        }

        if(password.length < 6){
            return res.status(400).json({error:"Password must be atleast 6 characters long"});
        }

        // Password ko securely hash karne ke liye salt generate kar rahe hain
        // A salt is a random value added to a password before it’s hashed. It’s used to enhance the security of hashed passwords. Even if two users have the same password, adding a unique salt to each password will result in different hashes, making it harder for attackers to crack passwords using precomputed databases of hashes
        const salt = await bcrypt.genSalt(10);
        // Password ko hash karke securely store karne ke liye ready kar rahe hain
        const hashedPassword = await bcrypt.hash(password, salt);

        // Naya user object create kar rahe hain jo database mein save hoga
        const newUser = new User({
            // fullName: fullName,
            // username:username,
            // email:email,
            fullName,
            username,
            email,
            password: hashedPassword
        })

        if(newUser){
            //A cookie is a small piece of data that a server sends to the user's browser. The browser stores this data, and every time the user makes a request to the server, the cookie is sent along with it. Cookies are typically used to remember information about the user, such as session information, user preferences, or authentication data.
            generateTokenAndSetCookie(newUser._id,res) ;
            await newUser.save() ;  //// Naye user ko database mein save karte hain

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                username: newUser.username,
                email: newUser.email,
                following: newUser.following,
                followers: newUser.followers,
                profileImg: newUser.profileImg,
                coverImg: newUser.coverImg,
            })

        } else{
            res.status(400).json({error:"Invalid user data !!"})
        }

    } catch(error){
        console.log("Error in signup controller", error.message) ;

        res.status(500).json({error:"Internal Server Error!!"}) ;
    }
};

//These functions are marked as async because in a real-world scenario, they'll likely be dealing with asynchronous operations, such as database interactions (e.g., saving a new user or verifying login credentials).

export const login = async(req,res) =>{
    try{
        const {username,password} = req.body ;
        const user = await User.findOne({username}) ;

        const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")

        if(!user || !isPasswordCorrect){
            return res.status(400).json({error: "Invalid Username or Password"})
        }

        generateTokenAndSetCookie(user._id, res);

        res.status(200).json({
            _id : user._id,
            fullName : user.fullName,
            username : user.username,
            email : user.email,
            followers : user.followers,
            following : user.following,
            profileImg : user.profileImg,
            coverImg : user.coverImg,
        });

    } catch(error){
        console.log("Error in login controller", error.message) ;

        res.status(500).json({error:"Internal Server Error!!"}) ;
    }
};

export const logout = async(req,res) =>{
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({message:"Loged out successfully!"})
        console.log("hello")

    } catch(error){
        console.log("Error in logout controller", error.message) ;
        res.status(500).json({error:"Internal Server Error!"}) ;
    }
};


export const  getMe = async (req, res) =>{
    try{
        const user = await User.findById(req.user._id).select("-password") ;
        res.status(200).json(user) ;
    } catch(error){
        console.log("Error in getMe controller", error.message) ;
        res.status(500).json({error:"Internal Server Error!"}) ;
    }
}