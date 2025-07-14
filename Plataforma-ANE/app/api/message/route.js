import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req) {
    try {
        const { chatId, userId, message } = await req.json();

        const newChat = await prisma.message.create({
            data: {
                chatId: chatId,
                userId: userId,
                message: message,
            },
        });

        const updatedChat = await prisma.chat.update({
            where: {
                id: chatId,
            },
            data: {
                status: 'nuevo',
                message: message,
            }
        });

        return NextResponse.json({ status: 'success', data: newChat });
    } catch (error) {
        console.error('Error creating chat:', error);
        return NextResponse.json({ error: 'Error creating chat' }, { status: 500 });
    }
}