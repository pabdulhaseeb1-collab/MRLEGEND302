export type MembershipType = 'free' | 'monthly' | 'lifetime';
export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  numericId: string; // chosen unique numeric ID
  username: string; // unique
  email: string; // required
  firstName: string;
  avatarUrl: string;
  role: UserRole;
  membership: MembershipType;
  membershipExpiresAt?: string | null;
  isSuspended?: boolean;
  isBlocked?: boolean;
  online?: boolean;
  lastSeen?: string;
  createdAt: string;
}

export interface UserUsageData {
  messagesCount: number;
  callsSecondsUsed: number;
  downloadsCount: number;
  statusCount: number;
  lastResetDate: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  fileName?: string;
  createdAt: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  otherUser?: User;
  lastMessage?: Message;
  updatedAt: string;
  unreadCount?: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  ownerId: string;
  memberIds: string[];
  pendingRequestIds: string[];
  audioStreamActive?: boolean;
  audioSourceUrl?: string;
  createdAt: string;
}

export interface StatusItem {
  id: string;
  userId: string;
  user?: User;
  type: 'text' | 'image' | 'video';
  content?: string;
  text?: string;
  bgColor?: string;
  mediaUrl?: string;
  createdAt: string;
  expiresAt: string;
  viewerIds: string[];
}

export interface ActivationKey {
  id: string;
  key: string;
  plan: 'monthly' | 'lifetime';
  targetEmail?: string;
  status: 'unused' | 'activated' | 'expired' | 'revoked';
  createdBy: string;
  activatedBy?: string;
  activatedAt?: string;
  createdAt: string;
}

export interface AdminSettings {
  monthlyPricePKR: number;
  lifetimePricePKR: number;
  freeDailyMessages: number;
  freeCallDurationSeconds: number;
  freeDailyDownloads: number;
  freeDailyStatus: number;
  welcomeUrduVoice: boolean;
  audioBroadcastActive: boolean;
  broadcastSourceUrl: string;
  broadcastTitle: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'message' | 'call' | 'group' | 'premium' | 'system';
  read: boolean;
  createdAt: string;
}

export interface CallSession {
  callId: string;
  callerId: string;
  receiverId: string;
  caller?: User;
  receiver?: User;
  type: 'voice' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'declined';
  startTime?: number;
  duration?: number;
}
