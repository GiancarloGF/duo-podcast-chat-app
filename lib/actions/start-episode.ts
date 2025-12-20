'use server';

import { CONSTANTS } from '@/constants';
// import { auth } from '@/lib/auth'; // Tu helper de autenticación
import dbConnect from '@/lib/db/conection';
import { getUserProgressModel } from '@/lib/db/models/UserProgress';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Types } from 'mongoose';

export async function startChatByEpisode(episodeId: string) {
  // 1. Verificar sesión
  //   const session = await auth();
  //   if (!session?.user) {
  //     throw new Error('Debes iniciar sesión para comenzar.');
  //   }

  // const userId = session.user.id;
  const userId = CONSTANTS.FAKE_USER_ID;

  await dbConnect();
  const UserProgressModel = getUserProgressModel();
  // 2. Operación Atómica (UPSERT)
  // Busca si existe. Si NO existe, lo crea con los valores de $setOnInsert.
  // Si SÍ existe, solo actualiza lastActiveAt (no reinicia el progreso).
  const userProgressSaved = await UserProgressModel.create({
    userId,
    episodeId: new Types.ObjectId(episodeId),
    currentMessageIndex: 0,
    status: 'started',
    interactions: [],
    lastActiveAt: new Date(),
  });

  // 3. Revalidar el Dashboard para que ahora aparezca como "En Curso"
  revalidatePath('/');

  // 4. Redirigir al chat SOLO si la operación fue exitosa
  redirect(`/chat/${userProgressSaved._id.toString()}`);
}
