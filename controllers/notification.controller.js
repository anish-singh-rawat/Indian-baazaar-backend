import NotificationModel from '../models/notification.model.js';
import UserModel from '../models/user.model.js';
import { getCache, setCache, delCache } from '../utils/redisUtil.js';

export async function getNotifications(request, response) {
  try {
    const userId = request.userId;
    const cacheKey = `notifications_${userId}`;
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return response.status(200).json(cachedData);
    }
    const notifications = await NotificationModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('product'); 
    const mapped = notifications.map((n) => ({
      _id: n?._id,
      title: n?.title,
      message: n?.message,
      read: n?.read,
      createdAt: n?.createdAt,
      updatedAt: n?.updatedAt,
      product: n?.product || null,
      productId: n?.product ? n?.product._id : null,
      productImage: n?.product && n?.product.images && n?.product.images.length > 0 ? n?.product.images[0] : null,
    }));
    const responseData = { error: false, success: true, notifications: mapped };
    await setCache(cacheKey, responseData);
    return response.status(200).json(responseData);
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function markAsRead(request, response) {
  try {
    const userId = request.userId;
    const notifId = request.params.id;
    const notif = await NotificationModel.findOne({ _id: notifId, user: userId });
    if (!notif) {
      return response.status(404).json({ message: 'Notification not found', error: true, success: false });
    }
    if (notif.read) {
      return response.status(200).json({ message: 'Already marked as read', error: false, success: true });
    }
    notif.read = true;
    await notif.save();
    // Invalidate notification cache for user
    await delCache(`notifications_${userId}`);
    return response.status(200).json({ message: 'Notification marked as read', error: false, success: true });
  } catch (error) {
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}

export async function createNotification(request, response) {
  try {
    const userId = request.userId;
    const { title, message, productId } = request.body;
    const user = await UserModel.findById(userId).lean();
    if (!user || (user.role !== 'RETAILER' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN')) {
      return response.status(403).json({ message: 'Forbidden to user', error: true, success: false });
    }
    const users = await UserModel.find({}, '_id').lean();
    if (!users || users.length === 0) {
      return response.status(200).json({ message: 'No users to notify', error: false, success: true });
    }
    const docs = users.map((u) => ({
      user: u._id,
      product: productId || null,
      title: title || 'Notification',
      message: message || '',
      read: false,
    }));
    await NotificationModel.insertMany(docs);
    // Invalidate notification cache for all users
    for (const u of users) {
      await delCache(`notifications_${u._id}`);
    }
    return response.status(200).json({ message: 'Notifications created', error: false, success: true });
  } catch (error) {
    console.error('createNotification error:', error);
    return response.status(500).json({ message: error.message || error, error: true, success: false });
  }
}
