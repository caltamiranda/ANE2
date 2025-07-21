"use client";

import { createContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'
import devicesConfig  from  '@/data/devicesConfig.json'
import { useSession } from "next-auth/react"

const MainContext = createContext();

const MainProvider = ({ children }) => {
    const { data: session } = useSession()
    const pathname = usePathname()

    const [inputController, setInputController] = useState({
        menu: pathname.split('/')[2] ? pathname.split('/').pop() : 'home',
        services: devicesConfig,
        role: 'consulta',
    });

    useEffect(() => {
        const getRole = async () => {
            try {
                const res = await fetch(`/api/users/${session?.user?.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
    
                const data = await res.json();
                setInputController({...inputController, role: data.data.role});
                // console.log('role:',data.data.role);
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        };

        if (session){
            getRole();
        }
    }
    , [session]);

    return (
        <MainContext.Provider value={{ inputController, setInputController }}>
            {children}
        </MainContext.Provider>
    );
};

export { MainContext, MainProvider };