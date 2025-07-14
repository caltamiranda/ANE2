'use client';

import styles from './page.module.css';
import Dashboard from "@/components/dashboard/Dashboard";
import SearchBlock from "@/components/searchBlock/SearchBlock";
import { Suspense, use } from 'react'
import Barchartplus from '@/assets/icon/barchartplus.svg';
import Barchartminus from '@/assets/icon/barchartminus.svg';
import Close from '@/assets/icon/close.svg';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Upload from '@/assets/icon/upload.svg';
import ActionBlock from '@/components/actionBlock/ActionBlock';
import { useSocket } from '@/context/SocketContext';
import { useEffect } from 'react';
import RmerGraph from '@/components/rmerGraph/RmerGraph';
import DonutGraph from '@/components/donutGraph/DonutGraph';
import dynamic from 'next/dynamic';
const MapPage = dynamic(() => import('@/components/map/Map'), { ssr: false });

const items = [
    {
        title: 'Medición 1',
        subtitle: '3 sensores, 2 ciudades',
        date: '29 de agosto a las 3:00pm',
        state: 'En curso',
        color: 'yelow'
    },
    {
        title: 'Medición 2',
        subtitle: '3 sensores, 2 ciudades',
        date: '29 de agosto a las 3:00pm',
        state: 'Exitoso',
        color: 'green'
    },
    {
        title: 'Medición 3',
        subtitle: '3 sensores, 2 ciudades',
        date: '29 de agosto a las 3:00pm',
        state: 'Fallido',
        color: 'red'
    },
    {
        title: 'Medición 4',
        subtitle: '3 sensores, 2 ciudades',
        date: '29 de agosto a las 3:00pm',
        state: 'Exitoso',
        color: 'green'
    },
    {
        title: 'Medición 5',
        subtitle: '3 sensores, 2 ciudades',
        date: '29 de agosto a las 3:00pm',
        state: 'Exitoso',
        color: 'green'
    },
    {
        title: 'Medición 5',
        subtitle: '3 sensores, 2 ciudades',
        date: '29 de agosto a las 3:00pm',
        state: 'Exitoso',
        color: 'green'
    },
    {
        title: 'Medición 5',
        subtitle: '3 sensores, 2 ciudades',
        date: '29 de agosto a las 3:00pm',
        state: 'Exitoso',
        color: 'green'
    },
    {
        title: 'Medición 5',
        subtitle: '3 sensores, 2 ciudades',
        date: '29 de agosto a las 3:00pm',
        state: 'Exitoso',
        color: 'green'
    },
];

const measureItems = [
    {
        id: 1,
        title: 'Dispositivo 1',
        subtitle: 'Calle 123 #10-50',
        date: '29 de agosto a las 3:00pm',
        state: 'Activo',
        color: 'green',
        measure: 'rmer',
        band: 'VHF',
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
        measure: 'rmer',
        band: 'VHF',
        fmin: null,
        fmax: null,
        units: '',
        channel: '',
        startDate: null,
        endDate: null
    }
];

