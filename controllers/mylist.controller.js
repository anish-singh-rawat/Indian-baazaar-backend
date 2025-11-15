import MyListModel from '../models/myList.modal.js';
import { getCache, setCache, delCache } from '../utils/redisUtil.js';

export const addToMyListController = async (request, response) => {
    try {

        const userId = request.userId //middleware
        const {
            productId,
            productTitle,
            image,
            rating,
            price,
            oldPrice,
            brand,
            discount
        } = request.body;


        const item = await MyListModel.findOne({
            userId:userId,
            productId:productId
        })


        if(item){
            return response.status(400).json({
                message: "Item already in my list"
            })
        }

        const myList = new MyListModel({
            productId,
            productTitle,
            image,
            rating,
            price,
            oldPrice,
            brand,
            discount,
            userId
        })


        const save  = await myList.save();
        // Invalidate mylist cache for user
        await delCache(`mylist_${userId}`);
        return response.status(200).json({
            error:false,
            success:true,
            message:"The product saved in the my list",
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const deleteToMyListController = async (request, response) => {
    try {

        const myListItem = await MyListModel.findById(request.params.id);

        if(!myListItem){
            return response.status(404).json({
                error:true,
                success:false,
                message:"The item with this given id was not found"
            })
        }


        const deletedItem = await MyListModel.findByIdAndDelete(request.params.id);

        if(!deletedItem){
            return response.status(404).json({
                error:true,
                success:false,
                message:"The item is not deleted"
            })
        }


        // Invalidate mylist cache for user
        await delCache(`mylist_${myListItem.userId}`);
        return response.status(200).json({
            error:false,
            success:true,
            message:"The item removed from My List"
        })
        
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


export const getMyListController = async (request, response) => {
    try {
        
        const userId = request.userId;
        const cacheKey = `mylist_${userId}`;
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
            return response.status(200).json(cachedData);
        }
        const myListItems = await MyListModel.find({
            userId:userId
        })

        const responseData = {
            error:false,
            success:true,
            data:myListItems
        };
        await setCache(cacheKey, responseData);
        return response.status(200).json(responseData);

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}