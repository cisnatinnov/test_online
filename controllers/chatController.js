const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, ChatRoom, ChatMessage, ChatParticipant } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { parsePagination, paginateResponse } = require('../utils/pagination');

const JWT_SECRET = process.env.JWT_SECRET;

const MAX_MESSAGE_LENGTH = 5000;

let io = null;
const onlineUsers = new Map();

function initSocket(socketIo) {
  io = socketIo;

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${socket.user.username} (socket: ${socket.id})`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    io.emit('user:online', { userId, username: socket.user.username });

    socket.on('chat:join', async (data) => {
      const { roomId } = data;
      const participant = await ChatParticipant.findOne({ where: { room_id: roomId, user_id: userId } });
      if (!participant) return;
      socket.join(`room:${roomId}`);
      const participants = await ChatParticipant.findAll({ where: { room_id: roomId } });
      const onlineInRoom = participants
        .filter(p => onlineUsers.has(p.user_id))
        .map(p => p.user_id);
      io.to(`room:${roomId}`).emit('chat:users', { roomId, users: onlineInRoom });
    });

    socket.on('chat:leave', (data) => {
      const { roomId } = data;
      socket.leave(`room:${roomId}`);
    });

    socket.on('chat:send', async (data) => {
      const { roomId, content } = data;
      if (!content || !content.trim()) return;
      const trimmedContent = content.trim().slice(0, MAX_MESSAGE_LENGTH);

      const participant = await ChatParticipant.findOne({ where: { room_id: roomId, user_id: userId } });
      if (!participant) return;

      const message = await ChatMessage.create({
        room_id: roomId,
        user_id: userId,
        content: trimmedContent,
      });

      const fullMessage = {
        id: message.id,
        roomId,
        userId,
        username: socket.user.username,
        content: trimmedContent,
        createdAt: message.createdAt,
      };

      io.to(`room:${roomId}`).emit('chat:message', fullMessage);
    });

    socket.on('chat:typing', (data) => {
      const { roomId } = data;
      socket.to(`room:${roomId}`).emit('chat:typing', {
        roomId,
        userId,
        username: socket.user.username,
      });
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user:offline', { userId, username: socket.user.username });
        }
      }
      console.log(`User disconnected: ${socket.user.username}`);
    });
  });
}

exports.initSocket = initSocket;

exports.getOnlineUsers = (req, res) => {
  const users = Array.from(onlineUsers.keys());
  return apiResponse(res, { data: users });
};

exports.getRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows: participants } = await ChatParticipant.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: ChatRoom,
          include: [
            { model: ChatParticipant, include: [{ model: User, attributes: ['id', 'username', 'email'] }] },
          ],
        },
      ],
      limit,
      offset,
    });

    const rooms = await Promise.all(participants.map(async (p) => {
      const room = p.ChatRoom;
      const lastMessage = await ChatMessage.findOne({
        where: { room_id: room.id },
        order: [['id', 'DESC']],
        include: [{ model: User, attributes: ['id', 'username'] }],
      });

      const otherParticipant = room.ChatParticipants.find(cp => cp.user_id !== userId);
      const otherUser = otherParticipant ? otherParticipant.User : null;

      return {
        id: room.id,
        name: room.type === 'direct' ? (otherUser?.username || 'Direct Message') : room.name,
        type: room.type,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          username: lastMessage.User.username,
          createdAt: lastMessage.createdAt,
        } : null,
        participants: room.ChatParticipants.map(cp => ({
          id: cp.user_id,
          username: cp.User.username,
          email: cp.User.email,
        })),
        isOnline: room.type === 'direct' && otherUser ? onlineUsers.has(otherUser.id) : false,
      };
    }));

    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rooms, itemName: 'rooms' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, participantIds } = req.body;

    if (type === 'group') {
      if (!name || !name.trim()) {
        return apiResponse(res, { error: 'Group name is required', status: 400 });
      }
      const room = await ChatRoom.create({ name: name.trim(), type: 'group', created_by: userId });
      await ChatParticipant.create({ room_id: room.id, user_id: userId, role: 'admin' });

      if (participantIds && Array.isArray(participantIds)) {
        for (const pid of participantIds) {
          if (pid !== userId) {
            await ChatParticipant.create({ room_id: room.id, user_id: pid, role: 'member' });
          }
        }
      }

      return apiResponse(res, { data: { id: room.id, name: room.name, type: room.type } });
    }

    if (type === 'direct') {
      const otherUserId = participantIds?.[0];
      if (!otherUserId) {
        return apiResponse(res, { error: 'participantIds[0] is required for direct', status: 400 });
      }

      const existingRooms = await ChatRoom.findAll({
        where: { type: 'direct' },
        include: [{ model: ChatParticipant }],
      });

      const existingRoom = existingRooms.find(room => {
        const participantIds = room.ChatParticipants.map(p => p.user_id);
        return participantIds.includes(userId) && participantIds.includes(otherUserId) && participantIds.length === 2;
      });

      if (existingRoom) {
        return apiResponse(res, { data: { id: existingRoom.id, name: null, type: 'direct' } });
      }

      const room = await ChatRoom.create({ type: 'direct', created_by: userId });
      await ChatParticipant.create({ room_id: room.id, user_id: userId, role: 'member' });
      await ChatParticipant.create({ room_id: room.id, user_id: otherUserId, role: 'member' });

      return apiResponse(res, { data: { id: room.id, name: null, type: 'direct' } });
    }

    return apiResponse(res, { error: 'Invalid room type', status: 400 });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const { before, limit } = req.query;

    const participant = await ChatParticipant.findOne({ where: { room_id: roomId, user_id: userId } });
    if (!participant) {
      return apiResponse(res, { error: 'Not a member of this room', status: 403 });
    }

    const where = { room_id: roomId };
    if (before) where.id = { [Op.lt]: before };

    const messages = await ChatMessage.findAll({
      where,
      include: [{ model: User, attributes: ['id', 'username'] }],
      order: [['id', 'DESC']],
      limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
    });

    return apiResponse(res, { data: messages.reverse() });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const { count, rows } = await User.findAndCountAll({
      attributes: ['id', 'username', 'email'],
      where: { id: { [Op.ne]: req.user.id } },
      limit,
      offset,
    });
    return apiResponse(res, { data: paginateResponse({ total: count, page, limit, items: rows, itemName: 'users' }) });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.addParticipants = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userIds } = req.body;

    const admin = await ChatParticipant.findOne({ where: { room_id: roomId, user_id: req.user.id, role: 'admin' } });
    if (!admin) {
      return apiResponse(res, { error: 'Only admins can add participants', status: 403 });
    }

    const added = [];
    for (const uid of userIds) {
      const exists = await ChatParticipant.findOne({ where: { room_id: roomId, user_id: uid } });
      if (!exists) {
        await ChatParticipant.create({ room_id: roomId, user_id: uid, role: 'member' });
        added.push(uid);
      }
    }

    if (added.length > 0 && io) {
      io.to(`room:${roomId}`).emit('chat:room:updated', { roomId });
    }

    return apiResponse(res, { data: { added } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};

exports.removeParticipants = async (req, res) => {
  try {
    const { roomId, userId } = req.params;

    const admin = await ChatParticipant.findOne({ where: { room_id: roomId, user_id: req.user.id, role: 'admin' } });
    if (!admin) {
      return apiResponse(res, { error: 'Only admins can remove participants', status: 403 });
    }

    if (String(userId) === String(req.user.id)) {
      return apiResponse(res, { error: 'Cannot remove yourself', status: 400 });
    }

    const participant = await ChatParticipant.findOne({ where: { room_id: roomId, user_id: userId } });
    if (!participant) {
      return apiResponse(res, { error: 'Participant not found', status: 404 });
    }

    await participant.destroy();

    if (io) {
      io.to(`room:${roomId}`).emit('chat:room:updated', { roomId });
    }

    return apiResponse(res, { data: { removed: userId } });
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
