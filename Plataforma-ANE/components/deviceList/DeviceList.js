'use client';

import styles from './DeviceList.module.css';
import Card from '@/components/card/Card';
import RmerOption from '@/components/rmerOption/RmerOption';
import RmtdtOption from '@/components/rmtdtOption/RmtdtOption';
import RniOption from '@/components/rniOption/RniOption';
import Select from '@/components/select/Select';
import { useContext } from 'react';
import { MainContext } from '@/context/MainContext';

const DeviceList = ({items, className, icon, onIconClick,  option, service=null, handleMeasure, disabled=false}) => {

    const { inputController, setInputController } = useContext(MainContext);
    const options = Object.keys(inputController.services);

    return (
        <div className={`${className} ${styles.listContent} ${disabled ? styles.disabled : ''}`}>
            {items.map((item, index) => (
                <div key={index}>
                    <Card  number={item.id} title={item.serial_id} subtitle={item.location} date={item.socketId} icon={icon} state={item.status==='connected'?'Activo':item.status==='disconnected'?'Inactivo':'Nuevo' } color={item.status==='connected'?'green': item.status==='disconnected'?'red':'blue'} onIconClick={()=>{onIconClick(item)}} />
                    {!service &&
                        <div className={styles.selectContainer}>
                            <Select id={item.id} options={options} value={item.measure || options[0]} onChange={handleMeasure}/>
                        </div>
                    }
                    { (option && (item.measure?.toLowerCase()==='rmer' || service?.toLowerCase() ==='rmer') ) &&
                        <RmerOption item={item} option={option} onChange={handleMeasure}/>
                    }
                    {
                        (option && (item.measure?.toLowerCase()==='rmtdt' || service?.toLowerCase() ==='rmtdt') ) &&
                        <RmtdtOption item={item} option={option} onChange={handleMeasure}/>
                    }
                    {
                        (option && (item.measure?.toLowerCase()==='rni' || service?.toLowerCase() ==='rni') ) &&
                        <RniOption  item={item} option={option} onChange={handleMeasure} />
                    }
                </div>
            ))}
        </div>
    );
};

export default DeviceList;