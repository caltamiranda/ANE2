'use client'

import styles from './page.module.css';
import Dashboard from "@/components/dashboard/Dashboard";
import { Suspense, use } from 'react'
import SearchBlock from "@/components/searchBlock/SearchBlock";
import Chevronleft from '@/assets/icon/chevronleft.svg';
import { useRouter } from 'next/navigation';
import ActionBlock from '@/components/actionBlock/ActionBlock';
import { useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
const MapPage = dynamic(() => import('@/components/map/Map'), { ssr: false });
import { v4 as uuidv4 } from 'uuid';
import { formatInTimeZone } from 'date-fns-tz';

const items = [
    {
        id: 1,
        title: 'Dispositivo 1',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    },
    {
        id: 2,
        title: 'Dispositivo 2',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    },
    {
        id: 3,
        title: 'Dispositivo 3',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        band: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    },
    {
        id: 4,
        title: 'Dispositivo 4',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        band: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    },
    {
        id: 5,
        title: 'Dispositivo 5',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        band: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    },
    {
        id: 6,
        title: 'Dispositivo 6',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        band: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    },
    {
        id: 7,
        title: 'Dispositivo 7',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        band: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    }
    ,
    {
        id: 8,
        title: 'Dispositivo 8',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        band: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    },
    {
        id: 9,
        title: 'Dispositivo 9',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: '',
        band: '',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    }
];

const NewMeasurementPage = () => {
    const { socket, devices, lastModifyDevice } = useSocket();
    const [measureId, setMeasureId] = useState([]);

    useEffect(() => {
        setMeasureId(uuidv4());
    }, []);

    const router = useRouter();

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
    }
    , [devices]);
    
    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        setAvailableItems(devices.filter(item => !selectedItems.map(item => item.id).includes(item.id)));
        setSelectedItems(selectedItems.filter(item => item.serial_id !== lastModifyDevice));
    }, [devices]);

    const selectItem = (id) => {
        const item = availableItems.find(item => item.id === id);
        setAvailableItems(availableItems.filter(item => item.id !== id));

        if (selectedItems.length === 0) {
            setSelectedItems([...selectedItems, item]);
        } else {
            const firstSelectedItem = selectedItems[0];
            const newItem = { ...item, startDate: firstSelectedItem.startDate, endDate: firstSelectedItem.endDate };
            setSelectedItems([...selectedItems, newItem]);
        }
    }

    const deselectItem = (id) => {
        const item = selectedItems.find(item => item.id === id);
        setSelectedItems(selectedItems.filter(item => item.id !== id));
        setAvailableItems([...availableItems, item]);
    }

    const convertDateTime = (inputDate) => {
        return formatInTimeZone(inputDate, 'America/Bogota', "yyyy-MM-dd'T'HH:mm");
      };

    const handleMeasure = (id, option, type='measure') => {
        const item = selectedItems.find(item => item.id === id);
        if (type === 'measure'){
            item.measure = option;
            item.band = '';
            item.fmin = null;
            item.fmax = null;
            item.units = '';
            item.channel = '';
            // item.startDate = null;
            // item.endDate = null;
        } else if (type === 'band'){
            item.band = option;
        } else if (type === 'freqs'){
            item.fmin = option.split(' - ')[0];
            item.fmax = option.split(' - ')[1]?.split(' ')[0];
            item.units = option.split(' ')[3];
        } else if (type === 'channel'){
            const splits = option.split(' ');
            item.channel = splits[1]; // Canal 1: 100 - 200 MHz
            item.fmin = splits[3];
            item.fmax = splits[5];
            item.units = splits[6];
        } else if (type === 'startDate'){
            item.startDate = convertDateTime(option);
        } else if (type === 'endDate'){
            item.endDate = convertDateTime(option);
        }

        setSelectedItems([...selectedItems]);
    }

    const handleDeselecteItem = (item) => {
        deselectItem(item.id);
    }

    const verificationNewProg = (items) => {
        let result = true;
        items.map(item => {
            if (item.measure === 'RMER' || item.measure ==='RMTDT') {
                if (
                    (item.fmin === null || item.fmin === undefined || item.fmin === 'Frecuencia') ||
                    (item.fmax === null || item.fmax === undefined || item.fmax === 'Frecuencia') ||
                    (item.units === '' || item.units === undefined ) ||
                    (item.startDate === null || !item.startDate)||
                    (item.endDate === null || !item.endDate)
                ){
                    result = false;
                }
            } else if (item.measure === 'RNI') {
                if (
                    (item.startDate === null || !item.startDate)||
                    (item.endDate === null || !item.endDate)
                ){
                    result = false;
                }
            } else {
                result = false;
            }
        });

        return result;
    }

    const sendCommand = (socketId,command, data) => {
        if (socket) {
            socket.emit("sendCommand", { socketId, command, data });
        }
    };

    const handlescheduleMeasurement = (items) => {
        items.map(item => {
            sendCommand(item.socketId, 'scheduleMeasurement', {
                ...item,
                uuid: measureId
            });
        });
    }

    useEffect(() => {
        if (socket) {   
            socket.on("sendCommandResponse", (data) => {
                if (data.type==='schedule') {
                    console.log(data.message);
                    if (data.success) {
                        router.push('/platform');
                    }
                }
            });
        }
    }, [socket]);

    return (
        <Dashboard>
            <div className={styles.mainContainer}>
                <Suspense fallback={<div>Loading...</div>}>
                    <SearchBlock
                        items={availableItems}
                        onIconClick={selectItem}
                        activeName={'Agregar dispositivos'}
                        activeState={'connected'}
                        buttonText={'Nueva medición programada'}
                        iconLeft={<Chevronleft width={20} height={20} />}
                        onClickLeft={() => router.push('/platform')}
                        icon={'plus'}
                        button={false}
                    />
                </Suspense>
                <ActionBlock
                    items={selectedItems}
                    onIconClick={handleDeselecteItem}
                    handleMeasure={handleMeasure}
                    title={'Programación:'}
                    uuid={measureId}
                    buttonText={'Programar'}
                    icon={'minus'}
                    onClickRight={() => router.push('/platform')}
                    blockButton={selectedItems.length!=0 ? verificationNewProg(selectedItems): false}
                    onClickButton={()=>handlescheduleMeasurement(selectedItems)}
                />
                <div className={styles.mapContainer}>
                    <MapPage points={devices.filter(item=>item.status==='connected')} center={center} controls={false} offsetInit={[-0.05,0.05]} offset={[-0.09,0.02]} />
                </div>
            </div>
        </Dashboard>
    );
};
export default NewMeasurementPage;