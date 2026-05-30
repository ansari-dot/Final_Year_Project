'use strict';

const { Op } = require('sequelize');
const {
  SwapRequest,
  ClothingItem,
  Conversation,
  User,
  ClothingImage,
  sequelize,
} = require('../models');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notificationService');
const { NOTIFICATION_TYPES } = notificationService;

const includeForSwap = [
  { model: User, as: 'sender', attributes: ['id', 'name', 'profileImage'] },
  { model: User, as: 'receiver', attributes: ['id', 'name', 'profileImage'] },
  {
    model: ClothingItem,
    as: 'senderItem',
    include: [{ model: ClothingImage, as: 'images' }],
  },
  {
    model: ClothingItem,
    as: 'receiverItem',
    include: [{ model: ClothingImage, as: 'images' }],
  },
  { model: Conversation, as: 'conversation' },
];

const createSwapRequest = async (senderId, { receiverId, senderItemId, receiverItemId, message }) => {
  if (senderId === receiverId) {
    throw ApiError.badRequest('You cannot swap with yourself.');
  }

  const [senderItem, receiverItem] = await Promise.all([
    ClothingItem.findByPk(senderItemId),
    ClothingItem.findByPk(receiverItemId),
  ]);

  if (!senderItem) throw ApiError.notFound('Your offered item not found.');
  if (!receiverItem) throw ApiError.notFound('Requested item not found.');
  if (senderItem.userId !== senderId) {
    throw ApiError.forbidden('You can only offer items you own.');
  }
  if (receiverItem.userId !== receiverId) {
    throw ApiError.badRequest('Receiver does not own the requested item.');
  }
  if (!senderItem.isAvailable || !receiverItem.isAvailable) {
    throw ApiError.badRequest('One of the items is no longer available.');
  }

  const existing = await SwapRequest.findOne({
    where: {
      senderId,
      receiverId,
      senderItemId,
      receiverItemId,
      status: { [Op.in]: ['pending', 'accepted'] },
    },
  });
  if (existing) {
    throw ApiError.conflict('A pending/accepted swap already exists for these items.');
  }

  const swap = await SwapRequest.create({
    senderId,
    receiverId,
    senderItemId,
    receiverItemId,
    message: message || null,
    status: 'pending',
  });

  // Notify receiver
  const sender = await User.findByPk(senderId);
  await notificationService.createNotification(
    receiverId,
    NOTIFICATION_TYPES.SWAP_REQUEST,
    'New swap request',
    `${sender.name} wants to swap "${senderItem.title}" for your "${receiverItem.title}".`,
    { swapId: swap.id, senderId, senderItemId, receiverItemId }
  );

  return getSwapById(swap.id);
};

const getSwapById = async (swapId) => {
  const swap = await SwapRequest.findByPk(swapId, { include: includeForSwap });
  if (!swap) throw ApiError.notFound('Swap not found.');
  return swap;
};

const ensureParticipant = (swap, userId) => {
  if (swap.senderId !== userId && swap.receiverId !== userId) {
    throw ApiError.forbidden('You are not a participant in this swap.');
  }
};

const acceptSwap = async (swapId, userId) => {
  return sequelize.transaction(async (t) => {
    const swap = await SwapRequest.findByPk(swapId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!swap) throw ApiError.notFound('Swap not found.');
    if (swap.receiverId !== userId) {
      throw ApiError.forbidden('Only the receiver can accept this swap.');
    }
    if (swap.status !== 'pending') {
      throw ApiError.badRequest(`Cannot accept swap with status "${swap.status}".`);
    }

    swap.status = 'accepted';
    await swap.save({ transaction: t });

    // Auto-create conversation
    const [conversation] = await Conversation.findOrCreate({
      where: { swapRequestId: swap.id },
      defaults: { swapRequestId: swap.id },
      transaction: t,
    });

    return { swap, conversation };
  }).then(async ({ swap }) => {
    const receiver = await User.findByPk(swap.receiverId);
    const senderItem = await ClothingItem.findByPk(swap.senderItemId);
    await notificationService.createNotification(
      swap.senderId,
      NOTIFICATION_TYPES.SWAP_ACCEPTED,
      'Swap request accepted!',
      `${receiver.name} accepted your swap request for "${senderItem.title}".`,
      { swapId: swap.id }
    );
    return getSwapById(swap.id);
  });
};

