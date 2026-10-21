import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// Generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Token generation error:", error);

        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(
            500,
            "Something went wrong while generating access and refresh tokens"
        );
    }
};

// REGISTER USER
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (
        [fullName, email, username, password].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    const existedUser = await User.findOne({
        $or: [
            { username: normalizedUsername },
            { email: normalizedEmail }
        ]
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User with this email or username already exists"
        );
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
        throw new ApiError(500, "Avatar upload to Cloudinary failed");
    }

    let coverImage = null;

    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage?.url) {
            throw new ApiError(
                500,
                "Cover image upload to Cloudinary failed"
            );
        }
    }

    const user = await User.create({
        fullName,
        email: normalizedEmail,
        username: normalizedUsername,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if ((!email && !username) || !password) {
        throw new ApiError(
            400,
            "Username or email and password are required"
        );
    }

    const conditions = [];

    if (username) {
        conditions.push({ username: username.toLowerCase() });
    }

    if (email) {
        conditions.push({ email: email.toLowerCase() });
    }

    const user = await User.findOne({ $or: conditions });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});

// LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, {
        $unset: {
            refreshToken: 1
        }
    });

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax"
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logged out successfully"
            )
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

   if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request");     
   }
  try {
    const decodedToken =  jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
     )
  
  
    const user = await User.findById(decodedToken?._id)
  
    if (!user) {
          throw new ApiError(401, "invalid refresh token");     
     }
  
     if(incomingRefreshToken != user?.refreshToken){
      throw new ApiError(401,"Refresh token is expired or used");
      
     }
  
     const options = {
      httpOnly: true,
      secure: true
     }
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newRefreshToken, options)
     .json(
      new ApiResponse(
          200,
          {accessToken, newRefreshToken},
          "Access token refreshed"
      )
     )
  } catch (error) {
    throw new ApiError(401,"invalid refresh token");
    
  }

})
const changeCurrentPassword = asyncHandler(async(req,res) =>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
   const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect)
   {
    throw new ApiError(400,"invalid old password");
    
   }

   user.password = newPassword
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(new ApiResponse(200, {}, "Password changes sucessfully"))
})

const getCurrentUser = asyncHandler(async(req, res) =>{
    return res
    .status(200)
    .json(200, req.user, "current user feetched sucessfully")
})

const updateAccountDetails = asyncHandler(async(req, res) =>{
    const {fullName,email } = req.body
    if(!fullName || !email){
        throw new ApiError(400, "All fields are required");  
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated sucessfully"))
})
    const updateUserAvatar = asyncHandler(async(req, res) =>{
       const avatarLocalPath =  req.file?.path
       if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing");    
       }

       const avatar = uploadOnCloudinary(avatarLocalPath)
       if(!avatar.url){
        throw new ApiError(400," Error while uploading on avatar");
        
       }
     const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar:avatar.url
            }
        },
        {new: true }
       ).select("-password")
       return res
    .status(200)
    .json(
        new ApiResponse(200, user, "avatar updated sucessfully")
    )

    })


    const updateUserCoverImage = asyncHandler(async(req, res) =>{
       const coverImageLocalPath =  req.file?.path
       if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing");    
       }

       const coverImage = uploadOnCloudinary(coverImageLocalPath)
       if(!coverImage.url){
        throw new ApiError(400," Error while uploading on coverImage");
        
       }
       const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true }
       ).select("-password")
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "cover image updated sucessfully")
    )
    })

export { 
    registerUser,
     loginUser, 
     logoutUser, 
     refreshAccessToken,
     changeCurrentPassword, 
     getCurrentUser,
     updateAccountDetails,
     updateUserAvatar,
     updateUserCoverImage
     }
