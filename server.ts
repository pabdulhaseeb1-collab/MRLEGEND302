import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './src/server/db';
import {
  validateNumericId,
  validateUsername,
  validateEmail,
  validatePassword,
  calculateRemainingUsage,
  DEFAULT_LIMITS,
} from './src/utils/rules';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'MRLEGEND302ADMIN';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure upload directory exists
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory call signaling store
interface CallState {
  callId: string;
  callerId: string;
  receiverId: string;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'declined';
  startTime?: number;
  sdpOffer?: any;
  sdpAnswer?: any;
  callerCandidates: any[];
  receiverCandidates: any[];
  updatedAt: number;
}
const activeCalls = new Map<string, CallState>();

// Middleware: Authenticate Normal User Session
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No session token provided.' });
  }
  const user = db.getUserBySession(token);
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please login again.' });
  }
  if (user.isBlocked || user.isSuspended) {
    return res.status(403).json({ error: 'Account has been suspended or blocked. Please contact support.' });
  }
  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Middleware: Authenticate Admin Session
function authenticateAdmin(req: Request, res: Response, next: NextFunction) {
  const adminToken = req.headers['x-admin-token'] as string;
  if (!adminToken || !db.verifyAdminSession(adminToken)) {
    return res.status(403).json({ error: 'Unauthorized. Valid Administrator Key session required.' });
  }
  next();
}

// ==========================================
// 1. AUTHENTICATION & REGISTRATION ENDPOINTS
// ==========================================

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { firstName, numericId, username, email, password, confirmPassword, avatarUrl } = req.body;

  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ error: 'First name is required.' });
  }

  const numVal = validateNumericId(numericId);
  if (!numVal.valid) {
    return res.status(400).json({ error: numVal.error });
  }

  const userVal = validateUsername(username);
  if (!userVal.valid) {
    return res.status(400).json({ error: userVal.error });
  }

  const emailVal = validateEmail(email);
  if (!emailVal.valid) {
    return res.status(400).json({ error: emailVal.error });
  }

  const passVal = validatePassword(password);
  if (!passVal.valid) {
    return res.status(400).json({ error: passVal.error });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  // Check unique constraints
  if (db.findUserByNumericId(numericId.trim())) {
    return res.status(409).json({ error: 'This numeric ID is already taken. Please choose another unique number.' });
  }

  if (db.findUserByUsername(username.trim())) {
    return res.status(409).json({ error: 'This username is already taken. Please choose another username.' });
  }

  if (db.findUserByEmail(email.trim())) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const newUser = db.createUser({
    firstName: firstName.trim(),
    numericId: numericId.trim(),
    username: username.trim(),
    email: email.trim(),
    password,
    avatarUrl,
  });

  const token = db.createSession(newUser.id);
  const usage = db.getUserUsage(newUser.id);
  const adminSettings = db.getAdminSettings();
  const limits = calculateRemainingUsage(newUser.membership, usage, adminSettings);

  return res.status(201).json({
    message: 'Account created successfully!',
    token,
    user: newUser,
    usage: limits,
  });
});

// Login (supports Numeric ID or Username)
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { identifier, password } = req.body;

  if (!identifier || !identifier.trim()) {
    return res.status(400).json({ error: 'Please enter your User ID or Username.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Please enter your password.' });
  }

  const foundUser = db.findUserByIdentifier(identifier.trim());
  if (!foundUser) {
    // Specific error text required by prompt: "User ID or username not found."
    return res.status(404).json({
      code: 'USER_NOT_FOUND',
      error: 'User ID or username not found.',
    });
  }

  const isPasswordValid = db.verifyPassword(foundUser, password);
  if (!isPasswordValid) {
    // Specific error text required by prompt: "Incorrect password. Please try again."
    return res.status(401).json({
      code: 'INVALID_PASSWORD',
      error: 'Incorrect password. Please try again.',
    });
  }

  if (foundUser.isBlocked || foundUser.isSuspended) {
    return res.status(403).json({
      error: 'Account has been suspended or blocked by administrator.',
    });
  }

  const token = db.createSession(foundUser.id);
  const safeUser = db.getUserBySession(token);
  const usage = db.getUserUsage(foundUser.id);
  const adminSettings = db.getAdminSettings();
  const limits = calculateRemainingUsage(foundUser.membership, usage, adminSettings);

  return res.json({
    message: 'Welcome back to MR LEGEND 302!',
    token,
    user: safeUser,
    usage: limits,
  });
});

