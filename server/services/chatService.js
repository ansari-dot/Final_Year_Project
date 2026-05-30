'use strict';

const { Op } = require('sequelize');
const {
  Conversation,
  Message,
  SwapRequest,
  User,
  ClothingItem,
  ClothingImage,
  sequelize,
} = require('../models');
const ApiError = require('../utils/ApiError');
const notificationService = require('./notificationService');

const ensureParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findByPk(conversationId, {
    include: [{ model: SwapRequest, as: 'swapRequest' }],
  });
  if (!conversation) throw ApiError.notFound('Conversation not found.');
  const swap = conversation.swapRequest;
  if (!swap) throw ApiError.internal('Conversation has no associated swap.');
  if (swap.senderId !== userId && swap.receiverId !== userId) {
    throw ApiError.forbidden('You are not a participant in this conversation.');
  }
  return { conversation, swap };
};

const getConversations = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const swaps = await SwapRequest.findAll({
    where: {
      [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      status: { [Op.in]: ['accepted', 'completed'] },
    },
    attributes: ['id'],
  });

  const swapIds = swaps.map((s) => s.id);
  if (swapIds.length === 0) return { items: [], count: 0 };

  const { rows, count } = await Conversation.findAndCountAll({
    where: { swapRequestId: { [Op.in]: swapIds } },
    include: [
      {
        model: SwapRequest,
        as: 'swapRequest',
        include: [
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
        ],
      },
    ],
    order: [
      ['lastMessageAt', 'DESC'],
      ['createdAt', 'DESC'],
    ],
    limit,
    offset,
    distinct: true,
  });

  // Attach unread count + last message
  const enriched = await Promise.all(
    rows.map(async (c) => {
      const [lastMessage, unreadCount] = await Promise.all([
        Message.findOne({
          where: { conversationId: c.id },
          order: [['createdAt', 'DESC']],
        }),
        Message.count({
          where: { conversationId: c.id, senderId: { [Op.ne]: userId }, isRead: false },
        }),
      ]);
      return { ...c.toJSON(), lastMessage, unreadCount };
    })
  );

  return { items: enriched, count };
};

const getMessages = async (conversationId, userId, page = 1, limit = 50) => {
  await ensureParticipant(conversationId, userId);
  const offset = (page - 1) * limit;
  const { rows, count } = await Message.findAndCountAll({
    where: { conversationId },
    include: [
      { model: User, as: 'sender', attributes: ['id', 'name', 'profileImage'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { items: rows.reverse(), count };
};

const createMessage = async (conversationId, senderId, { message, attachmentUrl }) => {
  const { swap } = await ensureParticipant(conversationId, senderId);

  return sequelize.transaction(async (t) => {
    const msg = await Message.create(
      {
        conversationId,
        senderId,
        message,
        attachmentUrl: attachmentUrl || null,
      },
      { transaction: t }
    );

    await Conversation.update(
      { lastMessageAt: new Date() },
      { where: { id: conversationId }, transaction: t }
    );

    return { msg, swap };
  }).then(async ({ msg, swap }) => {
    const recipientId = swap.senderId === senderId ? swap.receiverId : swap.senderId;
    const sender = await User.findByPk(senderId, { attributes: ['id', 'name'] });
    await notificationService.createNotification(
      recipientId,
      notificationService.NOTIFICATION_TYPES.NEW_MESSAGE,
      'New message',
      `${sender.name}: ${msg.message.substring(0, 80)}${msg.message.length > 80 ? '…' : ''}`,
      { conversationId, messageId: msg.id, swapId: swap.id },
      false
    );

    const fullMsg = await Message.findByPk(msg.id, {
      include: [{ model: User, as: 'sender', attributes: ['id', 'name', 'profileImage'] }],
    });
    return fullMsg;
  });
};

const markMessageRead = async (messageId, userId) => {
  const msg = await Message.findByPk(messageId, {
    include: [
      { model: Conversation, as: 'conversation', include: [{ model: SwapRequest, as: 'swapRequest' }] },
    ],
  });
  if (!msg) throw ApiError.notFound('Message not found.');
  const swap = msg.conversation.swapRequest;
  if (swap.senderId !== userId && swap.receiverId !== userId) {
    throw ApiError.forbidden('Not allowed.');
  }
  if (msg.senderId === userId) return msg;
  if (msg.isRead) return msg;
  msg.isRead = true;
  msg.readAt = new Date();
  await msg.save();
  return msg;
};

const markConversationRead = async (conversationId, userId) => {
  await ensureParticipant(conversationId, userId);
  const [count] = await Message.update(
    { isRead: true, readAt: new Date() },
    {
      where: {
        conversationId,
        senderId: { [Op.ne]: userId },
        isRead: false,
      },
    }
  );
  return count;
};

module.exports = {
  ensureParticipant,
  getConversations,
  getMessages,
  createMessage,
  markMessageRead,
  markConversationRead,
};
