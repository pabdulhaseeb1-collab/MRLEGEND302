import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  User,
  Message,
  Conversation,
  Group,
  StatusItem,
  ActivationKey,
  AdminSettings,
  AppNotification,
  UserUsageData,
} from '../types';
import { DEFAULT_LIMITS } from '../utils/rules';

interface DBUser extends User {
  passwordHash: string;
  salt: string;
}

interface DBSchema {
  users: DBUser[];
  conversations: Conversation[];
  messages: Message[];
  groups: Group[];
  statuses: StatusItem[];
  activationKeys: ActivationKey[];
  adminSettings: AdminSettings;
  notifications: AppNotification[];
  usage: Record<string, UserUsageData>; // key: `${userId}_${dateString}`
  sessions: Record<string, { userId: string; createdAt: number }>;
  adminSessions: Record<string, { createdAt: number }>;
  auditLogs: Array<{ id: string; action: string; details: string; performedBy: string; timestamp: string }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'mrlegend_db.json');

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateActivationKey(): string {
  const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const p3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `MRL-302-${p1}-${p2}-${p3}`;
}

export class Database {
  private data: DBSchema;

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DBSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, reinitializing', err);
      }
    }
    return this.createInitialDatabase();
  }

  private persist() {
    try {
      this.ensureDataDir();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database:', err);
    }
  }

  private createInitialDatabase(): DBSchema {
    const saltAdmin = generateSalt();
    const saltVip = generateSalt();
    const saltSara = generateSalt();

    const adminUser: DBUser = {
      id: 'usr_admin302',
      numericId: '302',
      username: 'legend302',
      email: 'admin@mrlegend302.pk',
      firstName: 'MR Legend 302',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      role: 'admin',
      membership: 'lifetime',
      membershipExpiresAt: null,
      isSuspended: false,
      isBlocked: false,
      online: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      salt: saltAdmin,
      passwordHash: hashPassword('MRLEGEND302ADMIN', saltAdmin),
    };

    const vipUser: DBUser = {
      id: 'usr_vip2002',
      numericId: '2002',
      username: 'vip_ali',
      email: 'ali@mrlegend302.pk',
      firstName: 'Ali Khan',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
      role: 'user',
      membership: 'monthly',
      membershipExpiresAt: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      isSuspended: false,
      isBlocked: false,
      online: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      salt: saltVip,
      passwordHash: hashPassword('Ali123456!', saltVip),
    };

    const freeUser: DBUser = {
      id: 'usr_sara3003',
      numericId: '3003',
      username: 'sara_tech',
      email: 'sara@example.com',
      firstName: 'Sara Ahmed',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
      role: 'user',
      membership: 'free',
      membershipExpiresAt: null,
      isSuspended: false,
      isBlocked: false,
      online: false,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date().toISOString(),
      salt: saltSara,
      passwordHash: hashPassword('Sara123456!', saltSara),
    };

    const initialGroup: Group = {
      id: 'grp_legend_vip',
      name: 'MR LEGEND 302 VIP Lounge',
      description: 'Exclusive community for elite members of MR Legend 302 with live audio rooms and priority updates.',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      ownerId: adminUser.id,
      memberIds: [adminUser.id, vipUser.id],
      pendingRequestIds: [freeUser.id],
      audioStreamActive: false,
      audioSourceUrl: '',
      createdAt: new Date().toISOString(),
    };

    const initialKey: ActivationKey = {
      id: 'key_welcome_1',
      key: 'MRL-302-GOLD-LUCK',
      plan: 'monthly',
      targetEmail: 'newuser@mrlegend302.pk',
      status: 'unused',
      createdBy: adminUser.id,
      createdAt: new Date().toISOString(),
    };

    const initialLifetimeKey: ActivationKey = {
      id: 'key_lifetime_1',
      key: 'MRL-302-LIFE-VIP1',
      plan: 'lifetime',
      targetEmail: '',
      status: 'unused',
      createdBy: adminUser.id,
      createdAt: new Date().toISOString(),
    };

    const initialConversation: Conversation = {
      id: 'conv_admin_vip',
      participantIds: [adminUser.id, vipUser.id],
      updatedAt: new Date().toISOString(),
      lastMessage: {
        id: 'msg_welcome_init',
        conversationId: 'conv_admin_vip',
        senderId: adminUser.id,
        text: 'Welcome to MR LEGEND 302! Your VIP membership is fully verified.',
        createdAt: new Date().toISOString(),
        read: true,
      },
    };

    const initialMessage: Message = {
      id: 'msg_welcome_init',
      conversationId: 'conv_admin_vip',
      senderId: adminUser.id,
      text: 'Welcome to MR LEGEND 302! Your VIP membership is fully verified.',
      createdAt: new Date().toISOString(),
      read: true,
    };

    const initialStatus: StatusItem = {
      id: 'stat_admin_1',
      userId: adminUser.id,
      type: 'text',
      content: 'Official Launch of MR LEGEND 302: The Ultimate Luxury Communication & Social Platform ✨',
      bgColor: 'from-purple-900 to-indigo-950',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewerIds: [vipUser.id],
    };

    const initialSchema: DBSchema = {
      users: [adminUser, vipUser, freeUser],
      conversations: [initialConversation],
      messages: [initialMessage],
      groups: [initialGroup],
      statuses: [initialStatus],
      activationKeys: [initialKey, initialLifetimeKey],
      adminSettings: {
        monthlyPricePKR: 500,
        lifetimePricePKR: 2500,
        freeDailyMessages: DEFAULT_LIMITS.freeDailyMessages,
        freeCallDurationSeconds: DEFAULT_LIMITS.freeCallDurationSeconds,
        freeDailyDownloads: DEFAULT_LIMITS.freeDailyDownloads,
        freeDailyStatus: DEFAULT_LIMITS.freeDailyStatus,
        welcomeUrduVoice: true,
        audioBroadcastActive: false,
        broadcastSourceUrl: '',
        broadcastTitle: 'MR Legend 302 Royal Broadcast',
      },
      notifications: [
        {
          id: 'notif_init_1',
          userId: vipUser.id,
          title: 'Welcome to VIP Tier',
          message: 'Your Monthly Premium status is active. Enjoy unlimited messaging and high quality downloads!',
          type: 'premium',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ],
      usage: {},
      sessions: {},
      adminSessions: {},
      auditLogs: [
        {
          id: 'log_init',
          action: 'SYSTEM_STARTUP',
          details: 'MR LEGEND 302 platform initialized with secure database and pre-configured luxury services.',
          performedBy: 'SYSTEM',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    this.data = initialSchema;
    this.persist();
    return initialSchema;
  }

  // --- User Operations ---

  public getAllUsers(): User[] {
    return this.data.users.map(({ passwordHash, salt, ...u }) => u);
  }

  public findUserById(id: string): DBUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByNumericId(numericId: string): DBUser | undefined {
    return this.data.users.find((u) => u.numericId === numericId);
  }

  public findUserByUsername(username: string): DBUser | undefined {
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserByEmail(email: string): DBUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByIdentifier(identifier: string): DBUser | undefined {
    const trimmed = identifier.trim();
    if (/^\d+$/.test(trimmed)) {
      const byNum = this.findUserByNumericId(trimmed);
      if (byNum) return byNum;
    }
    return this.findUserByUsername(trimmed);
  }

  public verifyPassword(user: DBUser, passwordAttempt: string): boolean {
    const hash = hashPassword(passwordAttempt, user.salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
  }

  public createUser(userData: {
    numericId: string;
    username: string;
    email: string;
    firstName: string;
    avatarUrl?: string;
    password: string;
  }): User {
    const salt = generateSalt();
    const passwordHash = hashPassword(userData.password, salt);
    const newUser: DBUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      numericId: userData.numericId,
      username: userData.username.toLowerCase(),
      email: userData.email.toLowerCase(),
      firstName: userData.firstName,
      avatarUrl:
        userData.avatarUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(userData.username)}`,
      role: 'user',
      membership: 'free',
      membershipExpiresAt: null,
      isSuspended: false,
      isBlocked: false,
      online: true,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      salt,
      passwordHash,
    };

    this.data.users.push(newUser);
    this.addAuditLog('USER_REGISTERED', `User registered: @${newUser.username} (ID: ${newUser.numericId})`, newUser.id);
    this.persist();

    const { passwordHash: _, salt: __, ...publicUser } = newUser;
    return publicUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.persist();
    const { passwordHash, salt, ...safeUser } = this.data.users[idx];
    return safeUser;
  }

  // --- Session Management ---

  public createSession(userId: string): string {
    const token = generateToken();
    this.data.sessions[token] = { userId, createdAt: Date.now() };
    const user = this.findUserById(userId);
    if (user) {
      user.online = true;
      user.lastSeen = new Date().toISOString();
    }
    this.persist();
    return token;
  }

  public getUserBySession(token: string): User | null {
    const sess = this.data.sessions[token];
    if (!sess) return null;
    const user = this.findUserById(sess.userId);
    if (!user) return null;
    // Check membership expiration on the fly
    if (user.membership === 'monthly' && user.membershipExpiresAt) {
      if (new Date(user.membershipExpiresAt).getTime() <= Date.now()) {
        user.membership = 'free';
        user.membershipExpiresAt = null;
        this.persist();
      }
    }
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public removeSession(token: string) {
    const sess = this.data.sessions[token];
    if (sess) {
      const user = this.findUserById(sess.userId);
      if (user) {
        user.online = false;
        user.lastSeen = new Date().toISOString();
      }
      delete this.data.sessions[token];
      this.persist();
    }
  }

  // --- Admin Session Management ---

  public createAdminSession(): string {
    const token = generateToken();
    this.data.adminSessions[token] = { createdAt: Date.now() };
    this.addAuditLog('ADMIN_LOGIN', 'Administrator access granted', 'ADMIN');
    this.persist();
    return token;
  }

  public verifyAdminSession(token: string): boolean {
    if (!token) return false;
    const sess = this.data.adminSessions[token];
    if (!sess) return false;
    // 24 hour expiry
    if (Date.now() - sess.createdAt > 24 * 60 * 60 * 1000) {
      delete this.data.adminSessions[token];
      this.persist();
      return false;
    }
    return true;
  }

  public removeAdminSession(token: string) {
    if (this.data.adminSessions[token]) {
      delete this.data.adminSessions[token];
      this.persist();
    }
  }

  // --- Daily Usage Tracking ---

  private getTodayKey(userId: string): string {
    const dateStr = new Date().toISOString().slice(0, 10);
    return `${userId}_${dateStr}`;
  }

  public getUserUsage(userId: string): UserUsageData {
    const key = this.getTodayKey(userId);
    if (!this.data.usage[key]) {
      this.data.usage[key] = {
        messagesCount: 0,
        callsSecondsUsed: 0,
        downloadsCount: 0,
        statusCount: 0,
        lastResetDate: new Date().toISOString().slice(0, 10),
      };
    }
    return this.data.usage[key];
  }

  public incrementUsage(
    userId: string,
    field: 'messagesCount' | 'downloadsCount' | 'statusCount',
    amount = 1
  ): UserUsageData {
    const usage = this.getUserUsage(userId);
    usage[field] = (usage[field] || 0) + amount;
    this.persist();
    return usage;
  }

  public addCallDuration(userId: string, seconds: number): UserUsageData {
    const usage = this.getUserUsage(userId);
    usage.callsSecondsUsed = (usage.callsSecondsUsed || 0) + seconds;
    this.persist();
    return usage;
  }

  // --- Conversations & Messages ---

  public getOrCreateConversation(userAId: string, userBId: string): Conversation {
    const sorted = [userAId, userBId].sort();
    let conv = this.data.conversations.find((c) => {
      const cSorted = [...c.participantIds].sort();
      return cSorted[0] === sorted[0] && cSorted[1] === sorted[1];
    });

    if (!conv) {
      conv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        participantIds: sorted,
        updatedAt: new Date().toISOString(),
      };
      this.data.conversations.push(conv);
      this.persist();
    }
    return conv;
  }

  public getUserConversations(userId: string): Conversation[] {
    const userConvs = this.data.conversations.filter((c) => c.participantIds.includes(userId));
    return userConvs
      .map((c) => {
        const otherId = c.participantIds.find((id) => id !== userId);
        const otherUser = otherId ? this.findUserById(otherId) : undefined;
        let safeOther: User | undefined;
        if (otherUser) {
          const { passwordHash, salt, ...safe } = otherUser;
          safeOther = safe;
        }
        const lastMsg = this.data.messages
          .filter((m) => m.conversationId === c.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        return {
          ...c,
          otherUser: safeOther,
          lastMessage: lastMsg,
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getMessages(conversationId: string, userId: string): Message[] {
    const conv = this.data.conversations.find((c) => c.id === conversationId);
    if (!conv || !conv.participantIds.includes(userId)) {
      return [];
    }
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addMessage(msg: {
    conversationId: string;
    senderId: string;
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video' | 'file';
    fileName?: string;
  }): Message {
    const newMsg: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      text: msg.text,
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      fileName: msg.fileName,
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.data.messages.push(newMsg);

    const conv = this.data.conversations.find((c) => c.id === msg.conversationId);
    if (conv) {
      conv.updatedAt = newMsg.createdAt;
      conv.lastMessage = newMsg;
    }
    this.persist();
    return newMsg;
  }

  // --- Groups ---

  public getGroups(): Group[] {
    return this.data.groups;
  }

  public createGroup(data: {
    name: string;
    description: string;
    avatarUrl?: string;
    ownerId: string;
  }): Group {
    const newGroup: Group = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: data.name,
      description: data.description,
      avatarUrl:
        data.avatarUrl ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
      ownerId: data.ownerId,
      memberIds: [data.ownerId],
      pendingRequestIds: [],
      audioStreamActive: false,
      createdAt: new Date().toISOString(),
    };
    this.data.groups.push(newGroup);
    this.addAuditLog('GROUP_CREATED', `Group created: "${newGroup.name}"`, data.ownerId);
    this.persist();
    return newGroup;
  }

  public requestJoinGroup(groupId: string, userId: string): boolean {
    const grp = this.data.groups.find((g) => g.id === groupId);
    if (!grp) return false;
    if (grp.memberIds.includes(userId)) return true;
    if (!grp.pendingRequestIds.includes(userId)) {
      grp.pendingRequestIds.push(userId);
      this.persist();
    }
    return true;
  }

  public respondJoinRequest(groupId: string, userId: string, approved: boolean): boolean {
    const grp = this.data.groups.find((g) => g.id === groupId);
    if (!grp) return false;
    grp.pendingRequestIds = grp.pendingRequestIds.filter((id) => id !== userId);
    if (approved && !grp.memberIds.includes(userId)) {
      grp.memberIds.push(userId);
      this.addNotification(
        userId,
        'Group Request Approved',
        `You have been accepted into "${grp.name}"!`,
        'group'
      );
    }
    this.persist();
    return true;
  }

  public updateGroupAudio(groupId: string, active: boolean, sourceUrl = ''): boolean {
    const grp = this.data.groups.find((g) => g.id === groupId);
    if (!grp) return false;
    grp.audioStreamActive = active;
    grp.audioSourceUrl = sourceUrl;
    this.persist();
    return true;
  }

  // --- Statuses ---

  public getActiveStatuses(): StatusItem[] {
    const now = Date.now();
    // Filter out expired statuses (>24h)
    return this.data.statuses
      .filter((s) => new Date(s.expiresAt).getTime() > now)
      .map((s) => {
        const u = this.findUserById(s.userId);
        let safeU: User | undefined;
        if (u) {
          const { passwordHash, salt, ...safe } = u;
          safeU = safe;
        }
        return { ...s, user: safeU };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createStatus(data: {
    userId: string;
    type: 'text' | 'image' | 'video';
    content?: string;
    text?: string;
    bgColor?: string;
    mediaUrl?: string;
  }): StatusItem {
    const newStatus: StatusItem = {
      id: `stat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: data.userId,
      type: data.type,
      content: data.content || data.text,
      text: data.text || data.content,
      bgColor: data.bgColor || 'from-purple-900 to-indigo-950',
      mediaUrl: data.mediaUrl,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      viewerIds: [],
    };
    this.data.statuses.push(newStatus);
    this.incrementUsage(data.userId, 'statusCount');
    this.persist();
    return newStatus;
  }

  public recordStatusView(statusId: string, viewerId: string) {
    const stat = this.data.statuses.find((s) => s.id === statusId);
    if (stat && !stat.viewerIds.includes(viewerId)) {
      stat.viewerIds.push(viewerId);
      this.persist();
    }
  }

  public deleteStatus(statusId: string, userId: string): boolean {
    const idx = this.data.statuses.findIndex((s) => s.id === statusId && s.userId === userId);
    if (idx !== -1) {
      this.data.statuses.splice(idx, 1);
      this.persist();
      return true;
    }
    return false;
  }

  // --- Premium Activation Keys ---

  public getActivationKeys(): ActivationKey[] {
    return this.data.activationKeys;
  }

  public createActivationKey(plan: 'monthly' | 'lifetime', targetEmail?: string, createdBy = 'ADMIN'): ActivationKey {
    const key = generateActivationKey();
    const newKey: ActivationKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      key,
      plan,
      targetEmail: targetEmail ? targetEmail.toLowerCase().trim() : '',
      status: 'unused',
      createdBy,
      createdAt: new Date().toISOString(),
    };
    this.data.activationKeys.push(newKey);
    this.addAuditLog('KEY_GENERATED', `Key created: ${key} (${plan}) for ${targetEmail || 'any'}`, createdBy);
    this.persist();
    return newKey;
  }

  public revokeActivationKey(keyId: string): boolean {
    const k = this.data.activationKeys.find((item) => item.id === keyId);
    if (k) {
      k.status = 'revoked';
      this.addAuditLog('KEY_REVOKED', `Key revoked: ${k.key}`, 'ADMIN');
      this.persist();
      return true;
    }
    return false;
  }

  public activateKeyForUser(
    rawKey: string,
    userId: string
  ): { success: boolean; message: string; plan?: 'monthly' | 'lifetime' } {
    const cleanKey = rawKey.trim().toUpperCase();
    const keyRecord = this.data.activationKeys.find(
      (k) => k.key.toUpperCase() === cleanKey && k.status === 'unused'
    );

    if (!keyRecord) {
      return { success: false, message: 'Invalid or already activated Premium Key. Please check the key or contact admin.' };
    }

    const user = this.findUserById(userId);
    if (!user) {
      return { success: false, message: 'User account not found.' };
    }

    // Check email match if key was assigned to specific email
    if (keyRecord.targetEmail && keyRecord.targetEmail.toLowerCase() !== user.email.toLowerCase()) {
      return {
        success: false,
        message: `This Premium Key is restricted to email: ${keyRecord.targetEmail}. Your registered email does not match.`,
      };
    }

    // Apply plan
    keyRecord.status = 'activated';
    keyRecord.activatedBy = user.id;
    keyRecord.activatedAt = new Date().toISOString();

    user.membership = keyRecord.plan;
    if (keyRecord.plan === 'monthly') {
      user.membershipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      user.membershipExpiresAt = null; // lifetime
    }

    this.addNotification(
      user.id,
      'Welcome to MR Legend 302 Premium Version!',
      `Your account has been upgraded to ${keyRecord.plan === 'monthly' ? 'Monthly Premium' : 'Lifetime VIP'}! Enjoy unlimited messages, calling, and exclusive privileges.`,
      'premium'
    );

    this.addAuditLog(
      'KEY_ACTIVATED',
      `Key ${keyRecord.key} activated by user @${user.username} (${user.email}) for ${keyRecord.plan}`,
      user.id
    );

    this.persist();
    return {
      success: true,
      message: 'Welcome to MR Legend 302 Premium Version!',
      plan: keyRecord.plan,
    };
  }

  // --- Admin Settings & Audit ---

  public getAdminSettings(): AdminSettings {
    return this.data.adminSettings;
  }

  public updateAdminSettings(updates: Partial<AdminSettings>): AdminSettings {
    this.data.adminSettings = { ...this.data.adminSettings, ...updates };
    this.addAuditLog('SETTINGS_UPDATED', `Admin updated website settings`, 'ADMIN');
    this.persist();
    return this.data.adminSettings;
  }

  public addAuditLog(action: string, details: string, performedBy: string) {
    this.data.auditLogs.unshift({
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      details,
      performedBy,
      timestamp: new Date().toISOString(),
    });
    // Keep max 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
  }

  public getAuditLogs() {
    return this.data.auditLogs.slice(0, 50);
  }

  // --- Notifications ---

  public addNotification(
    userId: string,
    title: string,
    message: string,
    type: 'message' | 'call' | 'group' | 'premium' | 'system' = 'system'
  ): AppNotification {
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  public getUserNotifications(userId: string): AppNotification[] {
    return this.data.notifications.filter((n) => n.userId === userId).slice(0, 30);
  }

  public markNotificationsRead(userId: string) {
    this.data.notifications
      .filter((n) => n.userId === userId)
      .forEach((n) => (n.read = true));
    this.persist();
  }
}

export const db = new Database();
