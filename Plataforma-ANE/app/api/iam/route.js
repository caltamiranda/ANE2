import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req) {
    const users = await req.json();

    try {
        const updatedUsers = await Promise.all(users.map(async (user) => {
            const updatedUser = await prisma.user.update({
                where: { id: user.id },
                data: { role: user.role },
            });
            return updatedUser;
        }));

        return NextResponse.json({ status: 'success', data: updatedUsers });
    } catch (error) {
        return NextResponse.json({ error: 'Error updating user roles' }, { status: 500 });
    }
}