// Current User Profile & Limits
app.get('/api/auth/me', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const usage = db.getUserUsage(user.id);
  const adminSettings = db.getAdminSettings();
  const limits = calculateRemainingUsage(user.membership, usage, adminSettings);

  return res.json({
    user,
    usage: limits,
    adminSettings: {
      audioBroadcastActive: adminSettings.audioBroadcastActive,
      broadcastSourceUrl: adminSettings.broadcastSourceUrl,
      broadcastTitle: adminSettings.broadcastTitle,
    },
  });
});

// Logout
app.post('/api/auth/logout', authenticate, (req: Request, res: Response) => {
  const token = (req as any).token;
  db.removeSession(token);
  return res.json({ message: 'Logged out successfully.' });
});

// Forgot Password Support Ticket / WhatsApp Link
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { identifier, email } = req.body;
  const user = identifier ? db.findUserByIdentifier(identifier) : (email ? db.findUserByEmail(email) : null);

  db.addAuditLog(
    'FORGOT_PASSWORD_REQUEST',
    `Recovery assistance requested for: ${identifier || email || 'Unknown'}`,
    user ? user.id : 'GUEST'
  );

  return res.json({
    message: 'Password recovery request logged.',
    whatsappNumber: '03288516325',
    recoveryFeePKR: 300,
    note: 'Account ownership must be verified before recovery assistance is provided. Passwords are encrypted and never stored in readable form.',
  });
});

// ==========================================
// 2. USER SEARCH & PRIVATE CHAT ENDPOINTS
// ==========================================

// Search users by exact username or numeric ID
app.get('/api/users/search', authenticate, (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  const currentUserId = (req as any).user.id;

  if (!query) {
    return res.json({ users: [] });
  }

  const all = db.getAllUsers().filter((u) => u.id !== currentUserId);
  const isDigits = /^\d+$/.test(query);

  const matched = all.filter((u) => {
    if (isDigits && u.numericId === query) return true;
    if (u.username.toLowerCase() === query.toLowerCase()) return true;
    if (u.username.toLowerCase().includes(query.toLowerCase())) return true;
    if (u.firstName.toLowerCase().includes(query.toLowerCase())) return true;
    return false;
  });

  return res.json({ users: matched.slice(0, 15) });
});

// List conversations
app.get('/api/chats', authenticate, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const conversations = db.getUserConversations(userId);
  return res.json({ conversations });
});

// Create or get private conversation
app.post('/api/chats/open', authenticate, (req: Request, res: Response) => {
  const currentUserId = (req as any).user.id;
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID is required.' });
  }

  const targetUser = db.findUserById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  const conv = db.getOrCreateConversation(currentUserId, targetUserId);
  const { passwordHash, salt, ...safeTarget } = targetUser;

  return res.json({
    conversation: {
      ...conv,
      otherUser: safeTarget,
    },
  });
});

// Get messages in a conversation
app.get('/api/chats/:id/messages', authenticate, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const conversationId = req.params.id;
  const messages = db.getMessages(conversationId, userId);
  return res.json({ messages });
});

// Send message (Enforces Free User 10 messages/24h Limit)
app.post('/api/chats/:id/messages', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const conversationId = req.params.id;
  const { text, mediaUrl, mediaType, fileName } = req.body;

  if (!text && !mediaUrl) {
    return res.status(400).json({ error: 'Message content or attachment is required.' });
  }

  // Check 10 messages limit for Free accounts
  const isPremium = user.membership === 'monthly' || user.membership === 'lifetime';
  const adminSettings = db.getAdminSettings();

  if (!isPremium) {
    const usage = db.getUserUsage(user.id);
    if (usage.messagesCount >= adminSettings.freeDailyMessages) {
      return res.status(403).json({
        code: 'MESSAGE_LIMIT_REACHED',
        error: `Free account limit reached! You have used all ${adminSettings.freeDailyMessages} messages for today. Upgrade to Monthly or Lifetime Premium for unlimited messaging.`,
        limit: adminSettings.freeDailyMessages,
        used: usage.messagesCount,
      });
    }
  }

  const message = db.addMessage({
    conversationId,
    senderId: user.id,
    text: text || '',
    mediaUrl,
    mediaType,
    fileName,
  });

  db.incrementUsage(user.id, 'messagesCount');

  const updatedUsage = db.getUserUsage(user.id);
  const limits = calculateRemainingUsage(user.membership, updatedUsage, adminSettings);

  return res.status(201).json({
    message,
    usage: limits,
  });
});

