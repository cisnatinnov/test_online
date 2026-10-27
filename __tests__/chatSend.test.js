process.env.JWT_SECRET = 'chat-moderation-isolated-secret';
jest.mock('../models', () => ({
  User: {}, ChatRoom: { create: jest.fn() },
  ChatMessage: { create: jest.fn() },
  ChatParticipant: { findOne: jest.fn(), create: jest.fn() },
}));
const jwt = require('jsonwebtoken');
const { ChatMessage, ChatParticipant, ChatRoom } = require('../models');
const { initSocket, createRoom } = require('../controllers/chatController');
let handlers, socket, broadcast;
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  handlers = {};
  broadcast = { emit: jest.fn() };
  socket = {
    id: 'isolated-socket', handshake: { auth: { token: jwt.sign({ id: 1, username: 'test' }, process.env.JWT_SECRET) } },
    on: jest.fn((name, handler) => { handlers[name] = handler }), emit: jest.fn(),
  };
  const io = { use: callback => callback(socket, error => { if (error) throw error }),
    on: (name, callback) => { if (name === 'connection') callback(socket) }, emit: jest.fn(), to: jest.fn(() => broadcast) };
  ChatParticipant.findOne.mockResolvedValue({ user_id: 1, room_id: 7 });
  ChatMessage.create.mockResolvedValue({ id: 10, createdAt: new Date('2026-01-01') });
  initSocket(io);
});
afterEach(() => { handlers.disconnect(); jest.restoreAllMocks(); });

test.each(['fuck you', 'g0bl0k', 'f.u.c.k', 'f\u200buck'])('blocks socket message before database write or broadcast: %s', async content => {
  const acknowledge = jest.fn();
  await handlers['chat:send']({ roomId: 7, content }, acknowledge);
  expect(ChatMessage.create).not.toHaveBeenCalled(); expect(broadcast.emit).not.toHaveBeenCalled();
  expect(socket.emit).toHaveBeenCalledWith('chat:error', expect.objectContaining({ code: 'CHAT_PROFANITY' }));
  expect(acknowledge).toHaveBeenCalledWith({ success: false, code: 'CHAT_PROFANITY' });
});
test('stores and broadcasts ordinary negative feedback with a success acknowledgement', async () => {
  const acknowledge = jest.fn();
  await handlers['chat:send']({ roomId: 7, content: '  This was a bad experience.  ' }, acknowledge);
  expect(ChatMessage.create).toHaveBeenCalledWith({ room_id: 7, user_id: 1, content: 'This was a bad experience.' });
  expect(broadcast.emit).toHaveBeenCalledWith('chat:message', expect.objectContaining({ id: 10, content: 'This was a bad experience.' }));
  expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
});
test.each([null, {}, { roomId: 7, content: 42 }, { roomId: 7, content: '' }, { roomId: -1, content: 'Hello' }, { roomId: 7, content: 'x'.repeat(5001) }])('rejects malformed or oversized socket payload', async data => {
  const acknowledge = jest.fn(); await handlers['chat:send'](data, acknowledge);
  expect(ChatMessage.create).not.toHaveBeenCalled(); expect(broadcast.emit).not.toHaveBeenCalled();
  expect(acknowledge).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
});
test('prevents non-members and reports database failures without an unhandled rejection', async () => {
  ChatParticipant.findOne.mockResolvedValue(null);
  const acknowledge = jest.fn(); await handlers['chat:send']({ roomId: 7, content: 'Hello' }, acknowledge);
  expect(acknowledge).toHaveBeenCalledWith({ success: false, code: 'CHAT_FORBIDDEN' });
  ChatParticipant.findOne.mockRejectedValue(new Error('private database details'));
  acknowledge.mockClear(); await handlers['chat:send']({ roomId: 7, content: 'Hello' }, acknowledge);
  expect(acknowledge).toHaveBeenCalledWith({ success: false, code: 'CHAT_SEND_FAILED' });
});
test('applies the same filter to group names submitted through the REST controller', async () => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await createRoom({ user: { id: 1 }, body: { type: 'group', name: 'f.u.c.k club', participantIds: [] } }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(res.json).toHaveBeenCalledWith({ success: false, error: 'CHAT_PROFANITY' });
  expect(ChatRoom.create).not.toHaveBeenCalled();
});
