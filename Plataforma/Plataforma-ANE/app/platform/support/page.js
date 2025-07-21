'use client';

import styles from './page.module.css';
import Dashboard from "@/components/dashboard/Dashboard";
import SearchBlock from "@/components/searchBlock/SearchBlock";
import { Suspense } from 'react'
import { useState, useEffect,useContext } from 'react';
import { MainContext } from '@/context/MainContext';
import Chat from '@/components/chat/Chat';
import { useSession } from "next-auth/react"

const data = [
    {
        pqrId: '11w51345123', 
        message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat', 
        date: '2021-09-01',
        userEmail: 'juccaicedoac@unal.edu.co',
        status: 'nuevo'
    },
    {
        pqrId: '123irun2pi3b413', 
        message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat', 
        date: '2021-09-01',
        userEmail: 'juccaicedoac@unal.edu.co',
        status: 'nuevo'},
    {
        pqrId: '1ouehfb0231r', 
        message: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat', 
        date: '2021-09-01',
        userEmail: 'juccaicedoac@unal.edu.co',
        status: 'abierto'
    },
];

const Support = () => {
    const { data: session } = useSession()
    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const { inputController, setInputController } = useContext(MainContext);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if(inputController.role==='admin'){
                    if (!session) return;
                    const res = await fetch('/api/chat');
                    const data = await res.json();
                    setAvailableItems(data.data);
                }else{
                    if (!session) return;
                    const res = await fetch(`/api/chat/${session?.user?.id}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                    const data = await res.json();
                    setAvailableItems(data.data);
                }

            } catch (error) {
                console.error('Error getting chats:', error);
            }
        };

        fetchData();
    }, [session]);

    const selectItem = async (id) => {
        const item = availableItems.find(item => item.id === id);
        setSelectedItem(item);
        setIsOpen(true);

        try {
            const res = await fetch(`/api/chat/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await res.json();
            setAvailableItems(availableItems.map(item => item.id === id ? data.data : item));
        } catch (error) {
            console.error('Error updating chat:', error);
        }
    };

    const handleClickButton = () => {
        handleCreateChat();
        setIsOpen(true);
    }

    const handleClose = () => {
        setIsOpen(false);
    }

    const handleCreateChat = async () => {
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: session.user.id }),
            });

            const data = await res.json();
            setAvailableItems([...availableItems, data.data]);
            setSelectedItem(data.data);
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };

    const handleDeleteChat = async (id) => {
        try {
            const res = await fetch('/api/chat', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chatId: id }),
            });

            const data = await res.json();
            setAvailableItems(availableItems.filter(item => item.id !== id));
            setSelectedItem(null);
            setIsOpen(false);
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    return (
        <Dashboard>
            <div className={styles.mainContainer}>
                    <Suspense fallback={<div>Loading...</div>}>
                        <SearchBlock
                            items={availableItems}
                            onClick={selectItem}
                            activeName={'Nuevo'}
                            inactiveName={'Abierto'}
                            activeState={'nuevo'}
                            icon={'dots'}
                            button={inputController.role==='admin' ? false : true}
                            buttonText={'Crear solicitud'}
                            onClickButton={handleClickButton}
                            cardType={'pqr'}
                            clickable={true}
                            onClickLeaveButton={handleDeleteChat}
                        />
                    </Suspense>
                    {isOpen &&
                        <Chat
                            item={selectedItem}
                            session={session}
                            onClickRight={handleClose}
                        />
                    }
            </div>
        </Dashboard>
    );
};

export default Support;