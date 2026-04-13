import 'server-only';

import {
  createInitialProgressDoc,
  normalizeProgressDoc,
  SRS_PROGRESS_DOC_ID,
} from '@/features/phrasal-verbs/application/services/progressSnapshot';
import type { InitializeSrsProgressResult } from '@/features/phrasal-verbs/presentation/actions';
import { getAuthenticatedAppForUser } from '@/shared/infrastructure/firebase/serverApp';
import { getAdminFirestore } from '@/shared/infrastructure/firebase/adminFirestore';

// Server-only read used by RSC pages. Keeping reads here avoids routing simple
// data fetching through server actions, which are reserved for UI-triggered mutations.
export async function getSrsProgressSnapshotForCurrentUser(): Promise<InitializeSrsProgressResult> {
  try {
    const { currentUser } = await getAuthenticatedAppForUser();

    if (!currentUser?.uid) {
      return {
        success: false,
        error: 'No se pudo cargar tu progreso.',
        details: 'Usuario no autenticado.',
      };
    }

    const nowMs = Date.now();
    const progressRef = getAdminFirestore()
      .collection('users')
      .doc(currentUser.uid)
      .collection('learning')
      .doc(SRS_PROGRESS_DOC_ID);

    const snapshot = await progressRef.get();

    if (!snapshot.exists) {
      // Reads are side-effect free here: if the user has no stored progress yet,
      // return the initial shape without creating the document eagerly.
      const initialDoc = createInitialProgressDoc(nowMs);

      return {
        success: true,
        snapshot: initialDoc,
      };
    }

    return {
      success: true,
      snapshot: normalizeProgressDoc(snapshot.data(), nowMs),
    };
  } catch (error) {
    console.error('[getSrsProgressSnapshotForCurrentUser] Failed', { error });

    return {
      success: false,
      error: 'No se pudo cargar tu progreso.',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