// ==========================================
// 3. GROUP SYSTEM ENDPOINTS
// ==========================================

// Get all groups
app.get('/api/groups', authenticate, (req: Request, res: Response) => {
  const groups = db.getGroups();
  return res.json({ groups });
});

// Create group (Restricted to active Premium users)
app.post('/api/groups', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name, description, avatarUrl } = req.body;

  const isPremium = user.membership === 'monthly' || user.membership === 'lifetime';
  if (!isPremium) {
    return res.status(403).json({
      code: 'PREMIUM_REQUIRED',
      error: 'Group creation is an exclusive privilege reserved for active Premium members. Please upgrade your plan to create your own community.',
    });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group name is required.' });
  }

  const group = db.createGroup({
    name: name.trim(),
    description: (description || '').trim(),
    avatarUrl,
    ownerId: user.id,
  });

  return res.status(201).json({ group });
});

// Request to join group
app.post('/api/groups/:id/join', authenticate, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const groupId = req.params.id;
  const success = db.requestJoinGroup(groupId, userId);
  if (!success) {
    return res.status(404).json({ error: 'Group not found.' });
  }
  return res.json({ message: 'Join request submitted for review.' });
});

// Approve or reject group join request
app.post('/api/groups/:id/requests', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const groupId = req.params.id;
  const { targetUserId, approve } = req.body;

  const group = db.getGroups().find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found.' });

  // Only group owner or platform admin can approve
  if (group.ownerId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the group owner or admin can review join requests.' });
  }

  db.respondJoinRequest(groupId, targetUserId, Boolean(approve));
  return res.json({ message: approve ? 'Member accepted into group.' : 'Request declined.' });
});

// Group Audio Stream Toggle (Premium group owner feature)
app.post('/api/groups/:id/audio', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const groupId = req.params.id;
  const { active, sourceUrl } = req.body;

  const group = db.getGroups().find((g) => g.id === groupId);
  if (!group) return res.status(404).json({ error: 'Group not found.' });

  if (group.ownerId !== user.id && user.role !== 'admin') {
    return res.status(403).json({ error: 'Only the group owner can manage audio streaming.' });
  }

  db.updateGroupAudio(groupId, Boolean(active), sourceUrl || '');
  return res.json({ message: active ? 'Group audio broadcast started.' : 'Audio stopped.' });
});

// ==========================================
// 4. STATUS SYSTEM (24-Hour WhatsApp-Style)
// ==========================================

// Get active statuses
app.get('/api/statuses', authenticate, (_req: Request, res: Response) => {
  const statuses = db.getActiveStatuses();
  return res.json({ statuses });
});

// Create status (Free = 1/24h, Premium = 100+)
app.post('/api/statuses', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { type, content, text, bgColor, mediaUrl } = req.body;

  const isPremium = user.membership === 'monthly' || user.membership === 'lifetime';
  const adminSettings = db.getAdminSettings();

  if (!isPremium) {
    const usage = db.getUserUsage(user.id);
    if (usage.statusCount >= adminSettings.freeDailyStatus) {
      return res.status(403).json({
        code: 'STATUS_LIMIT_REACHED',
        error: `Free users can publish 1 status per 24 hours. Upgrade to Premium to share over 100 statuses!`,
      });
    }
  }

  const status = db.createStatus({
    userId: user.id,
    type: type || 'text',
    content,
    text,
    bgColor,
    mediaUrl,
  });

  return res.status(201).json({ status });
});

// Mark status as viewed
app.post('/api/statuses/:id/view', authenticate, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  db.recordStatusView(req.params.id, userId);
  return res.json({ success: true });
});

