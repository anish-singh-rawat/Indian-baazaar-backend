import BlogModel from "../models/blog.model.js";
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

//add blog
export async function addBlog(request, response) {
  try {
    let blog = new BlogModel({
      title: request.body.title,
      images: request.body.images,
      description: request.body.description,
    });

    console.log("request.body.images : ", request.body.images);

    if (!blog) {
      return response.status(500).json({
        message: "blog not created",
        error: true,
        success: false,
      });
    }

    blog = await blog.save();

    imagesArr = [];

    // Invalidate blogs cache
    await delCache('blogs');

    return response.status(200).json({
      message: "blog created",
      error: false,
      success: true,
      blog: blog,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getBlogs(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage);
    const cacheKey = `blogs_page_${page}_perPage_${perPage}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return response.status(200).json(cachedData);
    }
    const totalPosts = await BlogModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);

    if (page > totalPages) {
      return response.status(404).json({
        message: "Page not found",
        success: false,
        error: true,
      });
    }

    const blogs = await BlogModel.find()
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();

    if (!blogs) {
      response.status(500).json({
        error: true,
        success: false,
      });
    }

    const responseData = {
      error: false,
      success: true,
      blogs: blogs,
      totalPages: totalPages,
      page: page,
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

export async function getBlog(request, response) {
  try {
    const blog = await BlogModel.findById(request.params.id);

    if (!blog) {
      response.status(500).json({
        message: "The blog with the given ID was not found.",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      blog: blog,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteBlog(request, response) {
  try {
    const blog = await BlogModel.findById(request.params.id);
    if (!blog) {
      return response.status(404).json({
        message: "blog not found!",
        success: false,
        error: true,
      });
    }

    const images = blog.images || [];
    let img = "";
    for (img of images) {
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
    const deletedBlog = await BlogModel.findByIdAndDelete(request.params.id);
    if (!deletedBlog) {
      return response.status(404).json({
        message: "blog not found!",
        success: false,
        error: true,
      });
    }
    // Invalidate blogs cache (all pages)
    // You may want to use a pattern to delete all blog cache keys, but here is a simple key
    await delCache('blogs');
    return response.status(200).json({ message: "Blog deleted", success: true, error: false });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function updateBlog(request, response) {
  try {
    const blog = await BlogModel.findByIdAndUpdate(
      request.params.id,
      {
        title: request.body.title,
        description: request.body.description,
        images: imagesArr.length > 0 ? imagesArr[0] : request.body.images,
      },
      { new: true }
    );

    if (!blog) {
      return response.status(500).json({
        message: "Category cannot be updated!",
        success: false,
        error: true,
      });
    }

    imagesArr = [];

    return response.status(200).json({
      error: false,
      success: true,
      blog: blog,
      message: "blog updated successfully",
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
