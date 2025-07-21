import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, context) {
    try {
        const { chatId } = context.params;
        const allChatsById = await prisma.chat.findMany({
            where: {
                userId: chatId,
            },
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ data: allChatsById });
    } catch (error) {
        console.error('Error getting chats:', error);
        return NextResponse.json({ error: 'Error getting chat' }, { status: 500 });
    }
}

export async function PUT(req, context) {
    try {
        const { chatId } = context.params;
        const updatedChat = await prisma.chat.update({
            where: {
                id: chatId,
            },
            data: {
                status: 'abierto',
            }
        });

        return NextResponse.json({ data: updatedChat });
    } catch (error) {
        console.error('Error getting chats:', error);
        return NextResponse.json({ error: 'Error getting chats' }, { status: 500 });
    }
}