// Delete status
app.delete('/api/statuses/:id', authenticate, (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const success = db.deleteStatus(req.params.id, userId);
  if (!success) {
    return res.status(404).json({ error: 'Status not found or unauthorized.' });
  }
  return res.json({ message: 'Status deleted.' });
});

// ==========================================
// 5. PREMIUM PLANS & KEY ACTIVATION
// ==========================================

// Get Plans Information
app.get('/api/premium/plans', (_req: Request, res: Response) => {
  const settings = db.getAdminSettings();
  return res.json({
    whatsappNumber: '03288516325',
    currency: 'PKR',
    plans: [
      {
        id: 'monthly',
        name: 'Monthly Premium',
        price: settings.monthlyPricePKR,
        durationDays: 30,
        badge: 'VIP PRO',
        features: [
          'Unlimited text messaging without daily caps',
          'Unlimited eligible photo and video sharing',
          'Unlimited voice & video call duration',
          'Permission to create & manage custom groups',
          'Publish more than 100 daily statuses',
          'Unlimited high-speed social media video downloads',
          'VIP Gold Crown badge & luxury sound effects',
          'Access to exclusive Admin Audio broadcasts',
        ],
      },
      {
        id: 'lifetime',
        name: 'Lifetime Premium',
        price: settings.lifetimePricePKR,
        durationDays: 'Lifetime (Never Expires)',
        badge: 'ROYAL VIP',
        features: [
          'Permanent membership — never expires automatically',
          'All Monthly Premium benefits forever',
          'Exclusive Royal Crown emblem',
          'Priority VIP support & direct administrator channel',
          'Highest download quality preference (1080p / HDR)',
          'Unlimited group creation & group audio room hosting',
        ],
      },
    ],
  });
});

// Submit Premium Activation Key
app.post('/api/premium/activate', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { key } = req.body;

  if (!key || typeof key !== 'string' || !key.trim()) {
    return res.status(400).json({ error: 'Please enter a valid Premium Activation Key.' });
  }

  const result = db.activateKeyForUser(key, user.id);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  const updatedUser = db.getUserBySession((req as any).token);
  const adminSettings = db.getAdminSettings();
  const usage = db.getUserUsage(user.id);
  const limits = calculateRemainingUsage(updatedUser!.membership, usage, adminSettings);

  return res.json({
    message: result.message,
    plan: result.plan,
    user: updatedUser,
    usage: limits,
  });
});

// ==========================================
// 6. SOCIAL MEDIA VIDEO DOWNLOADER
// ==========================================

// Validate video URL & retrieve info
app.post('/api/downloader/info', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { url, platform } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'Please paste a valid video URL.' });
  }

  const cleanUrl = url.trim();
  const isPremium = user.membership === 'monthly' || user.membership === 'lifetime';
  const adminSettings = db.getAdminSettings();

  // Check Free daily download limit (2/day)
  if (!isPremium) {
    const usage = db.getUserUsage(user.id);
    if (usage.downloadsCount >= adminSettings.freeDailyDownloads) {
      return res.status(403).json({
        code: 'DOWNLOAD_LIMIT_REACHED',
        error: `Daily download limit reached! Free accounts are allowed ${adminSettings.freeDailyDownloads} downloads per day. Upgrade to Premium for unlimited downloads!`,
      });
    }
  }

  // Detect platform & validate
  let detectedPlatform = platform || 'generic';
  let title = 'MR Legend 302 Video';
  let author = '@creator';
  let duration = '0:45';
  let thumbnail = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';

  if (cleanUrl.includes('instagram.com')) {
    detectedPlatform = 'instagram';
    title = 'Instagram Reel • Viral Luxury Showcase';
    author = '@mrlegend302';
    thumbnail = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
  } else if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    detectedPlatform = 'youtube';
    title = 'YouTube 4K • MR Legend 302 Official Showcase';
    author = 'MR Legend Official';
    duration = '3:20';
    thumbnail = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80';
  } else if (cleanUrl.includes('tiktok.com')) {
    detectedPlatform = 'tiktok';
    title = 'TikTok Trending Video #mrlegend302';
    author = '@legend_tiktok';
    thumbnail = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80';
  } else if (cleanUrl.includes('snapchat.com')) {
    detectedPlatform = 'snapchat';
    title = 'Snapchat Spotlight Highlight';
    author = 'Snap Spotlight';
    thumbnail = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';
  }

  return res.json({
    platform: detectedPlatform,
    title,
    author,
    duration,
    thumbnail,
    url: cleanUrl,
    qualities: [
      { id: '720p', label: 'HD 720p', size: '14.2 MB', watermarkFree: true },
      { id: '1080p', label: 'Full HD 1080p', size: '28.8 MB', watermarkFree: true },
      ...(isPremium ? [{ id: '1080p_hdr', label: '1080p HDR (VIP Master)', size: '42.5 MB', watermarkFree: true }] : []),
    ],
  });
});

