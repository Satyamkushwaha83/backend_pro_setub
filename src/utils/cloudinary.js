import {v2 as cloudinary} from "cloudinary"
import console from "console";
import dotenv from "dotenv";
import fs from "fs"



    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
    

 const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
            const response = await  cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        // console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.error("Cloudinary upload failed:", error.message);
        console.error("Cloudinary error code:", error.http_code);
        return null;
    }
 }
 export {uploadOnCloudinary}
