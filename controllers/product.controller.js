import ProductModel from "../models/product.modal.js";
import { getCache, setCache, delCache } from "../utils/redisUtil.js";
import ProductRAMSModel from "../models/productRAMS.js";
import ProductWEIGHTModel from "../models/productWEIGHT.js";
import ProductSIZEModel from "../models/productSIZE.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
import { buildRoleBasedFilter, canModifyResource } from "../utils/roleFilters.js";
dotenv.config();

import { createNotificationForAllUsers } from '../utils/notification.service.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
          if (error) {
            console.log("Cloudinary Upload Error: ", error);
            return response.status(500).json({
              message: error.message || error,
              error: true,
              success: false,
            });
          }
          console.log("error : ", error);
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

var bannerImage = [];
export async function uploadBannerImages(request, response) {
  try {
    bannerImage = [];
    console.log("request.files : ", request.files);
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
          bannerImage.push(result.secure_url);
          fs.unlinkSync(`uploads/${request.files[i].filename}`);
        }
      );
    }

    return response.status(200).json({
      images: bannerImage,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//create product
export async function createProduct(request, response) {
  try {
    let product = new ProductModel({
      name: request.body.name,
      description: request.body.description,
      images: request.body.images,
      bannerimages: bannerImage,
      bannerTitleName: request.body.bannerTitleName,
      isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
      brand: request.body.brand,
      price: request.body.price,
      oldPrice: request.body.oldPrice,
      catName: request.body.catName,
      category: request.body.category,
      catId: request.body.catId,
      subCatId: request.body.subCatId,
      subCat: request.body.subCat,
      thirdsubCat: request.body.thirdsubCat,
      thirdsubCatId: request.body.thirdsubCatId,
      countInStock: request.body.countInStock,
      rating: request.body.rating || 0,
      isFeatured: request.body.isFeatured,
      discount: request.body.discount,
      productRam: request.body.productRam,
      size: request.body.size,
      productWeight: request.body.productWeight,
      createdBy: request.userId, // Track who created this product
    });

    product = await product.save();

    if (!product) {
      return response.status(500).json({
        error: true,
        success: false,
        message: "Product Not created",
      });
    }

    // Reset imagesArr used by upload endpoint
    imagesArr = [];
    // Invalidate related product caches
    await delCache('products:all*');
    await delCache('products:catId*');
    await delCache('products:cat:all*');
    await delCache('products:catName*');
    await delCache('products:subCatId*');
    await delCache('products:subCatName*');
    await delCache('products:thirdsubCatId*');
    await delCache('products:thirdsubCatName*');
    await delCache('products:price*');
    await delCache('products:rating*');
    await delCache('products:count');
    await delCache('products:featured');
    await delCache('products:banners');
    await delCache('products:filters*');
    await delCache('products:search*');
    // Create a notification for every user about this new product. Do not block response on failures.
    try {
      await createNotificationForAllUsers(product);
    } catch (e) {
      console.error('Notification creation failed:', e);
    }
    return response.status(200).json({ message: "Product Created successfully", error: false, success: true, product: product });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//get all products
export async function getAllProducts(request, response) {
  try {
    const { page, limit } = request.query;
    const filter = buildRoleBasedFilter(request.user, {});
    const cacheKey = `products:all:${JSON.stringify(filter)}:page:${page}:limit:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalProducts = await ProductModel.find(filter);
    const products = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await ProductModel.countDocuments(filter);
    if (!products) {
      return response.status(400).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCount: totalProducts?.length,
      totalProducts: totalProducts,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products by category id
export async function getAllProductsByCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;
    const cacheKey = `products:catId:${request.params.id}:page:${page}:perPage:${perPage}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({ message: "Page not found", success: false, error: true });
    }
    const products = await ProductModel.find({ catId: request.params.id })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function getAllProductsByCat(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;
    const cacheKey = `products:cat:all:page:${page}:perPage:${perPage}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages && totalPages > 0) {
      return response.status(404).json({ message: "Page not found", success: false, error: true });
    }
    const products = await ProductModel.find({})
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage);
    if (!products || products.length === 0) {
      return response.status(404).json({ message: "No products found", error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products,
      totalPages,
      page,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products by category name
export async function getAllProductsByCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;
    const cacheKey = `products:catName:${request.query.catName}:page:${page}:perPage:${perPage}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({ message: "Page not found", success: false, error: true });
    }
    const products = await ProductModel.find({ catName: request.query.catName })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products by sub category id
export async function getAllProductsBySubCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;
    const cacheKey = `products:subCatId:${request.params.id}:page:${page}:perPage:${perPage}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({ message: "Page not found", success: false, error: true });
    }
    const products = await ProductModel.find({ subCatId: request.params.id })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products by sub category name
export async function getAllProductsBySubCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;
    const cacheKey = `products:subCatName:${request.query.subCat}:page:${page}:perPage:${perPage}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({ message: "Page not found", success: false, error: true });
    }
    const products = await ProductModel.find({ subCat: request.query.subCat })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products by sub category id
export async function getAllProductsByThirdLavelCatId(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;
    const cacheKey = `products:thirdsubCatId:${request.params.id}:page:${page}:perPage:${perPage}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({ message: "Page not found", success: false, error: true });
    }
    const products = await ProductModel.find({ thirdsubCatId: request.params.id })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products by sub category name
export async function getAllProductsByThirdLavelCatName(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;
    const cacheKey = `products:thirdsubCatName:${request.query.thirdsubCat}:page:${page}:perPage:${perPage}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({ message: "Page not found", success: false, error: true });
    }
    const products = await ProductModel.find({ thirdsubCat: request.query.thirdsubCat })
      .populate("category")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .exec();
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products by price

export async function getAllProductsByPrice(request, response) {
  try {
    const cacheKey = `products:price:${JSON.stringify(request.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    let productList = [];
    if (request.query.catId !== "" && request.query.catId !== undefined) {
      const productListArr = await ProductModel.find({ catId: request.query.catId }).populate("category");
      productList = productListArr;
    }
    if (request.query.subCatId !== "" && request.query.subCatId !== undefined) {
      const productListArr = await ProductModel.find({ subCatId: request.query.subCatId }).populate("category");
      productList = productListArr;
    }
    if (request.query.thirdsubCatId !== "" && request.query.thirdsubCatId !== undefined) {
      const productListArr = await ProductModel.find({ thirdsubCatId: request.query.thirdsubCatId }).populate("category");
      productList = productListArr;
    }
    const filteredProducts = productList.filter((product) => {
      if (request.query.minPrice && product.price < parseInt(+request.query.minPrice)) {
        return false;
      }
      if (request.query.maxPrice && product.price > parseInt(+request.query.maxPrice)) {
        return false;
      }
      return true;
    });
    const result = {
      error: false,
      success: true,
      products: filteredProducts,
      totalPages: 0,
      page: 0,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products by rating
export async function getAllProductsByRating(request, response) {
  try {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.perPage) || 10000;
    const cacheKey = `products:rating:${JSON.stringify(request.query)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const totalPosts = await ProductModel.countDocuments();
    const totalPages = Math.ceil(totalPosts / perPage);
    if (page > totalPages) {
      return response.status(404).json({ message: "Page not found", success: false, error: true });
    }
    let products = [];
    if (request.query.catId !== undefined) {
      products = await ProductModel.find({ rating: request.query.rating, catId: request.query.catId })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();
    }
    if (request.query.subCatId !== undefined) {
      products = await ProductModel.find({ rating: request.query.rating, subCatId: request.query.subCatId })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();
    }
    if (request.query.thirdsubCatId !== undefined) {
      products = await ProductModel.find({ rating: request.query.rating, thirdsubCatId: request.query.thirdsubCatId })
        .populate("category")
        .skip((page - 1) * perPage)
        .limit(perPage)
        .exec();
    }
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
      totalPages: totalPages,
      page: page,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all products count

export async function getProductsCount(request, response) {
  try {
    const cacheKey = `products:count`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const productsCount = await ProductModel.countDocuments();
    if (!productsCount) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      productCount: productsCount,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all features products
export async function getAllFeaturedProducts(request, response) {
  try {
    const cacheKey = `products:featured`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const products = await ProductModel.find({ isFeatured: true }).populate("category");
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//get all features products have banners
export async function getAllProductsBanners(request, response) {
  try {
    const cacheKey = `products:banners`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const products = await ProductModel.find({ isDisplayOnHomeBanner: true }).populate("category");
    if (!products) {
      response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      products: products,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//delete product
export async function deleteProduct(request, response) {
  try {
    const product = await ProductModel.findById(request.params.id).populate(
      "category"
    );
    if (!product) {
      return response.status(404).json({
        message: "Product Not found",
        error: true,
        success: false,
      });
    }

    // Check if user can modify this product
    if (!canModifyResource(request.user, product)) {
      return response.status(403).json({
        message: "Permission denied: You can only delete your own products",
        error: true,
        success: false,
      });
    }

    const images = product?.images;
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

    const deletedProduct = await ProductModel.findByIdAndDelete(request.params.id);
    if (!deletedProduct) {
      response.status(404).json({ message: "Product not deleted!", success: false, error: true });
    }
    // Invalidate related product caches
    await delCache('products:all*');
    await delCache('products:catId*');
    await delCache('products:cat:all*');
    await delCache('products:catName*');
    await delCache('products:subCatId*');
    await delCache('products:subCatName*');
    await delCache('products:thirdsubCatId*');
    await delCache('products:thirdsubCatName*');
    await delCache('products:price*');
    await delCache('products:rating*');
    await delCache('products:count');
    await delCache('products:featured');
    await delCache('products:banners');
    await delCache('products:filters*');
    await delCache('products:search*');
    return response.status(200).json({ success: true, error: false, message: "Product Deleted!" });
  } catch (error) {
    console.log("Error hai : ", error);
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//delete multiple products
export async function deleteMultipleProduct(request, response) {
  try {
    const { ids } = request.body;

    if (!ids || !Array.isArray(ids)) {
      return response
        .status(400)
        .json({ error: true, success: false, message: "Invalid input" });
    }

    for (let i = 0; i < ids?.length; i++) {
      const product = await ProductModel.findById(ids[i]);
      if (!product) continue;

      const images = product.images || [];

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

    await ProductModel.deleteMany({ _id: { $in: request.body.ids } });
    return response.status(200).json({
      message: "Product delete successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response
      .status(500)
      .json({ message: error.message || error, error: true, success: false });
  }
}

//get single product
export async function getProduct(request, response) {
  try {
    const cacheKey = `product:${request.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const product = await ProductModel.findById(request.params.id).populate("category");
    if (!product) {
      return response.status(404).json({ message: "The product is not found", error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      product: product,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

//delete images
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
          console.log(error, result);
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

//updated product
export async function updateProduct(request, response) {
  try {
    // First fetch the product to check ownership
    const existingProduct = await ProductModel.findById(request.params.id);
    
    if (!existingProduct) {
      return response.status(404).json({
        message: "Product not found",
        error: true,
        success: false,
      });
    }

    // Check if user can modify this product
    if (!canModifyResource(request.user, existingProduct)) {
      return response.status(403).json({
        message: "Permission denied: You can only modify your own products",
        error: true,
        success: false,
      });
    }

    const product = await ProductModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
        subCat: request.body.subCat,
        description: request.body.description,
        bannerimages: request.body.bannerimages,
        bannerTitleName: request.body.bannerTitleName,
        isDisplayOnHomeBanner: request.body.isDisplayOnHomeBanner,
        images: request.body.images,
        bannerTitleName: request.body.bannerTitleName,
        brand: request.body.brand,
        price: request.body.price,
        oldPrice: request.body.oldPrice,
        catId: request.body.catId,
        catName: request.body.catName,
        subCat: request.body.subCat,
        subCatId: request.body.subCatId,
        category: request.body.category,
        thirdsubCat: request.body.thirdsubCat,
        thirdsubCatId: request.body.thirdsubCatId,
        countInStock: request.body.countInStock,
        rating: request.body.rating,
        isFeatured: request.body.isFeatured,
        productRam: request.body.productRam,
        size: request.body.size,
        productWeight: request.body.productWeight,
      },
      { new: true }
    );

    if (!product) {
      return response.status(404).json({
        message: "the product can not be updated!",
        status: false,
      });
    }

    imagesArr = [];
    // Invalidate related product caches
    await delCache('products:all*');
    await delCache('products:catId*');
    await delCache('products:cat:all*');
    await delCache('products:catName*');
    await delCache('products:subCatId*');
    await delCache('products:subCatName*');
    await delCache('products:thirdsubCatId*');
    await delCache('products:thirdsubCatName*');
    await delCache('products:price*');
    await delCache('products:rating*');
    await delCache('products:count');
    await delCache('products:featured');
    await delCache('products:banners');
    await delCache('products:filters*');
    await delCache('products:search*');
    return response.status(200).json({ message: "The product is updated", error: false, success: true });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function createProductRAMS(request, response) {
  try {
    let productRAMS = new ProductRAMSModel({
      name: request.body.name,
    });

    productRAMS = await productRAMS.save();

    if (!productRAMS) {
      response.status(500).json({
        error: true,
        success: false,
        message: "Product RAMS Not created",
      });
    }

    return response.status(200).json({
      message: "Product RAMS Created successfully",
      error: false,
      success: true,
      product: productRAMS,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductRAMS(request, response) {
  try {
    const productRams = await ProductRAMSModel.findById(request.params.id);

    if (!productRams) {
      return response.status(404).json({
        message: "Item Not found",
        error: true,
        success: false,
      });
    }

    const deletedProductRams = await ProductRAMSModel.findByIdAndDelete(
      request.params.id
    );

    if (!deletedProductRams) {
      return response.status(404).json({
        message: "Item not deleted!",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Product Ram Deleted!",
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function updateProductRam(request, response) {
  try {
    const productRam = await ProductRAMSModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true }
    );

    if (!productRam) {
      return response.status(404).json({
        message: "the product Ram can not be updated!",
        status: false,
      });
    }

    return response.status(200).json({
      message: "The product Ram is updated",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductRams(request, response) {
  try {
    const cacheKey = `productRAMS:all`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const productRam = await ProductRAMSModel.find();
    if (!productRam) {
      return response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      data: productRam,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function getProductRamsById(request, response) {
  try {
    const cacheKey = `productRAMS:${request.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const productRam = await ProductRAMSModel.findById(request.params.id);
    if (!productRam) {
      return response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      data: productRam,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function createProductWEIGHT(request, response) {
  try {
    let productWeight = new ProductWEIGHTModel({
      name: request.body.name,
    });

    productWeight = await productWeight.save();

    if (!productWeight) {
      response.status(500).json({
        error: true,
        success: false,
        message: "Product WEIGHT Not created",
      });
    }

    return response.status(200).json({
      message: "Product WEIGHT Created successfully",
      error: false,
      success: true,
      product: productWeight,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductWEIGHT(request, response) {
  try {
    const productWeight = await ProductWEIGHTModel.findById(request.params.id);

    if (!productWeight) {
      return response.status(404).json({
        message: "Item Not found",
        error: true,
        success: false,
      });
    }

    const deletedProductWeight = await ProductWEIGHTModel.findByIdAndDelete(
      request.params.id
    );

    if (!deletedProductWeight) {
      return response.status(404).json({
        message: "Item not deleted!",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Product Weight Deleted!",
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function updateProductWeight(request, response) {
  try {
    const productWeight = await ProductWEIGHTModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true }
    );

    if (!productWeight) {
      return response.status(404).json({
        message: "the product weight can not be updated!",
        status: false,
      });
    }

    return response.status(200).json({
      message: "The product weight is updated",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductWeight(request, response) {
  try {
    const cacheKey = `productWEIGHT:all`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const productWeight = await ProductWEIGHTModel.find();
    if (!productWeight) {
      return response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      data: productWeight,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function getProductWeightById(request, response) {
  try {
    const cacheKey = `productWEIGHT:${request.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const productWeight = await ProductWEIGHTModel.findById(request.params.id);
    if (!productWeight) {
      return response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      data: productWeight,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function createProductSize(request, response) {
  try {
    let productSize = new ProductSIZEModel({
      name: request.body.name,
    });

    productSize = await productSize.save();

    if (!productSize) {
      response.status(500).json({
        error: true,
        success: false,
        message: "Product size Not created",
      });
    }

    return response.status(200).json({
      message: "Product size Created successfully",
      error: false,
      success: true,
      product: productSize,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function deleteProductSize(request, response) {
  try {
    const productSize = await ProductSIZEModel.findById(request.params.id);

    if (!productSize) {
      return response.status(404).json({
        message: "Item Not found",
        error: true,
        success: false,
      });
    }

    const deletedProductSize = await ProductSIZEModel.findByIdAndDelete(
      request.params.id
    );

    if (!deletedProductSize) {
      return response.status(404).json({
        message: "Item not deleted!",
        success: false,
        error: true,
      });
    }

    return response.status(200).json({
      success: true,
      error: false,
      message: "Product size Deleted!",
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function updateProductSize(request, response) {
  try {
    const productSize = await ProductSIZEModel.findByIdAndUpdate(
      request.params.id,
      {
        name: request.body.name,
      },
      { new: true }
    );

    if (!productSize) {
      return response.status(404).json({
        message: "the product size can not be updated!",
        status: false,
      });
    }

    return response.status(200).json({
      message: "The product size is updated",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function getProductSize(request, response) {
  try {
    const cacheKey = `productSIZE:all`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const productSize = await ProductSIZEModel.find();
    if (!productSize) {
      return response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      data: productSize,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function getProductSizeById(request, response) {
  try {
    const cacheKey = `productSIZE:${request.params.id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const productSize = await ProductSIZEModel.findById(request.params.id);
    if (!productSize) {
      return response.status(500).json({ error: true, success: false });
    }
    const result = {
      error: false,
      success: true,
      data: productSize,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function filters(request, response) {
  try {
    const cacheKey = `products:filters:${JSON.stringify(request.body)}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    const {
      catId,
      subCatId,
      thirdsubCatId,
      minPrice,
      maxPrice,
      rating,
      page,
      limit,
    } = request.body;
    const filters = {};
    if (catId?.length) {
      filters.catId = { $in: catId };
    }
    if (subCatId?.length) {
      filters.subCatId = { $in: subCatId };
    }
    if (thirdsubCatId?.length) {
      filters.thirdsubCatId = { $in: thirdsubCatId };
    }
    if (minPrice || maxPrice) {
      filters.price = { $gte: +minPrice || 0, $lte: +maxPrice || Infinity };
    }
    if (rating?.length) {
      filters.rating = { $in: rating };
    }
    const products = await ProductModel.find(filters)
      .populate("category")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await ProductModel.countDocuments(filters);
    const result = {
      error: false,
      success: true,
      products: products,
      total: total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

// Sort function
const sortItems = (products, sortBy, order) => {
  try {
    return products.sort((a, b) => {
      if (sortBy === "name") {
        return order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortBy === "price") {
        return order === "asc" ? a.price - b.price : b.price - a.price;
      }
      return 0;
    });
  } catch (error) {
    return [];
  }
};

export async function sortBy(request, response) {
  try {
    const { products, sortBy, order } = request.body;
    const sortedItems = sortItems([...products?.products], sortBy, order);
    return response.status(200).json({
      error: false,
      success: true,
      products: sortedItems,
      totalPages: 0,
      page: 0,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function searchProductController(request, response) {
  try {
    const { query, page, limit } = request.body;
    const cacheKey = `products:search:${query}:page:${page}:limit:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return response.status(200).json(cached);
    }
    if (!query) {
      return response.status(400).json({ error: true, success: false, message: "Query is required" });
    }
    const products = await ProductModel.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { brand: { $regex: query, $options: "i" } },
        { catName: { $regex: query, $options: "i" } },
        { subCat: { $regex: query, $options: "i" } },
        { thirdsubCat: { $regex: query, $options: "i" } },
      ],
    }).populate("category");
    const total = await products?.length;
    const result = {
      error: false,
      success: true,
      products: products,
      total: 1,
      page: parseInt(page),
      totalPages: 1,
    };
    await setCache(cacheKey, result);
    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}