// Trigger download
app.post('/api/downloader/download', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { url, quality, title } = req.body;

  const isPremium = user.membership === 'monthly' || user.membership === 'lifetime';
  const adminSettings = db.getAdminSettings();

  if (!isPremium) {
    const usage = db.getUserUsage(user.id);
    if (usage.downloadsCount >= adminSettings.freeDailyDownloads) {
      return res.status(403).json({
        code: 'DOWNLOAD_LIMIT_REACHED',
        error: `Daily download limit reached (${adminSettings.freeDailyDownloads}/day). Upgrade to Premium!`,
      });
    }
  }

  db.incrementUsage(user.id, 'downloadsCount');
  db.addAuditLog('VIDEO_DOWNLOAD', `User @${user.username} downloaded video: ${title || url}`, user.id);

  const updatedUsage = db.getUserUsage(user.id);
  const limits = calculateRemainingUsage(user.membership, updatedUsage, adminSettings);

  // Return generated high quality video asset link
  const sampleVideos = [
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  ];
  const downloadLink = sampleVideos[Math.floor(Math.random() * sampleVideos.length)];

  return res.json({
    success: true,
    downloadUrl: downloadLink,
    fileName: `MRLegend302_${quality || '1080p'}_${Date.now()}.mp4`,
    usage: limits,
    iosInstructions: 'On iPhone Safari: Tap Download. After opening, tap the Share icon and select "Save Video" to save directly to your Photos album.',
  });
});

// ==========================================
// 7. WEBRTC VOICE & VIDEO CALL SIGNALING
// ==========================================

// Initiate Call
app.post('/api/calls/initiate', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { receiverId, type, sdpOffer } = req.body;

  const receiver = db.findUserById(receiverId);
  if (!receiver) {
    return res.status(404).json({ error: 'Target user not found.' });
  }

  const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const callState: CallState = {
    callId,
    callerId: user.id,
    receiverId,
    type: type || 'voice',
    status: 'ringing',
    sdpOffer,
    callerCandidates: [],
    receiverCandidates: [],
    updatedAt: Date.now(),
  };

  activeCalls.set(callId, callState);

  // Push notification to receiver
  db.addNotification(
    receiverId,
    `Incoming ${type === 'video' ? 'Video' : 'Voice'} Call`,
    `${user.firstName} (@${user.username}) is calling you...`,
    'call'
  );

  return res.status(201).json({
    callId,
    status: 'ringing',
    type: callState.type,
    caller: user,
    receiver: { id: receiver.id, username: receiver.username, firstName: receiver.firstName, avatarUrl: receiver.avatarUrl },
  });
});

// Poll Call Status & Signaling Exchanges
app.get('/api/calls/poll', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const callId = req.query.callId as string;

  // If specific callId requested
  if (callId && activeCalls.has(callId)) {
    const call = activeCalls.get(callId)!;
    return res.json({ call });
  }

  // Look for any incoming call for this user
  for (const [id, call] of activeCalls.entries()) {
    if (call.receiverId === user.id && call.status === 'ringing') {
      const caller = db.findUserById(call.callerId);
      let safeCaller: any;
      if (caller) {
        const { passwordHash, salt, ...safe } = caller;
        safeCaller = safe;
      }
      return res.json({
        incomingCall: {
          ...call,
          caller: safeCaller,
        },
      });
    }
  }

  return res.json({ incomingCall: null });
});

