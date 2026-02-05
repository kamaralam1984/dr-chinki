import { AuthUser, UserRole } from '../types';

const STORAGE_KEY = 'dr_chinki_current_user';
const USERS_STORAGE_KEY = 'dr_chinki_users';

type StoredUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

// Demo hard-coded accounts so that admin / superadmin roles bhi available hon
const DEMO_USERS: { email: string; password: string; name: string; role: UserRole }[] = [
  {
    email: 'boss@kamaralam.local',
    password: 'bossjaan',
    name: 'Kamar Alam',
    role: 'superadmin',
  },
  {
    email: 'admin@clinic.local',
    password: 'admin123',
    name: 'Clinic Admin',
    role: 'admin',
  },
];

function loadStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredUser[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function loadCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function saveCurrentUser(user: AuthUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const normalizedEmail = email.trim().toLowerCase();

  // Check stored users created via Super Admin / signup
  const storedUsers = loadStoredUsers();
  const stored = storedUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password,
  );
  if (stored) {
    const user: AuthUser = {
      id: stored.id,
      name: stored.name,
      email: stored.email,
      role: stored.role,
    };
    saveCurrentUser(user);
    return user;
  }

  // Check demo table first for admin / superadmin
  const demo = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password,
  );
  if (demo) {
    const user: AuthUser = {
      id: `demo-${demo.role}`,
      name: demo.name,
      email: demo.email,
      role: demo.role,
    };
    saveCurrentUser(user);
    return user;
  }

  // Simple local user (user role) based on email/password
  if (!email || !password) {
    throw new Error('Email aur password zaroori hai.');
  }

  // For now, treat any other email/password as a normal user account and store it
  const id = `user-${Date.now()}`;
  const nameFromEmail = email.split('@')[0] || 'Boss Jaan';
  const newStoredUser: StoredUser = {
    id,
    name: nameFromEmail,
    email: normalizedEmail,
    password,
    role: 'user',
  };
  saveStoredUsers([...storedUsers, newStoredUser]);
  const user: AuthUser = {
    id,
    name: nameFromEmail,
    email: normalizedEmail,
    role: 'user',
  };
  saveCurrentUser(user);
  return user;
}

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  if (!name.trim() || !email.trim() || !password.trim()) {
    throw new Error('Name, email aur password sab required hain.');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = loadStoredUsers();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Is email se user already exist karta hai.');
  }

  const id = `user-${Date.now()}`;
  const newStoredUser: StoredUser = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'user',
  };
  saveStoredUsers([...users, newStoredUser]);

  const user: AuthUser = {
    id,
    name: newStoredUser.name,
    email: newStoredUser.email,
    role: newStoredUser.role,
  };
  saveCurrentUser(user);
  return user;
}

export function logout(): void {
  saveCurrentUser(null);
}

export function listUsers(): AuthUser[] {
  const stored = loadStoredUsers();
  return stored.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
  }));
}

export function createUserWithRole(
  name: string,
  email: string,
  password: string,
  role: UserRole,
): AuthUser {
  const normalizedEmail = email.trim().toLowerCase();
  if (!name.trim() || !normalizedEmail || !password.trim()) {
    throw new Error('Name, email aur password sab required hain.');
  }
  const users = loadStoredUsers();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Is email se user already exist karta hai.');
  }
  const id = `user-${Date.now()}`;
  const newUser: StoredUser = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
  };
  saveStoredUsers([...users, newUser]);
  return {
    id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
  };
}