const Platform = () => {
    const { socket, devices, lastModifyDevice } = useSocket();
    const [statistics, setStatistics] = useState(true);
    const [openMeasure, setOpenMeasure] = useState(false);
    const router = useRouter()
    const [schedules, setSchedules] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [scheduleDevices, setScheduleDevices] = useState([]);
    const [openGraph, setOpenGraph] = useState(false);

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

    const fetchSchedules = (limit=null) => {
        if (socket) {
            socket.emit('fetchSchedules', limit);
        }
    };

    const fetchDevicesByScheduleUUID = (uuid) => {
        if (socket) {
            socket.emit('fetchDevicesByScheduleUUID', {uuid});
        }
    };

    useEffect(() => {
        console.log('fetching schedules');
        fetchSchedules(100);

    }, [socket]);

    const handleDeleteSchedule = (uuid) => {
        if (socket) {
            socket.emit('deleteSchedule', uuid);
            setSelectedCard(null);
        }
    };

    const sendLiveDataCommand = (socketId,command, data) => {
        if (socket) {
            socket.emit("sendCommand", { socketId, command, data });
        }
    };

    const handleCancelSchedule = (item) => {
        if (socket) {
            socket.emit('deleteSchedule', item.uuid);
        }

        sendLiveDataCommand(item.uuid, "stopLiveData");

    }

    useEffect(() => {
        if (socket) {
            socket.on('fetchSchedulesResponse', (data) => {
                setSchedules(data.schedules);
            });
            socket.on('fetchDevicesByScheduleUUIDResponse', (data) => {
                // console.log('fetchDevicesByScheduleUUIDResponse', data);
                if (data.success) {
                    setScheduleDevices(data.devices);
                } else {
                    console.error(data.message);
                }
            });
            socket.on('deleteScheduleResponse', (data) => {
                console.log(data.message);
                if (data.success) {
                    setSchedules((prevSchedules) => {
                        return prevSchedules.filter(schedule => schedule.uuid !== data.uuid);
                    });
                }
            });
        }
    }
    , [socket]);

    const selectItem = (id) => {
        const item = schedules.find(item => item.uuid === id);
        if (socket) {
            console.log('fetching devices by schedule uuid:', item.uuid);
            fetchDevicesByScheduleUUID(item.uuid);
        }
        setSelectedCard(item);
        setOpenMeasure(true);
    }

    const countSchedules = (schedules) => {
        const data = {};
        const countPendingSchedules = (schedules) => {
            return schedules.filter(schedule => schedule.status === 'pending').length};
        const countCompletedSchedules = (schedules) => {
            return schedules.filter(schedule => schedule.status === 'completed').length}
        const countFailedSchedules = (schedules) => {
            return schedules.filter(schedule => schedule.status === 'failure').length}
        const countInProgressSchedules = (schedules) => {
            return schedules.filter(schedule => schedule.status === 'in_progress').length}
        
        data['pending'] = {
            count: countPendingSchedules(schedules),
            label: 'Pendientes',
            colorLabel: 'blue',
            color: 'rgb(182, 205, 252)',
            };
        data['completed'] = {
            count: countCompletedSchedules(schedules),
            label: 'Completados',
            colorLabel: 'green',
            color: 'rgb(158, 228, 169)',
            };
        data['failure'] = {
            count: countFailedSchedules(schedules),
            label: 'Fallidos',
            colorLabel: 'red',
            color: 'rgb(255, 157, 157)',
            };
        data['in_progress'] = {
            count: countInProgressSchedules(schedules),
            label: 'En proceso',
            colorLabel: 'yellow',
            color: 'rgb(251, 246, 188)',
            };
        return data;
    }

    const countDevices = (devices) => {
        const data = {};
        const countConnectedDevices = (devices) => {
            return devices.filter(device => device.status === 'connected').length};
        const countDisconnectedDevices = (devices) => {
            return devices.filter(device => device.status === 'disconnected').length}
        const countNewDevices = (devices) => {
            return devices.filter(device => device.status === 'new').length}
        
        data['connected'] = {
            label: 'Conectados',
            count: countConnectedDevices(devices),
            colorLabel: 'green',
            color: 'rgb(158, 228, 169)',
            };
        data['disconnected'] = {
            label: 'Desconectados',
            count: countDisconnectedDevices(devices),
            colorLabel: 'red',
            color: 'rgb(255, 157, 157)',
            };
        data['new'] = {
            label: 'Nuevos',
            count: countNewDevices(devices),
            colorLabel: 'blue',
            color: 'rgb(182, 205, 252)',
            };
        return data;
    }

    const sendFetchRecord = (serial_id, startDate, endDate, fmin, fmax, measure) => {
        if (socket){
            socket.emit("fetchRecords",{serial_id, startDate, endDate, fmin, fmax, measure})
        }
    }

    const handleStartRecors = (items) => {
        items.map(item => {
            sendFetchRecord(item.serial_id, item.startDate, item.endDate, item.fmin, item.fmax, item.measure);
        });
        setOpenGraph(true);
        // setStopStatus(false);
    }

    const handleCloseGraphId = (item) => {
        sendLiveDataCommand(item.socketId, "stopLiveData");
        // deselectItem(item.id);
    }

    const handleCloseAll = () => {
        setOpenMeasure(false);
        setOpenGraph(false);
    }

    const deselectItem = (id) => {
        setScheduleDevices(scheduleDevices.filter(item => item.serial_id !== id));
        if (scheduleDevices.length === 1 || scheduleDevices.length === 0) {
            setOpenGraph(false);
        }
    }

    return (
        <Dashboard>
            <div className={styles.mainContainer}>
                <Suspense fallback={<div>Loading...</div>}>
                    {!openGraph &&
                        <SearchBlock
                            items={schedules || []}
                            activeName={'Mediciones pendientes'}
                            inactiveName={'Mediciones realizadas'}
                            activeState={'pending'}
                            buttonText={'Nueva medición programada'}
                            iconRight={statistics ? <Barchartminus width={20} height={20} /> :<Barchartplus width={20} height={20} />}
                            onClickRight={() => setStatistics(!statistics)}
                            onClickButton={() => router.push('/platform/new-measurement')}
                            iconRightButton={<Upload width={20} height={20} />}
                            cardType={'measurement'}
                            clickable={true}
                            onClick={selectItem}
                            onClickAddButton={handleCancelSchedule}
                            onClickLeaveButton={handleDeleteSchedule}
                        />
                    }
                </Suspense>
                {openMeasure &&
                    <ActionBlock
                        items={scheduleDevices}
                        title={'Programación:'}
                        uuid={selectedCard.uuid}
                        buttonText={'Graficar'}
                        blockButton={true}
                        icon={'minus'}
                        onClickRight={handleCloseAll}
                        disabledContent={true}
                        onClickButton = {()=>handleStartRecors(scheduleDevices)}
                    />
                }
                { openGraph &&
                    <div className={styles.graphContainer}>
                        <div className={styles.graphContent}>
                            {scheduleDevices.map((item, index) => (
                                <RmerGraph key={index} item={item} onClick={handleCloseAll} socket={socket}
                                    // onClickPlay = {handleStartLiveDataId}
                                    // onClickPause = {handleStopLiveDataId}
                                    // stopStatus={stopStatus}
                                    withSlider={true}
                                    // onGlobalStop={handleGlobalStop}
                                />
                            ))}
                            {/* {devices.filter(item => selectedItems.includes(item.id)).map((item, index) => (
                                <RmerGraph key={index} item={item} onClick={()=>setOpenGraph(false)} />
                            ))} */}
                        </div>
                    </div>
                }
                {(statistics && !openMeasure) &&
                    <div className={styles.chartContainer}>
                        <div className={styles.headerChart}>
                            <h1>
                                Estadísticas generales
                            </h1>
                            <button onClick={()=> setStatistics(!statistics)}>
                                <Close width={20} height={20} />
                            </button>
                        </div>
                        <div className={styles.bodyChart}>
                            <DonutGraph graphDatas={countSchedules(schedules)} title={'Mediciones'}/>
                            <DonutGraph graphDatas={countDevices(devices)} title={'Dispositivos'}/>
                        </div>
                    </div>
                }
                <div className={styles.mapContainer}>
                    <MapPage points={devices} center={center} controls={false} offsetInit={[-0.05,0.05]} offset={[-0.09,0.02]} />
                </div>
            </div>
        </Dashboard>
    );
};

export default Platform;