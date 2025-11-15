import CartProductModel from "../models/cartProduct.modal.js";
import { getCache, setCache, delCache } from '../utils/redisUtil.js';

export const addToCartItemController = async (request, response) => {
    try {
        const userId = request.userId
        const { productTitle, image, rating, price, oldPrice, quantity, sub_total, productId, countInStock, discount,size, weight, ram, brand } = request.body

        if (!productId) {
            return response.status(402).json({
                message: "Provide productId",
                error: true,
                success: false
            })
        }


        const checkItemCart = await CartProductModel.findOne({
            userId: userId,
            productId: productId
        })

        if (checkItemCart) {
            return response.status(400).json({
                message: "Item already in cart"
            })
        }


        const cartItem = new CartProductModel({
            productTitle:productTitle,
            image:image,
            rating:rating,
            price:price,
            oldPrice:oldPrice,
            quantity:quantity,
            sub_total:sub_total,
            productId:productId,
            countInStock:countInStock,
            userId:userId,
            brand:brand,
            discount:discount,
            size:size,
            weight:weight,
            ram:ram
        })

        const save = await cartItem.save();
        // Invalidate cart cache for user
        await delCache(`cart_${userId}`);
        return response.status(200).json({
            data: save,
            message: "Item add successfully",
            error: false,
            success: true
        })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const getCartItemController = async (request, response) => {
    try {
        const userId = request.userId;
        const cacheKey = `cart_${userId}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return response.json(cachedData);
        }
        const cartItems = await CartProductModel.find({ userId: userId });
        const responseData = {
            data: cartItems,
            error: false,
            success: true
        };
        await setCache(cacheKey, responseData);
        return response.json(responseData);
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export const updateCartItemQtyController = async (request, response) => {
    try {

        const userId = request.userId
        const { _id, qty , sub_total, size, weight, ram} = request.body



        if (!_id || !qty) {
            return response.status(400).json({
                message: "provide _id, qty"
            })
        }

        const updateCartitem = await CartProductModel.updateOne(
            {
                _id: _id,
                userId: userId
            },
            {
                quantity: qty,
                sub_total:sub_total,
                size:size,
                ram:ram,
                weight:weight
            },
            { new: true }
        )
        // Invalidate cart cache for user
        await delCache(`cart_${userId}`);
        return response.json({
            message: "Update cart item",
            success: true,
            error: false,
            data: updateCartitem
        })



    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const deleteCartItemQtyController = async (request, response) => {
    try {
        const userId = request.userId // middleware
        const { id } = request.params


        if(!id){
            return response.status(400).json({
                message : "Provide _id",
                error : true,
                success : false
            })
          }


          const deleteCartItem  = await CartProductModel.deleteOne({_id : id, userId : userId })
          // Invalidate cart cache for user
          await delCache(`cart_${userId}`);
          if(!deleteCartItem){
            return response.status(404).json({
                message:"The product in the cart is not found",
                error:true,
                success:false
            })
          }
         

          return response.status(200).json({
            message : "Item remove",
            error : false,
            success : true,
            data : deleteCartItem
          })


    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}



export const emptyCartController = async (request, response) => {
    try {
        const userId = request.params.id // middlewar

        await CartProductModel.deleteMany({userId:userId })
        // Invalidate cart cache for user
        await delCache(`cart_${userId}`);
          return response.status(200).json({
            error : false,
            success : true,
          })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}