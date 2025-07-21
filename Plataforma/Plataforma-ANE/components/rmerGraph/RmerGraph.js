'use client';

import styles from './RmerGraph.module.css';
import Close from '@/assets/icon/close.svg';
import PlayIcon from '@/assets/icon/playIcon.svg';
import PauseIcon from '@/assets/icon/pauseIcon.svg';
import { Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement, Filler } from 'chart.js';
import { useEffect, useState } from 'react';
import Slider from '@/components/slider/Slider';
import { formatInTimeZone } from 'date-fns-tz';
import HParamTable from '@/components/hParamTable/HParamTable';
import TableIcon from '@/assets/icon/tableIcon.svg'; 

Chart.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const RmerGraph = ({item, onClick, socket, onClickPlay=null, onClickPause=null, stopStatus, withSlider=false, onGlobalStop}) => {
    
    const [recivedData, setRecivedData] = useState(null);
    const [isPlaying, setIsPlaying] = useState(null);
    const [recivedMultipleData, setRecivedMultipleData] = useState(null);
    const [sliderValue, setSliderValue] = useState(0);
    const [showParams, setShowParams] = useState(false);

    useEffect(() => {
        setIsPlaying(!stopStatus);
    }
    ,[stopStatus]);

    useEffect(() => {
        if (isPlaying!==null) {
            setIsPlaying(false);
        }
        setRecivedMultipleData(null);
        setSliderValue(0);
        setRecivedData(null);
    },[withSlider]);

    useEffect(() => {

        socket.on("dataStreamingResponse", (data) => {
            if (data.serial_id === item.serial_id) {
                setRecivedData(data);
            }
        });

        socket.on("dataResponse", (data) => {
            if (data.serial_id === item.serial_id) {
                setRecivedData(data);
            }
        });

        socket.on("fetchRecordsResponse", (data) => {
            // console.log('response',data);
            if (data.serial_id === item.serial_id) {
                setRecivedMultipleData(data.records);
                setRecivedData(data.records[0]);
                setIsPlaying(false);
                onGlobalStop && onGlobalStop();
            }
        });

    },[socket]);

    const getYLimits = (data) => {
        if (!data || !data.vectors || !data.vectors.Pxx) return { min: 0, max: 0 };
        const values = recivedMultipleData ? JSON.parse(recivedData.vectors).Pxx :data.vectors.Pxx;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min;
        return {
            min: min - range * 0.05,
            max: max + range * 0.05
        };
    };

    const yLimits = getYLimits(recivedData);

    const data = {
        labels: recivedData ? (withSlider&&recivedMultipleData ? JSON.parse(recivedData.vectors).f :recivedData?.vectors?.f) : [],
        datasets: [
            {
                label: 'Espectro [dB]',
                data: recivedData ? ( withSlider&&recivedMultipleData ? JSON.parse(recivedData.vectors).Pxx : recivedData?.vectors?.Pxx) : [],
                fill: false,
                backgroundColor: 'rgba(51, 102, 204, 0.7)',
                borderColor: 'rgba(51, 102, 204, 0.7)',
                pointRadius: 0,
                tension:0.1,
                borderWidth: 1,
            },
        ],
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Frecuencia [Hz]', // Nombre del eje X
                },
                // ticks: {
                //     callback: function(value) {
                //         return value.toFixed(1); // Asegúrate de que los valores tengan dos decimales
                //     },
                // },
            },
            y: {
                suggestedMin: yLimits.min,
                suggestedMax: yLimits.max,
            },
        },
    };

    const handlePause = (item) => {
        onClickPause(item);
        setIsPlaying(false);
    };

    const handlePlay = (item) => {
        onClickPlay(item);
        setIsPlaying(true);
    };

    const handleSliderChange = (e) => {
        const value = Number(e.target.value);
        setRecivedData(recivedMultipleData[value]);
        setSliderValue(value);
    };

    const convertDateTime = (inputDate) => {
        return formatInTimeZone(inputDate, 'America/Bogota', "MMM d, yy HH:mm:ss");
      };


    const getDates = (dataRecords) => {
        const dates = [];
        dataRecords.map(data => {
            dates.push(convertDateTime(data.datetime));
        });
        return dates;
    }

    return (
        <div className={`${styles.chartContainer} ${withSlider ? styles.chartSlider : ''} ${showParams ? styles.params : ''}`}>
            <div className={styles.headerChart}>
                <h1>
                    {item.id} {item.serial_id}
                </h1>
                <div className={styles.buttonContainer}>
                    <button className={styles.buttonIcon} onClick={()=>setShowParams(!showParams)} disabled={!recivedData}>
                        <TableIcon width={18} height={18} />
                    </button>
                    <button className={styles.buttonIcon} onClick={()=>{isPlaying ?  handlePause(item) : handlePlay(item) }} disabled={withSlider}>
                        {
                            isPlaying ?
                            <PauseIcon width={18} height={18} /> :
                            <PlayIcon width={18} height={18} />
                        }
                    </button>
                    <button onClick={onClick}>
                        <Close width={20} height={20} />
                    </button>
                </div>
            </div>
            <div className={styles.chartContainerInside}>
                <Line data={data} options={options} />
            </div>
            {withSlider &&
                <div className={styles.sliderContainer}>
                    <Slider min={0} max={recivedMultipleData && recivedMultipleData.length-1} onChange={handleSliderChange} value={sliderValue} disable={recivedMultipleData ? false : true} points={recivedMultipleData && getDates(recivedMultipleData)}/>
                </div>
            }
            {(showParams && recivedData?.params!== '{}')&&
                <div className={styles.tableContainer}>
                    {/* {item.measure==='RMER' || item.measure==='RNI' ? */}
                        <HParamTable data={recivedData?.params} />
                    {/* : null} */}
                </div>
            }
        </div>
    );
};

export default RmerGraph;