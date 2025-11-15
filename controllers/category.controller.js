import CategoryModel from "../models/category.modal.js";
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

//create category
export async function createCategory(request, response) {
  try {
    let category = new CategoryModel({
      name: request.body.name,
      images: request.body.images,
      parentId: request.body.parentId,
      parentCatName: request.body.parentCatName,
    });
    console.log("request.body : category", request.body.images);

    if (!category) {
      return response.status(500).json({
        message: "Category not created",
        error: true,
        success: false,
      });
    }

    category = await category.save();
    imagesArr = [];

    // Invalidate categories cache
    await delCache('categories');

    return response.status(200).json({
      message: "Category created",
      error: false,
      success: true,
      category: category,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get Categories
export async function getCategories(request, response) {
  try {
    const cacheKey = 'categories';
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return response.status(200).json(cachedData);
    }
    const categories = await CategoryModel.find();
    const categoryMap = {};

    categories.forEach((cat) => {
      categoryMap[cat._id] = { ...cat._doc, children: [] };
    });

    const rootCategories = [];

    categories.forEach((cat) => {
      if (cat.parentId) {
        categoryMap[cat.parentId]?.children.push(categoryMap[cat._id]);
      } else {
        rootCategories.push(categoryMap[cat._id]);
      }
    });

    const responseData = {
      error: false,
      success: true,
      data: rootCategories,
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

//get category count
export async function getCategoriesCount(request, response) {
  try {
    const categoryCount = await CategoryModel.countDocuments({
      parentId: undefined,
    });
    if (!categoryCount) {
      response.status(500).json({ success: false, error: true });
    } else {
      response.send({
        categoryCount: categoryCount,
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get sub category count
export async function getSubCategoriesCount(request, response) {
  try {
    const categories = await CategoryModel.find();
    if (!categories) {
      response.status(500).json({ success: false, error: true });
    } else {
      const subCatList = [];
      for (let cat of categories) {
        if (cat.parentId !== undefined) {
          subCatList.push(cat);
        }
      }

      response.send({
        SubCategoryCount: subCatList.length,
      });
    }
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get single category

export async function getCategory(request, response) {
  try {
    const category = await CategoryModel.findById(request.params.id);

    if (!category) {
      response.status(500).json({
        message: "The category with the given ID was not found.",
        error: true,
        success: false,
      });
    }

    return response.status(200).json({
      error: false,
      success: true,
      category: category,
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

export async function deleteCategory(request, response) {
  try {
    const category = await CategoryModel.findById(request.params.id);
    if (!category) {
      return response
        .status(404)
        .json({ message: "Category not found!", success: false, error: true });
    }

    const images = category.images || [];
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

    const subCategory = await CategoryModel.find({
      parentId: request.params.id,
    });

    for (let i = 0; i < subCategory.length; i++) {
      const thirdsubCategory = await CategoryModel.find({
        parentId: subCategory[i]._id,
      });

      for (let j = 0; j < thirdsubCategory.length; j++) {
        await CategoryModel.findByIdAndDelete(thirdsubCategory[j]._id);
      }

      await CategoryModel.findByIdAndDelete(subCategory[i]._id);
    }

    const deletedCat = await CategoryModel.findByIdAndDelete(request.params.id);
    if (!deletedCat) {
      return response.status(404).json({
        message: "Category not deleted!",
        success: false,
        error: true,
      });
    }

    // Invalidate categories cache
    await delCache('categories');

    return response
      .status(200)
      .json({ success: true, error: false, message: "Category Deleted!" });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
}

export async function updatedCategory(request, response) {
  try {
    const category = await CategoryModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
        images: imagesArr.length > 0 ? imagesArr[0] : request.body.images,
        parentId: request.body.parentId,
        parentCatName: request.body.parentCatName,
      },
      { new: true }
    );

    if (!category) {
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
      category: category,
      message: "Category updated successfully",
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
}
