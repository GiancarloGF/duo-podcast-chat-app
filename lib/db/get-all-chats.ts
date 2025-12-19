import { getChatModel } from "@/models/Chat";
import dbConnect from "./conection";
import { Chat } from "../types";

const FAKE_USER_ID = "fake-user-123";

export async function getAllChats(): Promise<Chat[]> {
    try {
        await dbConnect();
        const Chat = getChatModel();
        const chats = await Chat.find({ userId: FAKE_USER_ID })
            // .select() define qué campos quieres incluir (espacio como separador)
            // El campo '_id' siempre se incluye por defecto a menos que lo excluyas explícitamente.
            .select("userId episodeId status progress")
            .sort({ updatedAt: -1 }) // Puedes ordenar por updatedAt aunque no lo devuelvas
            .lean(); // Convierte a objeto plano de JS (más rápido)

        const sanitizedChats = chats.map((chat) => ({
            userId: chat.userId,
            episodeId: chat.episodeId,
            status: chat.status,
            progress: chat.progress,
            id: chat._id.toString(),
        } as Chat));

        return sanitizedChats;
        // return {
        //     isSuccess: true,
        //     data: sanitizedChats,
        //     message: "Chats obtenidos exitosamente",
        // };
    } catch (error) {
        console.error("Error al obtener los chats:", error);
        throw new Error("Error al obtener los chats");
        // return {
        //     isSuccess: false,
        //     data: [],
        //     message: "Error al obtener los chats",
        // };
    }
}
