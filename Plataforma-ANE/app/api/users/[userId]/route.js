import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, context) {
    try {
        const { userId } = context.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        return NextResponse.json({ data: user });
    } catch (error) {
        console.error('Error getting user:', error);
        return NextResponse.json({ error: 'Error getting user' }, { status: 500 });
    }
}

export async function DELETE(req, context) {
    try {
        const { userId } = context.params;
        // const { userId } = await req.json();

        const deletedUser = await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ status: 'success', data: deletedUser });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
    }
}