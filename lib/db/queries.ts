import { eq } from 'drizzle-orm';
import { teamMembers, teams, users } from './schema';
// Unused imports commented out for auth-disabled mode:
// import { desc, and, isNull } from 'drizzle-orm';
// import { activityLogs } from './schema';
// import { cookies } from 'next/headers';
// import { verifyToken } from '@/lib/auth/session';

export async function getUser() {
  // Authentication disabled - return mock user
  return {
    id: 1,
    email: 'user@example.com',
    name: 'Mock User',
    role: 'owner',
    passwordHash: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  };
}

export async function getTeamByStripeCustomerId(customerId: string) {
  const { db } = await import('./drizzle');
  const result = await db
    .select()
    .from(teams)
    .where(eq(teams.stripeCustomerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function updateTeamSubscription(
  teamId: number,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  const { db } = await import('./drizzle');
  await db
    .update(teams)
    .set({
      ...subscriptionData,
      updatedAt: new Date()
    })
    .where(eq(teams.id, teamId));
}

export async function getUserWithTeam(userId: number) {
  const { db } = await import('./drizzle');
  const result = await db
    .select({
      user: users,
      teamId: teamMembers.teamId
    })
    .from(users)
    .leftJoin(teamMembers, eq(users.id, teamMembers.userId))
    .where(eq(users.id, userId))
    .limit(1);

  return result[0];
}

export async function getActivityLogs() {
  // Authentication disabled - return mock activity logs
  return [
    {
      id: 1,
      action: 'SIGN_IN',
      timestamp: new Date(),
      ipAddress: '127.0.0.1',
      userName: 'Mock User'
    },
    {
      id: 2,
      action: 'UPDATE_ACCOUNT',
      timestamp: new Date(Date.now() - 3600000),
      ipAddress: '127.0.0.1',
      userName: 'Mock User'
    }
  ];
}

export async function getTeamForUser() {
  // Authentication disabled - return mock team
  return {
    id: 1,
    name: 'Mock Team',
    createdAt: new Date(),
    updatedAt: new Date(),
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeProductId: null,
    planName: 'pro',
    subscriptionStatus: 'active',
    teamMembers: [
      {
        id: 1,
        userId: 1,
        teamId: 1,
        role: 'owner',
        joinedAt: new Date(),
        user: {
          id: 1,
          name: 'Mock User',
          email: 'user@example.com'
        }
      }
    ]
  };
}
