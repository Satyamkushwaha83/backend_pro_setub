import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    console.log("Email:", email);

    // 1. Validate required fields
    if (
        [fullName, email, username, password].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // 2. Check whether the user already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User with this email or username already exists"
        );
    }
    // console.log(req.files)

    // 3. Get uploaded file paths
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // console.log("Uploaded files:", req.files);

    // 4. Avatar is required
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 5. Upload avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar || !avatar.url) {
        throw new ApiError(400, "Avatar upload to Cloudinary failed");
    }

    // 6. Upload cover image only if provided
    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    if (coverImageLocalPath && (!coverImage || !coverImage.url)) {
        throw new ApiError(400, "Cover image upload to Cloudinary failed");
    }

    // 7. Create user in MongoDB
    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    // 8. Fetch created user without sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

<<<<<<< HEAD
    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    // 9. Send success response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});

export { registerUser };
=======
const avatarLocalPath = req.files?.avatar[0]?.path;
if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar  file is required!");
   }
const avatar = await uploadOnCloudinary(avatarLocalPath);
if (!avatar || !avatar.secure_url) {
    throw new ApiError(501, "Avatar upload to Cloudinary failed!");
}
console.log(avatar.url);

 
let coverImageLocalPath; 
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
   coverImageLocalPath = req.files.coverImage[0].path
} 
const coverImage = await uploadOnCloudinary(coverImageLocalPath);


const user = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
   email,
   password,
   username: username.toLowerCase()
})
const createdUser = await User.findById(user._id).select(
"-password -refreshToken"
)
if(!createdUser){
  throw new ApiError(500, "Something went wrong while registering the user")
}

return res.status(201).json(
  new ApiResponse(200, createdUser, "User registered Sucessfully")
)
})
//we can also create this type
// if (fullName === "") {
//     throw new ApiError(400, " fullname is required")
// }

export { registerUser };
>>>>>>> f2bc271ab7a03768531eec694cef192573073ea7
