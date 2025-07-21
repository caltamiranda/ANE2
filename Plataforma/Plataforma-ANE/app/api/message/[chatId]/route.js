import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, context) {
    try {
        const { chatId } = context.params;
        const allMessages = await prisma.message.findMany({
            where: {
                chatId: chatId,
            }
        });

        return NextResponse.json({ data: allMessages });
    } catch (error) {
        console.error('Error getting chats:', error);
        return NextResponse.json({ error: 'Error getting chats' }, { status: 500 });
    }
}