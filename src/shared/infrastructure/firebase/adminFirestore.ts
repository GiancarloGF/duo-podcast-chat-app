import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/shared/infrastructure/firebase/admin';

export function getAdminFirestore() {
  return getFirestore(getAdminApp());
}
