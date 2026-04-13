import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSrsProgressSnapshotForCurrentUser } from '@/features/phrasal-verbs/server/getSrsProgressSnapshotForCurrentUser';

const {
  collectionMock,
  getAdminFirestoreMock,
  getAuthenticatedAppForUserMock,
  getMock,
  learningCollectionMock,
  learningDocMock,
  userDocMock,
} = vi.hoisted(() => {
  const getMock = vi.fn();
  const learningDocMock = vi.fn(() => ({ get: getMock }));
  const learningCollectionMock = vi.fn(() => ({ doc: learningDocMock }));
  const userDocMock = vi.fn(() => ({ collection: learningCollectionMock }));
  const collectionMock = vi.fn(() => ({ doc: userDocMock }));
  const getAdminFirestoreMock = vi.fn(() => ({
    collection: collectionMock,
  }));

  return {
    collectionMock,
    getAdminFirestoreMock,
    getAuthenticatedAppForUserMock: vi.fn(),
    getMock,
    learningCollectionMock,
    learningDocMock,
    userDocMock,
  };
});

vi.mock('server-only', () => ({}));

vi.mock('@/shared/infrastructure/firebase/serverApp', () => ({
  getAuthenticatedAppForUser: getAuthenticatedAppForUserMock,
}));

vi.mock('@/shared/infrastructure/firebase/adminFirestore', () => ({
  getAdminFirestore: getAdminFirestoreMock,
}));

describe('getSrsProgressSnapshotForCurrentUser', () => {
  beforeEach(() => {
    getAuthenticatedAppForUserMock.mockReset();
    getMock.mockReset();
    collectionMock.mockClear();
    userDocMock.mockClear();
    learningCollectionMock.mockClear();
    learningDocMock.mockClear();
  });

  it('returns an auth error when there is no current user', async () => {
    getAuthenticatedAppForUserMock.mockResolvedValueOnce({ currentUser: null });

    const result = await getSrsProgressSnapshotForCurrentUser();

    expect(result.success).toBe(false);
    expect(result.details).toBe('Usuario no autenticado.');
  });

  it('normalizes the stored snapshot for the authenticated user', async () => {
    getAuthenticatedAppForUserMock.mockResolvedValueOnce({
      currentUser: {
        uid: 'user-1',
      },
    });
    getMock.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        progress: {
          'pv-1': {
            s: 'review',
            e: 2.5,
            i: 3,
            rp: 4,
            nr: 123,
            lr: 120,
            tc: 8,
            ti: 1,
            tv: 9,
          },
        },
        meta: {
          totalViewed: 1,
          totalMastered: 0,
          currentStreak: 2,
          longestStreak: 3,
          lastSessionAt: 100,
          analytics: {
            totalSessions: 2,
            totalExercises: 10,
            totalCorrect: 8,
            totalIncorrect: 2,
            averageAccuracy: 80,
            totalTimeSeconds: 600,
            firstSessionAt: 50,
          },
          lastSyncAt: 123,
          version: 1,
        },
      }),
    });

    const result = await getSrsProgressSnapshotForCurrentUser();

    expect(result.success).toBe(true);
    expect(result.snapshot?.progress['pv-1']?.s).toBe('review');
    expect(result.snapshot?.meta.analytics.totalSessions).toBe(2);
  });
});