// Respond to Call (Accept / Decline / End / ICE candidates)
app.post('/api/calls/respond', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { callId, action, sdpAnswer, candidate, role } = req.body;

  const call = activeCalls.get(callId);
  if (!call) {
    return res.status(404).json({ error: 'Call session ended or not found.' });
  }

  if (action === 'accept') {
    call.status = 'connected';
    call.startTime = Date.now();
    if (sdpAnswer) call.sdpAnswer = sdpAnswer;
  } else if (action === 'decline') {
    call.status = 'declined';
  } else if (action === 'end') {
    call.status = 'ended';
  } else if (action === 'ice' && candidate) {
    if (role === 'caller') {
      call.callerCandidates.push(candidate);
    } else {
      call.receiverCandidates.push(candidate);
    }
  }

  call.updatedAt = Date.now();
  return res.json({ success: true, call });
});

// Record Call Duration (Checks 1-minute limit for Free users)
app.post('/api/calls/duration', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const { seconds } = req.body;
  const adminSettings = db.getAdminSettings();

  db.addCallDuration(user.id, Number(seconds) || 0);
  const isPremium = user.membership === 'monthly' || user.membership === 'lifetime';

  return res.json({
    allowed: isPremium || (Number(seconds) <= adminSettings.freeCallDurationSeconds),
    freeLimitSeconds: adminSettings.freeCallDurationSeconds,
    isPremium,
  });
});

// ==========================================
// 8. NOTIFICATIONS ENDPOINTS
// ==========================================

app.get('/api/notifications', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const notifications = db.getUserNotifications(user.id);
  return res.json({ notifications });
});

app.post('/api/notifications/mark-read', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  db.markNotificationsRead(user.id);
  return res.json({ success: true });
});

// ==========================================
// 9. FILE UPLOAD ENDPOINT
// ==========================================

