import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

// MODELS
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
// import router from "../routes/user.routes.js"; 

export const getUserProfile = async(req, res) => {
    //In Express.js, req.params is an object that contains route parameters from the URL. These parameters are placeholders defined in the route that can be dynamic, like :username, which can change based on the request.
    const {username} = req.params ;

    try {
        const user = await User.findOne({username}).select("-password") ;
        if(!user){
            return res.status(400).json({message: "User not found"}) ;
        }
        res.status(200).json(user) ;
    } catch (error) {
        console.log("Error in getUserProfile :", error.message) ;
        res.status(500).json({error: error.message}) ;
    }
};

export const followUnfollowUser = async(req, res) => {
    try {
        const { id } = req.params;
        const userToModify = await User.findById(id);
        const currentUser = await User.findById(req.user._id);

        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You can't follow or unfollow yourself" });
        }

        if (!userToModify || !currentUser) {
            return res.status(404).json({ error: "User not found!" });
        }

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

            //TODO: return the id of the user as a response
            return res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

            // Send notification (placeholder for actual implementation)
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id,
            })

            await newNotification.save();

            //TODO: return the id of the user as a response
            return res.status(200).json({ message: "User followed successfully" });
        }

    } catch (error) {
        console.log("Error in followUnfollowUser:", error.message);
        return res.status(500).json({ error: error.message });
    }
};

//this function can be optimized
export const getSuggestedUsers = async (req, res) => {
    try {
        // Yeh user ka ID request se le raha hai jo authenticate ho chuka hai
        const userId = req.user._id;

        // Yeh un users ki list laata hai jinko aap follow karte ho
        const usersFollowedByMe = await User.findById(userId).select("following");

        // Yeh aggregate function MongoDB se un users ko select karta hai jo aap nahi ho (aap ke alawa sab)
        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId },  // userid ki jagah userId likha hai. Ye aapki ID se match nahi honi chahiye
                },
            },
            { $sample: { size: 10 } },  // Random 10 users nikalta hai
        ]);

        // Filter karta hai users jinko aap follow nahi kar rahe ho
        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));

        // Sirf pehle 4 users ko select karta hai jo suggested list me dikhaye jayenge
        const suggestedUsers = filteredUsers.slice(0, 4);

        // Password ko null kar deta hai taaki wo exposed na ho
        suggestedUsers.forEach((user) => user.password = null);

        // Suggested users ka response bhejta hai
        return res.status(200).json(suggestedUsers);
    } 
    catch (error) {
        // Error ko console pe aur response me dikhata hai
        console.log("Error in getSuggestedUsers: ", error.message);
        return res.status(500).json({ error: error.message });
    }
};


export const updateUser = async (req, res) => {
    // Extracting fields from the request body. These represent the user's updated information.
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body; // Images will be handled separately

    const userId = req.user._id; // Get the authenticated user's ID

    try {
        // Fetch the current user from the database using their ID
        let user = await User.findById(userId);
        if (!user) {
            // If no user is found, return a 404 error
            return res.status(404).json({ message: "User not found!" });
        }

        // Check if both currentPassword and newPassword are provided for a password change
        if ((!currentPassword && newPassword) || (!newPassword && currentPassword)) {
            return res.status(400).json({ error: "Please provide both current password and new password" });
        }

        // If both passwords are provided, we proceed with updating the password
        if (currentPassword && newPassword) {
            // Verify if the current password matches the user's stored password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                // Return an error if the current password is incorrect
                return res.status(400).json({ error: "Current password is incorrect" });
            }

            // Ensure the new password is at least 6 characters long
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "Password must be at least 6 characters long" });
            }

            // Hash the new password and store it in the user's document
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Check if the user wants to update their profile image
        if (profileImg) {
            // If the user already has a profile image, delete it from Cloudinary
            if (user.profileImg) {
                // https://res.cloudinary.com/dsfds/image/upload/v7272992/dfakfnsblsjdba.png and we want last past of this link
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
            }

            // Upload the new profile image to Cloudinary
            const uploadedResponse = await cloudinary.uploader.upload(profileImg);
            // Store the secure URL of the uploaded image
            profileImg = uploadedResponse.secure_url;
        }

        // Check if the user wants to update their cover image
        if (coverImg) {
            // If the user already has a cover image, delete it from Cloudinary
            if (user.coverImg) {
                // https://res.cloudinary.com/dsfds/image/upload/v7272992/dfakfnsblsjdba.png and we want last past of this link
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }

            // Upload the new cover image to Cloudinary
            const uploadedResponse = await cloudinary.uploader.upload(coverImg);
            // Store the secure URL of the uploaded image
            coverImg = uploadedResponse.secure_url;
        }

        // Update the user's details with the new data, but keep the old data if no new value is provided
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        // Save the updated user object to the database
        user = await user.save();

        // Set the password to null before sending the user data in the response, ensuring it isn't leaked
        user.password = null;

        // Return the updated user data
        return res.status(200).json(user);
    } 
    catch (error) {
        // If an error occurs, log it and send a 500 status code with the error message
        console.log("Error in update user: ", error.message);
        res.status(500).json({ error: error.message });
    }
};







