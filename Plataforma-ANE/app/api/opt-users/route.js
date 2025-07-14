import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
        }
    });

    const data = allUsers.map(user => {
        return {
            value: user.email,
            label: user.email,
            id: user.id,
            name: user.name,
        };
    });

    return NextResponse.json({ data: data });
}