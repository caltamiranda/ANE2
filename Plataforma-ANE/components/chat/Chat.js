'use client';

import styles from './Chat.module.css';
import Close from '@/assets/icon/close.svg';
import Send from '@/assets/icon/send.svg';
import Loading from '@/assets/icon/loading.svg';
import { useState, useRef, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';

const messageData = [
    {
        pqrId: 1,
        message: 'Hola',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq49',
        status: 'nuevo'
    },
    {
        pqrId: 2,
        message: 'Hola, como estas?',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq4',
        status: 'nuevo'
    },
    {
        pqrId: 3,
        message: 'Bien, gracias',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq49',
        status: 'abierto'
    },
    {
        pqrId: 4,
        message: 'Hola',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq49',
        status: 'nuevo'
    },
    {
        pqrId: 5,
        message: 'Hola, como estas?',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq4',
        status: 'nuevo'
    },
    {
        pqrId: 6,
        message: 'Bien, gracias',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq49',
        status: 'abierto'
    },
    {
        pqrId: 7,
        message: 'Hola',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq49',
        status: 'nuevo'
    },
    {
        pqrId: 8,
        message: 'Hola, como estas?',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq4',
        status: 'nuevo'
    },
    {
        pqrId: 9,
        message: 'Bien, gracias',
        date: '2021-09-01',
        emiterId: 'cm4inx6sw00009k2d8k6mbq49',
        status: 'abierto'
    }
];

const Chat = ({item, onClickRight, session}) => {
    const [isDisabled, setIsDisabled] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messageEndRef = useRef(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                if (!item) return;
                const res = await fetch(`/api/message/${item.id}`,);
                const data = await res.json();
                setMessages(data.data);
            } catch (error) {
                console.error('Error getting messages:', error);
            }
            setLoading(false);
        };

        fetchData();
    }, [item]);

    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleNewMessage = (e) => {
        setNewMessage(e.target.value);
        setIsDisabled(e.target.value === '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ chatId:item.id ,userId: session.user.id, message: newMessage}),
            });

            const data = await res.json();
            setMessages([...messages, data.data]);
            setNewMessage('');
            setIsDisabled(true);
        } catch (error) {
            console.error('Error creating chat:', error);
        }
        setLoading(false);
    };

    const convertDateTime = (inputDate) => {
        return formatInTimeZone(inputDate, 'America/Bogota', "yyyy-MM-dd'T'HH:mm");
      };

    return (
        <div className={styles.mainContainer}>
            <div className={styles.headers}>
                <div className={styles.titleContainer}>
                    <p className={styles.title}>
                        {item?.id}
                    </p>
                </div>
                <button className={styles.iconContainer} onClick={onClickRight}>
                    <Close width={20} height={20} />
                </button>
            </div>
            <div className={styles.messageContent}>
                {messages.map((message, index) => (
                    <div key={index} className={` ${styles.messageContainer} ${session.user.id===message.userId ? styles.emiter: styles.receiver}`}>
                        <div className={`${styles.messageInside}`}>
                            <p className={styles.message}>
                                {message.message}
                            </p>
                        </div>
                        <p className={styles.date}>
                            {convertDateTime(message.updatedAt)}
                        </p>
                    </div>
                ))}
                <div ref={messageEndRef} />
            </div >
            <div className={styles.typeContainer}>
                <form className={styles.typeForm} onSubmit={handleSubmit}>
                    <input 
                        value={newMessage} 
                        type="text" 
                        placeholder="Escribe un mensaje" 
                        onChange={handleNewMessage} />
                    <button type="submit" className={styles.iconSend} disabled={isDisabled}>
                        {loading ? 
                            <Loading width={20} height={20} />
                            :
                            <Send width={20} height={20} />
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;