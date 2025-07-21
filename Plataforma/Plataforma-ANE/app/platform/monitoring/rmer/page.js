'use client'

import styles from './page.module.css';
import Dashboard from "@/components/dashboard/Dashboard";
import { Suspense } from 'react'
import SearchBlock from "@/components/searchBlock/SearchBlock";
import ActionBlock from '@/components/actionBlock/ActionBlock';
import { useState } from 'react';
import Download from '@/assets/icon/download.svg';
import RmerGraph from '@/components/rmerGraph/RmerGraph';
import { useSocket } from '@/context/SocketContext';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
const MapPage = dynamic(() => import('@/components/map/Map'), { ssr: false });
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

const Rmer = () => {
    const { socket, devices, lastModifyDevice } = useSocket();
    const [withTime, setWithTime] = useState(false);
    const [rec, setRec] = useState(false);

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

    const [openGraph, setOpenGraph] = useState(false);
    const [stopStatus, setStopStatus] = useState(true);

    const [availableItems, setAvailableItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        setAvailableItems(devices.filter(item => !selectedItems.map(item => item.id).includes(item.id)));
        setSelectedItems(selectedItems.filter(item => item.serial_id !== lastModifyDevice));
    }, [devices]);

    const selectItem = (id) => {
        const item = availableItems.find(item => item.id === id);
        setAvailableItems(availableItems.filter(item => item.id !== id));
        setSelectedItems([...selectedItems, {...item, measure:'RMER', startDate:null, endDate:null}]);
    }

    const deselectItem = (id) => {
        const item = selectedItems.find(item => item.id === id);
        setSelectedItems(selectedItems.filter(item => item.id !== id));
        setAvailableItems([...availableItems, item]);
        
        if (selectedItems.length === 1 || selectedItems.length === 0) {
            setOpenGraph(false);
        }
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
            item.startDate = null;
            item.endDate = null;
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

    const sendLiveDataCommand = (socketId,command, data) => {
        if (socket) {
            socket.emit("sendCommand", { socketId, command, data });
        }
    };

    const handleGraphs = (items) => {
        const command = rec ? "startLiveDataRec" : "startLiveData";
        items.map(item => {
            sendLiveDataCommand(item.socketId, command, item);
        });
        setOpenGraph(true);
        setStopStatus(false);
    }

    const handleCloseGraphs = (items) => {

        items.map(item => {
            sendLiveDataCommand(item.socketId, "stopLiveData");
        });

        setOpenGraph(false);
    }

    const handleStartLiveDataId = (item) => {
        const command = rec ? "startLiveDataRec" : "startLiveData";
        sendLiveDataCommand(item.socketId, command, item);
    }

    const handleCloseGraphId = (item) => {
        sendLiveDataCommand(item.socketId, "stopLiveData");
        deselectItem(item.id);
    }

    const handleStopLiveData = () => {
        selectedItems.map(item => {
            sendLiveDataCommand(item.socketId, "stopLiveData");
        });
        setStopStatus(true);
    }

    const handleStopLiveDataId = (item) => {
        sendLiveDataCommand(item.socketId, "stopLiveData");
    }

    const sendFetchRecord = (serial_id, startDate, endDate, fmin, fmax, measure) => {
        if (socket){
            socket.emit("fetchRecords",{serial_id, startDate, endDate, fmin, fmax, measure})
        }
    }

    const handleStartRecors = (items) => {
        // console.log('fetching records')
        items.map(item => {
            sendFetchRecord(item.serial_id, item.startDate, item.endDate, item.fmin, item.fmax, item.measure);
        });
        setOpenGraph(true);
        setStopStatus(false);
    }

    const handleDeselecteItem = (item) => {
        deselectItem(item.id);
        handleStopLiveDataId(item);
    }

    const verificationRMER = (items,timeInterval=false) => {
        let result = true;
        if (timeInterval){
            items.map(item => {
                if (
                    item.measure === '' ||
                    (item.band === '' || item.band === "Banda") ||
                    (item.fmin === null || item.fmin === undefined || item.fmin === 'Frecuencia') ||
                    (item.fmax === null || item.fmax === undefined || item.fmax === 'Frecuencia') ||
                    (item.units === '' || item.units === undefined ) ||
                    // (item.channel === '' || item.channel === 'Canal') ||
                    (item.startDate === null || !item.startDate)||
                    (item.endDate === null || !item.endDate)
                ){
                    result = false;
                }
            });
        } else {
            items.map(item => {
                if (
                    item.measure === '' ||
                    (item.band === '' || item.band === "Banda") ||
                    (item.fmin === null || item.fmin === undefined || item.fmin === 'Frecuencia') ||
                    (item.fmax === null || item.fmax === undefined || item.fmax === 'Frecuencia') ||
                    (item.units === '' || item.units === undefined )
                ){
                    result = false;
                }
            });
        }

        return result;
    }

    const handleRec = (option) => {
        setRec(option);
        handleStopLiveData();
    }

    const handleGlobalStop = () => {
        setStopStatus(true);
    }

    // console.log('selectedItems',selectedItems);

    return (
        <Dashboard>
            <div className={styles.mainContainer}>
                { !openGraph &&
                    <Suspense fallback={<div>Loading...</div>}>
                        <SearchBlock
                            items={availableItems}
                            onIconClick={selectItem}
                            activeName={'Agregar dispositivos'}
                            activeState={'connected'}
                            icon={'plus'}
                            button={false}
                        />
                    </Suspense>
                }
                <ActionBlock
                    items={selectedItems}
                    onIconClick={handleDeselecteItem}
                    handleMeasure={handleMeasure}
                    buttonText={(!openGraph || stopStatus) ? 'Graficar': 'Detener todo'}
                    icon={'minus'}
                    service={'rmer'}
                    onClickRight={() => handleCloseGraphs(selectedItems)}
                    onClickButton={()=>{(!openGraph || stopStatus) ? (withTime ? handleStartRecors(selectedItems): handleGraphs(selectedItems)) : handleStopLiveData() }}
                    iconRightButton={ openGraph ? <Download width={20} height={20} /> : null}
                    blockButton={selectedItems.length!=0 ? verificationRMER(selectedItems,withTime): false}
                    onChangeOption={setWithTime}
                    rec={rec}
                    handleRecord={handleRec}
                />
                { openGraph &&
                    <div className={styles.graphContainer}>
                        <div className={styles.graphContent}>
                            {selectedItems.map((item, index) => (
                                <RmerGraph key={index} item={item} onClick={()=>handleCloseGraphId(item)} socket={socket}
                                    onClickPlay = {handleStartLiveDataId}
                                    onClickPause = {handleStopLiveDataId}
                                    stopStatus={stopStatus}
                                    withSlider={withTime}
                                    onGlobalStop={handleGlobalStop}
                                />
                            ))}
                            {/* {devices.filter(item => selectedItems.includes(item.id)).map((item, index) => (
                                <RmerGraph key={index} item={item} onClick={()=>setOpenGraph(false)} />
                            ))} */}
                        </div>
                    </div>
                }
                <div className={styles.mapContainer}>
                    <MapPage points={devices.filter(item=>item.status==='connected')} center={center} controls={false} offsetInit={[-0.05,0.05]} offset={[-0.09,0.02]} />
                </div>
            </div>
        </Dashboard>
    );
}

export default Rmer;