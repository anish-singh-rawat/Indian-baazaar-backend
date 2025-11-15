import HomeSliderModel from "../models/homeSlider.modal.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { getCache, setCache, delCache } from '../utils/redisUtil.js';

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

export async function addHomeSlide(request, response) {
  try {
    let slide = new HomeSliderModel({
      images: request.body.images,
    });
    console.log("request.body : ", request.body.images);

    if (!slide) {
      return response.status(500).json({
        message: "slide not created",
        error: true,
        success: false,
      });
    }

    slide = await slide.save();
    imagesArr = [];

    // Invalidate home slides cache
    await delCache('home_slides');

    return response.status(200).json({
      message: "Slide created",
      error: false,
      success: true,
      slide: slide,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getHomeSlides(request, response) {
  try {
    const cacheKey = 'home_slides';
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return response.status(200).json(cachedData);
    }
    const slides = await HomeSliderModel.find();

    if (!slides) {
      return response.status(404).json({
        message: "slides not found",
        error: true,
        success: false,
      });
    }
    const responseData = {
      error: false,
      success: true,
      data: slides,
    };
    await setCache(cacheKey, responseData);
    return response.status(200).json(responseData);
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getSlide(request, response) {
  try {
    const slide = await HomeSliderModel.findById(request.params.id);

    if (!slide) {
      response.status(500).json({
        message: "The slide with the given ID was not found.",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      slide: slide,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
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

export async function deleteSlide(request, response) {
  try {
    const slide = await HomeSliderModel.findById(request.params.id);
    if (!slide) {
      return response
        .status(404)
        .json({ message: "slide not found!", success: false, error: true });
    }

    const images = slide.images || [];
    for (const img of images) {
      const imgUrl = img;
      const urlArr = imgUrl.split("/");
      const image = urlArr[urlArr.length - 1];

      const imageName = image.split(".")[0];

      if (imageName) {
        cloudinary.uploader.destroy(imageName, (error, result) => {
          console.log("Cloudinary Upload Error: ", error);
          if (error) {
            return response.status(500).json({
              message: error.message || error,
              error: true,
              success: false,
            });
          }
          console.log("result: ", result);
        });
      }
    }

    await HomeSliderModel.deleteOne({ _id: request.params.id });
    // Invalidate home slides cache
    await delCache('home_slides');

    return response.status(200).json({ message: "Slide deleted", success: true, error: false });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
}

export async function updatedSlide(request, response) {
  try {
    const slide = await HomeSliderModel.findByIdAndUpdate(
      request.params.id,
      {
        images: imagesArr.length > 0 ? imagesArr[0] : request.body.images,
      },
      { new: true }
    );

    if (!slide) {
      return response.status(500).json({
        message: "slide cannot be updated!",
        success: false,
        error: true,
      });
    }

    imagesArr = [];

    return response.status(200).json({
      error: false,
      success: true,
      slide: slide,
      message: "slide updated successfully",
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
}

//delete multiple
export async function deleteMultipleSlides(request, response) {
  try {
    const { ids } = request.body;

    if (!ids || !Array.isArray(ids)) {
      return response
        .status(400)
        .json({ error: true, success: false, message: "Invalid input" });
    }

    for (let i = 0; i < ids?.length; i++) {
      const slide = await HomeSliderModel.findById(ids[i]);
      if (!slide) continue;

      const images = slide.images || [];

      for (const img of images) {
        const imgUrl = img;
        const urlArr = imgUrl.split("/");
        const image = urlArr[urlArr.length - 1];

        const imageName = image.split(".")[0];

        if (imageName) {
          cloudinary.uploader.destroy(imageName, (error, result) => {
            console.log("Cloudinary Upload Error: ", error);
            if (error) {
              return response.status(500).json({
                message: error.message || error,
                error: true,
                success: false,
              });
            }
            console.log("result: ", result);
          });
        }
      }
    }

    await HomeSliderModel.deleteMany({ _id: { $in: request.body.ids } });
    return response.status(200).json({
      message: "slide delete successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
}
