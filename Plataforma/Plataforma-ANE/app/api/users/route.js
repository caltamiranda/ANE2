import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        }
    });

    const data = {
        column_names:[
            {
                id: 'email',
                name: 'Correo electrónico',
            },
            {
                id: 'name',
                name: 'Nombre',
            },
            {
                id: 'role',
                name: 'Rol',
            },
        ],
        rows: allUsers,
    }
    return NextResponse.json({ data: data });
}