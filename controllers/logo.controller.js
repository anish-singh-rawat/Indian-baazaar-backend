import LogoModel from "../models/logo.model.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

//image upload
var imagesArr = [];
export async function uploadImages(request, response) {
  try {
    imagesArr = [];

    const image = request.files;

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: false,
    };

    for (let i = 0; i < image?.length; i++) {
      await cloudinary.uploader.upload(
        image[i].path,
        options,
        function (error, result) {
          console.log("error : ", error);
          if (error) {
            console.log("Cloudinary Upload Error: ", error);
            return response.status(500).json({
              message: error.message || error,
              error: true,
              success: false,
            });
          }
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${request.files[i].filename}`);
        }
      );
    }

    return response.status(200).json({
      images: imagesArr,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//add logo
export async function addLogo(request, response) {
  try {
    console.log("request.body : ", request.body.logo);
    let logoItem = new LogoModel({
      logo: request.body.logo[0] || request.body.logo,
    });

    if (!logoItem) {
      return response.status(500).json({
        message: "Logo not added",
        error: true,
        success: false,
      });
    }

    logoItem = await logoItem.save();

    imagesArr = [];

    return response.status(200).json({
      message: "logo added",
      error: false,
      success: true,
      logo: logoItem,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get logo
export async function getLogo(request, response) {
  try {
    const logo = await LogoModel.find();

    if (!logo) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      logo: logo,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getLogoById(request, response) {
  try {
    const logo = await LogoModel.findById(request.params.id);

    if (!logo) {
      response.status(500).json({
        message: "The logo with the given ID was not found.",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      logo: logo,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function updatedLogo(request, response) {
  try {
    const logo = await LogoModel.findByIdAndUpdate(
      request.params.id,
      {
        logo: imagesArr.length > 0 ? imagesArr[0] : request.body.logo,
      },
      { new: true }
    );

    if (!logo) {
      return response.status(500).json({
        message: "logo cannot be updated!",
        success: false,
        error: true,
      });
    }

    imagesArr = [];

    return response.status(200).json({
      error: false,
      success: true,
      logo: logo,
      message: "logo updated successfully",
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
}

export async function removeImageFromCloudinary(request, response) {
  try {
    const imgUrl = request.query.img;
    if (!imgUrl) {
      return response.status(400).json({
        message: "img query param is required",
        error: true,
        success: false,
      });
    }

    const urlArr = imgUrl.split("/");
    const image = urlArr[urlArr.length - 1];

    const imageName = image.split(".")[0];

    if (imageName) {
      const res = await cloudinary.uploader.destroy(
        imageName,
        (error, result) => {
          console.log("Cloudinary Upload Error: ", error);
          if (error) {
            return response.status(500).json({
              message: error.message || error,
              error: true,
              success: false,
            });
          }
          console.log("result: ", result);
        }
      );

      if (res) {
        return response.status(200).send(res);
      }
    }

    return response
      .status(404)
      .json({ message: "Image not found", error: true, success: false });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
}
