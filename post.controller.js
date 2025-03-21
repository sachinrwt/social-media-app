import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { v2 as cloudinary } from "cloudinary";
import Notification from "../models/notification.model.js";


export const createPost = async(req, res) => {
    try {
        // Extracting text and img from the request body
        const { text } = req.body;
        let { img } = req.body;

        // Getting the ID of the logged-in user from the request object
        const userId = req.user._id.toString();

        // Finding the user by their ID
        const user = await User.findById(userId);
        if (!user) 
            return res.status(404).json({ message: "User not found!" });

        // Check if the post has at least text or an image
        if (!text && !img) {
            return res.status(400).json({ error: "Post must have text or image!" });
        }

        // If an image is provided, upload it to Cloudinary
        if (img) {
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url; // Save the URL of the uploaded image
        }

        // Creating a new post object with the userId, text, and optional image URL
        const newPost = new Post({
            user: userId,
            text,
            img
        });

        // Saving the new post to the database
        await newPost.save();

        // Sending the newly created post as the response
        res.status(201).json(newPost);
    } catch (error) {
        // Catch any errors and return a server error response
        res.status(500).json({ error: "Internal Server Error!" });
        console.log("Error in createPost controller: ", error);
    }
};

export const deletePost = async(req, res) => {
    try {
        // Find the post by its ID, which is passed in the request parameters
        const post = await Post.findById(req.params.id);
        
        // If post not found, return a 404 error
        if(!post) {
            return res.status(404).json({error: "Post not found!"});
        }

        // Check if the post belongs to the logged-in user by comparing their IDs
        if(post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({error: "You are not authorized to delete this post"});
        }

        // If the post has an associated image, delete it from Cloudinary
        if(post.img) {
            // Extract the image ID from the Cloudinary URL and delete it
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        // Delete the post from MongoDB using its ID
        await Post.findByIdAndDelete(req.params.id);

        // Respond with success message once the post is deleted
        res.status(200).json({message: "Post deleted successfully!"});
    } 
    catch (error) {
        // Log the error to the console and return a 500 status for internal server error
        console.log("Error in deletePost controller", error);
        res.status(500).json({error: "Internal server error"});
    }
}

export const commentOnPost = async(req, res) => {
    try {
        // Extract the text of the comment from the request body
        const { text } = req.body;

        // Extract the postId from the URL parameters and userId from the authenticated user
        const postId = req.params.id;
        const userId = req.user._id;

        // Check if the comment text is missing and return an error
        if (!text) {
            return res.status(400).json({ error: "Text field is required" });
        }

        // Find the post by its ID to ensure it exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        // Create a new comment object with the userId and comment text
        const comment = { user: userId, text };

        // Add the new comment to the comments array in the post
        post.comments.push(comment);

        // Save the updated post with the new comment in the database
        await post.save();

        // Return the updated post, now including the comment, to the client
        res.status(200).json(post);
    } 
    catch (error) {
        // Log any errors that occur to the console
        console.log("Error in commentOnPost controller", error);

        // Return a 500 error response to the client in case of an internal server error
        res.status(500).json({ error: "Internal server error" });
    }
};

export const likeUnlikePost = async(req,res)=>{
    try {
        const userId = req.user._id ;
        const {id: postId} = req.params ;

        const post = await Post.findById(postId) ;

        if(!post){
            return res.status(404).json({error: "post not found !"})
        }

        const userLikedPost = post.likes.includes(userId) ;

        if(userLikedPost){
            //Unlike the post 
            await Post.updateOne({_id:postId},{$pull: {likes: userId}}) ;
            await User.updateOne({_id: userId},{$pull: {likedPosts: postId}}) ;

            const updatedLikes = post.likes.filter((id)=> id.toString() !== userId.toString());

            res.status(200).json({message: " Post unliked successfully!"})
        } else{
            //Like the post
            post.likes.push(userId) ;
            await User.updateOne({_id: userId},{$push: {likedPosts: postId}}) ;
            await post.save() ;

            const notification = new Notification({
                from: userId,
                to: post.user,
                type:"like"
            })

            await notification.save()

            const updatedLikes = post.likes
            res.status(200).json(updatedLikes);
        }
    } 
    catch (error) {
        // Log any errors that occur to the console
        console.log("Error in likeUnlikePost controller", error);

        // Return a 500 error response to the client in case of an internal server error
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getAllPosts = async(req,res)=>{
    try {
        const posts = await Post.find().sort({ createdAt: -1}).populate({
            path:"user",
            select:"-password"
        })
        .populate({
            path:"comments.user",
            select:"-password"
        })


        if(posts.length === 0){
            return res.status(200).json([])
        }

        res.status(200).json(posts)
    } 
    catch (error) {
        // Log any errors that occur to the console
        console.log("Error in getAllPosts controller", error);

        // Return a 500 error response to the client in case of an internal server error
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getLikedPosts = async(req,res)=>{

    const userId = req.params.id ;

    try {
        const user = await User.findById(userId)
        if(!user) return res.status(404).json({error: "User Not Found"})

        const likedPosts = await Post.find({_id: {$in: user.likedPosts}})
        .populate({
            path:"user",
            select:"-password"
        }).populate({
            path:"comments.user",
            select:"-password"
        });

        res.status(200).json(likedPosts)
    } 
    catch (error) {
        // Log any errors that occur to the console
        console.log("Error in getLikedPosts controller", error);

        // Return a 500 error response to the client in case of an internal server error
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getFollowingPosts = async(req,res)=>{
    try {
        const userId = req.user._id ;
        const user = await User.findById(userId) ;
        
        if(!user) return res.status(404).json({error: "User not found!"}) ;

        const following = user.following ;

        const feedPosts = await Post.find({user: {$in: following}}).sort(({createdAt: -1}))
        .populate({
            path:"user",
            select:"-password"
        })
        .populate({
            path:"comments.user",
            select:"-password"
        }) ;

        res.status(200).json(feedPosts) ;
    } 
    catch (error) {
        // Log any errors that occur to the console
        console.log("Error in getFollowingPosts controller", error);

        // Return a 500 error response to the client in case of an internal server error
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getUserPosts = async(req, res) => {
    try {
        const { username } = req.params;

        // Find the user by username
        const user = await User.findOne({ username });

        // If the user is not found, return a 404 error
        if (!user) return res.status(404).json({ error: "User not found!" });

        // Fetch posts created by the user, sorted by the latest
        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",   // Correct 'users' to 'user'
                select: "-password"
            })
            .populate({
                path: "comments.user",  // Correct 'comments.users' to 'comments.user'
                select: "-password"
            });

        // Return the user's posts as the response
        res.status(200).json(posts);
    } catch (error) {
        // Log any errors that occur in the console
        console.log("Error in getUserPosts controller", error);

        // Return a 500 error response to the client in case of an internal server error
        res.status(500).json({ error: "Internal server error" });
    }
};

