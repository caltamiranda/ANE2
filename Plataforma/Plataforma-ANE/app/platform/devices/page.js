'use client';

import styles from './page.module.css';
import Dashboard from "@/components/dashboard/Dashboard";
import SearchBlock from "@/components/searchBlock/SearchBlock";
import { Suspense } from 'react'
import { useState, useRef, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
import DeviceBlock from '@/components/deviceBlock/DeviceBlock';
import { useSocket } from '@/context/SocketContext';
import dynamic from 'next/dynamic';
const MapPage = dynamic(() => import('@/components/map/Map'), { ssr: false });

const items = [
    {
        id: 123,
        title: 'Dispositivo nuevo',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Nuevo',
        color: 'blue'
    },
    {
        id: 2,
        title: 'Dispositivo 2',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green'
    },
    {
        id: 3,
        title: 'Dispositivo 3',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Inactivo',
        color: 'red'
    },
    {
        id: 4,
        title: 'Dispositivo 4',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green'
    },
    {
        id: 5,
        title: 'Dispositivo 5',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green'
    },
    {
        id: 6,
        title: 'Dispositivo 6',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green'
    },
    {
        id: 7,
        title: 'Dispositivo 7',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green'
    }
    ,
    {
        id: 8,
        title: 'Dispositivo 8',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Inactivo',
        color: 'red'
    },
    {
        id: 9,
        title: 'Dispositivo 9',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green'
    }
];

const Devices = () => {
    const { socket, devices, lastModifyDevice } = useSocket();

    const moda = (arr) =>
        arr.reduce(
            (a, b, i, arr) =>
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b,
            null
        );
    
    const extractValues = (list, key) => {
        return list.map(obj => obj[key]).filter(value => value !== undefined);
    };

    const [center, setCenter] = useState([]);

    useEffect(() => {
        if (devices.length > 0) {
            setCenter([moda(extractValues(devices, 'longitude')), moda(extractValues(devices, 'latitude'))]);
        }

        if (socket) {
            socket.on('connectedDevicesResponse', (data) => {
                if (data.success) {
                    console.log('Devices fetched');
                } else {
                    console.error(data.message);
                }
            });
        }
        
    }
    , [devices]);

    const [selectedCard, setSelectedCard] = useState(null);

    const selectItem = (id) => {
        const item = devices.find(item => item.id === id);
        setSelectedCard(item);
        setCenter([item.longitude, item.latitude]);
    }

    const handleAuthorize = (deviceInfo) => {
        if (socket) {
            socket.emit("authorizeDevice", deviceInfo); // Usar el socket existente
            setSelectedCard(null);
        }
    };

    const deleteDevice = (serial_id) => {
        if (socket) {
            socket.emit('deleteDevice', serial_id);
            setSelectedCard(null);
        }
    };

    const handleFetchDevices = () => {
        if (socket) {
            socket.emit('fetchConnectedDevices', (data) => {
                console.log("Fetching devices");
            })
        }
    }

    const handleFetchDeviceId = (serial_id) =>{
        if (socket) {
            socket.emit('fetchDeviceStatus', serial_id);
        }
    }
    // console.log(devices);
    // console.log(center);

    return (
        <Dashboard>
            <div className={styles.mainContainer}>
                <Suspense fallback={<div>Loading...</div>}>
                    <SearchBlock
                        items={devices && devices}
                        activeName={'Nuevo'}
                        inactiveName={'Dispositivos'}
                        activeState={'pending'}
                        buttonText={'Realizar diagnóstico global'}
                        clickable={true}
                        onClick={selectItem}
                        onClickButton={handleFetchDevices}
                        onClickAddButton={handleAuthorize}
                        onClickLeaveButton={deleteDevice}
                    />
                </Suspense>
                {selectedCard &&
                    <DeviceBlock
                        item={selectedCard}
                        buttonText={'Realizar diagnóstico'}
                        buttonTextSecondary={'Olvidar dispositivo'}
                        onClickRight={()=>setSelectedCard(null)}
                        onClickButton={handleAuthorize}
                        onClickButtonSecondary={deleteDevice}
                        onClickAlternative={handleFetchDeviceId}
                    />
                }

                <div className={styles.mapContainer}>
                    <MapPage points={devices} center={center} />
                </div>
            </div>
        </Dashboard>
    );
};

export default Devices;