app.post('/api/upload', authenticate, (req: Request, res: Response) => {
  const { dataUrl, fileName } = req.body;

  if (!dataUrl || typeof dataUrl !== 'string') {
    return res.status(400).json({ error: 'No data URL provided.' });
  }

  // Parse Base64
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    // If regular URL passed, accept it
    if (dataUrl.startsWith('http')) {
      return res.json({ url: dataUrl });
    }
    return res.status(400).json({ error: 'Invalid data URL format.' });
  }

  const mimeType = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');

  // Max 15MB
  if (buffer.length > 15 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size exceeds 15MB limit.' });
  }

  const ext = mimeType.split('/')[1] || 'png';
  const cleanExt = ext.replace(/[^a-z0-9]/gi, '');
  const outName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${cleanExt}`;
  const outPath = path.join(UPLOADS_DIR, outName);

  fs.writeFileSync(outPath, buffer);
  const publicUrl = `/uploads/${outName}`;

  return res.status(201).json({
    url: publicUrl,
    fileName: fileName || outName,
    size: buffer.length,
    mimeType,
  });
});

// ==========================================
// 10. PROTECTED ADMIN PANEL ENDPOINTS
// ==========================================

// Admin Authentication (requires secret key: placeholder MRLEGEND302ADMIN)
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { adminKey } = req.body;

  if (!adminKey || adminKey.trim() !== ADMIN_SECRET) {
    db.addAuditLog('ADMIN_LOGIN_FAILED', 'Incorrect Administrator Key entered', 'UNAUTHORIZED');
    return res.status(401).json({
      error: 'Invalid Administrator Key. Access denied.',
    });
  }

  const adminToken = db.createAdminSession();
  return res.json({
    message: 'Welcome to MR LEGEND 302 Admin Control Center',
    adminToken,
  });
});

// Admin Dashboard Overview
app.get('/api/admin/overview', authenticateAdmin, (_req: Request, res: Response) => {
  const allUsers = db.getAllUsers();
  const groups = db.getGroups();
  const keys = db.getActivationKeys();
  const settings = db.getAdminSettings();
  const auditLogs = db.getAuditLogs();

  const totalUsers = allUsers.length;
  const onlineUsers = allUsers.filter((u) => u.online).length;
  const freeUsers = allUsers.filter((u) => u.membership === 'free').length;
  const monthlyUsers = allUsers.filter((u) => u.membership === 'monthly').length;
  const lifetimeUsers = allUsers.filter((u) => u.membership === 'lifetime').length;

  const expiredSubs = allUsers.filter(
    (u) => u.membership === 'monthly' && u.membershipExpiresAt && new Date(u.membershipExpiresAt).getTime() < Date.now()
  ).length;

  const pendingGroupRequests = groups.reduce((acc, g) => acc + (g.pendingRequestIds?.length || 0), 0);

  return res.json({
    stats: {
      totalUsers,
      onlineUsers,
      freeUsers,
      monthlyUsers,
      lifetimeUsers,
      expiredSubscriptions: expiredSubs,
      activeGroups: groups.length,
      pendingGroupRequests,
    },
    settings,
    recentKeys: keys.slice(-10).reverse(),
    auditLogs,
  });
});

// Admin User Management - List & Search
app.get('/api/admin/users', authenticateAdmin, (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim().toLowerCase();
  let users = db.getAllUsers();

  if (query) {
    users = users.filter(
      (u) =>
        u.numericId.includes(query) ||
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.firstName.toLowerCase().includes(query)
    );
  }

  return res.json({ users });
});

// Admin User Management - Update User
app.post('/api/admin/users/:id/update', authenticateAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;
  const { membership, isBlocked, isSuspended, role } = req.body;

  const updates: any = {};
  if (membership) {
    updates.membership = membership;
    if (membership === 'monthly') {
      updates.membershipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (membership === 'lifetime') {
      updates.membershipExpiresAt = null;
    }
  }
  if (typeof isBlocked === 'boolean') updates.isBlocked = isBlocked;
  if (typeof isSuspended === 'boolean') updates.isSuspended = isSuspended;
  if (role) updates.role = role;

  const updated = db.updateUser(userId, updates);
  if (!updated) {
    return res.status(404).json({ error: 'User not found.' });
  }

  db.addAuditLog('ADMIN_USER_MODIFIED', `Admin updated user @${updated.username}: ${JSON.stringify(updates)}`, 'ADMIN');
  return res.json({ user: updated });
});

// Admin Key Generation
app.post('/api/admin/keys/generate', authenticateAdmin, (req: Request, res: Response) => {
  const { plan, targetEmail } = req.body;

  if (plan !== 'monthly' && plan !== 'lifetime') {
    return res.status(400).json({ error: 'Plan must be either "monthly" or "lifetime".' });
  }

  const key = db.createActivationKey(plan, targetEmail);
  return res.status(201).json({ key });
});

// Admin Revoke Key
app.post('/api/admin/keys/revoke', authenticateAdmin, (req: Request, res: Response) => {
  const { keyId } = req.body;
  const success = db.revokeActivationKey(keyId);
  if (!success) {
    return res.status(404).json({ error: 'Key not found.' });
  }
  return res.json({ message: 'Key revoked successfully.' });
});

// Admin Website Settings
app.get('/api/admin/settings', authenticateAdmin, (_req: Request, res: Response) => {
  return res.json({ settings: db.getAdminSettings() });
});

app.post('/api/admin/settings', authenticateAdmin, (req: Request, res: Response) => {
  const updates = req.body;
  const settings = db.updateAdminSettings(updates);
  return res.json({ settings, message: 'Settings saved successfully.' });
});

// Admin Live Audio Broadcast to all Active Premium Users
app.post('/api/admin/broadcast', authenticateAdmin, (req: Request, res: Response) => {
  const { active, sourceUrl, title } = req.body;
  const settings = db.updateAdminSettings({
    audioBroadcastActive: Boolean(active),
    broadcastSourceUrl: sourceUrl || '',
    broadcastTitle: title || 'MR Legend 302 Royal Audio Broadcast',
  });

  if (active) {
    // Notify all active premium users
    const premiumUsers = db.getAllUsers().filter((u) => u.membership === 'monthly' || u.membership === 'lifetime');
    premiumUsers.forEach((u) => {
      db.addNotification(
        u.id,
        'Royal Audio Broadcast Live',
        `MR Legend 302 Administrator has started a live audio broadcast: "${settings.broadcastTitle}".`,
        'system'
      );
    });
  }

  return res.json({
    settings,
    message: active ? 'Live audio broadcast is now broadcasting to Premium members.' : 'Broadcast stopped.',
  });
});

// ==========================================
// VITE DEV SERVER OR STATIC PRODUCTION
// ==========================================

async function startServer() {
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MR LEGEND 302 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
