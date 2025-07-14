'use client';

import styles from './Accordion.module.css';
import { useState } from 'react';
import Card from '@/components/card/Card';
import Chevronup from '@/assets/icon/chevronup.svg';
import { formatInTimeZone } from 'date-fns-tz';

const Accordion = ({items, className, icon, onIconClick=null, onClick=null, clickable=false, onClickAddButton=null, onClickLeaveButton=null, cardType}) => {
    const itemKeys = Object.keys(items);
    const [activeIndices, setActiveIndices] = useState(Array(itemKeys.length).fill(true));

    const handleToggle = (index) => {
        const newActiveIndices = [...activeIndices];
        newActiveIndices[index] = !newActiveIndices[index];
        setActiveIndices(newActiveIndices);
    };

    const formatDate = (date) => {
        const newDate = new Date(date);
        return `${newDate.getDate()}-${newDate.getMonth()+1}-${newDate.getFullYear().toString().slice(-2)} ${newDate.getHours()}:${newDate.getMinutes().toString().padStart(2, '0')}`
    }
    
    const formatDateMod = (date) => {
        const newDate = new Date(date);
        return `Programado el ${newDate.getDate()}-${newDate.getMonth()+1}-${newDate.getFullYear()} a las ${newDate.getHours()}:${newDate.getMinutes().toString().padStart(2, '0')}`
    }

    const convertDateTime = (inputDate) => {
        return formatInTimeZone(inputDate, 'America/Bogota', "yyyy-MM-dd'T'HH:mm");
      };

    return (
        <div className={`${className} ${styles.accordionContent}`}>
            {itemKeys.map((key, index) => (
                <div key={index} className={styles.insideContent}>
                    <button className={styles.accordionButton} onClick={() => handleToggle(index)}>
                        <p>{items[key].title} ({items[key].content.length})</p>
                        <Chevronup width={20} height={20} className={!activeIndices[index] ? styles.rotate : ''} />
                    </button>
                    {activeIndices[index] &&
                        items[key].content.map((item, i) => 
                            cardType === 'measurement' ? 
                            <Card key={i} title={item.uuid} subtitle={`${formatDate(item.start_date)} | ${formatDate(item.end_date)}`} date={formatDateMod(item.last_update)} icon={icon} onClickAddButton={()=>onClickAddButton(item)} onClickLeaveButton={()=>onClickLeaveButton(item.uuid)} onIconClick={()=>{onIconClick && onIconClick(item.uuid)}} state={item.status==='pending'?'Pendiente':item.status==='completed'?'Exitosa':item.status==='failure'?'Error': 'En curso'} color={item.status==='pending'?'blue':item.status==='completed'?'green':item.status==='failure'?'red': 'yelow'} onClick={()=>{onClick && onClick(item.uuid)}} clickable={clickable} type={cardType}/>
                            : 
                            cardType === 'pqr' ?
                            <Card key={i}  title={item.id} subtitle={item.message || "Chat vacío"} date={convertDateTime(item.updatedAt)} icon={icon} onClickAddButton={()=>onClickAddButton(item)} onClickLeaveButton={()=>onClickLeaveButton(item.id)} onIconClick={()=>{onIconClick && onIconClick(item.id)}} state={item.status==='nuevo' ? 'Nuevo' : 'Abierto' } color={item.status==='nuevo'?'red': item.status==='abierto'?'green':'red'} onClick={()=>{onClick && onClick(item.id)}} clickable={clickable} type={cardType}/>
                            :
                            <Card key={i} number={item.id} title={item.serial_id} subtitle={item.location} date={item.socketId} icon={icon} onClickAddButton={()=>onClickAddButton(item)} onClickLeaveButton={()=>onClickLeaveButton(item.serial_id)} onIconClick={()=>{onIconClick && onIconClick(item.id)}} state={item.status==='connected'?'Activo':item.status==='disconnected'?'Inactivo':'Nuevo' } color={item.status==='connected'?'green': item.status==='disconnected'?'red':'blue'} onClick={()=>{onClick && onClick(item.id)}} clickable={clickable} type={cardType}/>
                        )
                    }
                </div>
            ))}
        </div>
    );
}

export default Accordion;