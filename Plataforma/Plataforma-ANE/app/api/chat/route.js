import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const allChats = await prisma.chat.findMany({
            include: {
                user: {
                    select: {
                        email: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({ data: allChats });
    } catch (error) {
        console.error('Error getting chats:', error);
        return NextResponse.json({ error: 'Error getting chats' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { userId } = await req.json();

        const newChat = await prisma.chat.create({
            data: {
                userId: userId
            },
        });

        return NextResponse.json({ status: 'success', data: newChat });
    } catch (error) {
        console.error('Error creating chat:', error);
        return NextResponse.json({ error: 'Error creating chat' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { chatId } = await req.json();

        await prisma.chat.delete({
            where: {
                id: chatId,
            },
        });

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        console.error('Error deleting chat:', error);
        return NextResponse.json({ error: 'Error deleting chat' }, { status: 500 });
    }
}