const rejectSwap = async (swapId, userId) => {
  const swap = await SwapRequest.findByPk(swapId);
  if (!swap) throw ApiError.notFound('Swap not found.');
  if (swap.receiverId !== userId) {
    throw ApiError.forbidden('Only the receiver can reject this swap.');
  }
  if (swap.status !== 'pending') {
    throw ApiError.badRequest(`Cannot reject swap with status "${swap.status}".`);
  }

  swap.status = 'rejected';
  await swap.save();

  const receiver = await User.findByPk(userId);
  await notificationService.createNotification(
    swap.senderId,
    NOTIFICATION_TYPES.SWAP_REJECTED,
    'Swap request rejected',
    `${receiver.name} declined your swap request.`,
    { swapId: swap.id }
  );

  return getSwapById(swap.id);
};

const cancelSwap = async (swapId, userId) => {
  const swap = await SwapRequest.findByPk(swapId);
  if (!swap) throw ApiError.notFound('Swap not found.');
  ensureParticipant(swap, userId);
  if (!['pending', 'accepted'].includes(swap.status)) {
    throw ApiError.badRequest(`Cannot cancel swap with status "${swap.status}".`);
  }

  swap.status = 'cancelled';
  await swap.save();

  const otherUserId = swap.senderId === userId ? swap.receiverId : swap.senderId;
  const actor = await User.findByPk(userId);
  await notificationService.createNotification(
    otherUserId,
    NOTIFICATION_TYPES.SWAP_CANCELLED,
    'Swap cancelled',
    `${actor.name} cancelled the swap request.`,
    { swapId: swap.id }
  );

  return getSwapById(swap.id);
};

const completeSwap = async (swapId, userId) => {
  return sequelize.transaction(async (t) => {
    const swap = await SwapRequest.findByPk(swapId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!swap) throw ApiError.notFound('Swap not found.');
    ensureParticipant(swap, userId);
    if (swap.status !== 'accepted') {
      throw ApiError.badRequest('Only accepted swaps can be completed.');
    }

    if (swap.senderId === userId) {
      swap.senderConfirmedAt = new Date();
    } else {
      swap.receiverConfirmedAt = new Date();
    }

    if (swap.senderConfirmedAt && swap.receiverConfirmedAt) {
      swap.status = 'completed';
      await ClothingItem.update(
        { isAvailable: false },
        { where: { id: { [Op.in]: [swap.senderItemId, swap.receiverItemId] } }, transaction: t }
      );
    }

    await swap.save({ transaction: t });
    return swap;
  }).then(async (swap) => {
    if (swap.status === 'completed') {
      await Promise.all([
        notificationService.createNotification(
          swap.senderId,
          NOTIFICATION_TYPES.SWAP_COMPLETED,
          'Swap completed',
          'Your swap has been completed. Please leave a review!',
          { swapId: swap.id }
        ),
        notificationService.createNotification(
          swap.receiverId,
          NOTIFICATION_TYPES.SWAP_COMPLETED,
          'Swap completed',
          'Your swap has been completed. Please leave a review!',
          { swapId: swap.id }
        ),
      ]);
    } else {
      const otherUserId = swap.senderId === swap.senderId ? swap.receiverId : swap.senderId;
      await notificationService.createNotification(
        otherUserId,
        'swap_pending_completion',
        'Swap completion pending',
        'The other party confirmed completion. Please confirm on your end too.',
        { swapId: swap.id },
        false
      );
    }
    return getSwapById(swap.id);
  });
};

const updateSwapStatus = async (swapId, userId, status) => {
  switch (status) {
    case 'accepted':
      return acceptSwap(swapId, userId);
    case 'rejected':
      return rejectSwap(swapId, userId);
    case 'cancelled':
      return cancelSwap(swapId, userId);
    case 'completed':
      return completeSwap(swapId, userId);
    default:
      throw ApiError.badRequest(`Invalid status transition: ${status}`);
  }
};

const getUserSwaps = async (userId, { role = 'all', status, page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  let where = {};
  if (role === 'sent') where.senderId = userId;
  else if (role === 'received') where.receiverId = userId;
  else where = { [Op.or]: [{ senderId: userId }, { receiverId: userId }] };

  if (status) where.status = status;

  const { rows, count } = await SwapRequest.findAndCountAll({
    where,
    include: includeForSwap,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
  });
  return { items: rows, count };
};

module.exports = {
  createSwapRequest,
  getSwapById,
  acceptSwap,
  rejectSwap,
  cancelSwap,
  completeSwap,
  updateSwapStatus,
  getUserSwaps,
};
