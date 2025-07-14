'use client';

import styles from './DeviceBlock.module.css';
import Close from '@/assets/icon/close.svg';
import Clock from '@/assets/icon/clock.svg';
import Pin from '@/assets/icon/pin.svg';
import Map from '@/assets/icon/map.svg';

const DeviceBlock = ({item, title=null, button=true, buttonText, buttonTextSecondary, onClickRight, onClickButton, onClickAlternative=null,  onClickButtonSecondary, onClickRightButton, iconRightButton=null}) => {
    const color = item.status === 'connected' ? 'green' : item.status === 'disconnected' ? 'red' : 'blue';
    const state = item.status === 'connected' ? 'Activo' : item.status === 'disconnected' ? 'Inactivo' : 'Nuevo';
    return (
        <div className={styles.mainContainer}>
            <div className={styles.headerContainer}>
                <div className={`${styles.stateContainer} ${color==='yelow'? styles.yelow : color==='green'? styles.green : color==='blue'? styles.blue : styles.red }`}>
                    {state}
                </div>
                <div className={styles.titleContainer}>
                    {item.id} {item.serial_id}
                </div>
                <button className={styles.iconContainer} onClick={onClickRight}>
                    <Close width={20} height={20} />
                </button>
            </div>
            <div className={styles.acordionContent}>
                <div className={styles.accordionInside}>
                    <div className={styles.infoContainer}>
                        <div className={styles.icon}>
                            <Pin width={20} height={20} />
                        </div>
                        <p>
                            {item.location}
                        </p>
                    </div>
                    <div className={styles.infoContainer}>
                        <div className={styles.icon}>
                            <Map width={20} height={20} />
                        </div>
                        <p>
                            {item.latitude}, {item.longitude}
                        </p>
                    </div>
                    <div className={styles.infoContainer}>
                        <div className={styles.icon}>
                            <Clock width={20} height={20} />
                        </div>
                        <p>
                            {item.socketId}
                        </p>
                    </div>
                </div>
            </div>
            {button &&
                <div className={styles.buttonContainer}>
                    {item.status !== 'pending' &&
                        <button className={`${styles.buttonSecondary} buttonPrimary `} onClick={()=>onClickButtonSecondary(item.serial_id)}>
                            {buttonTextSecondary}
                        </button>
                    }
                    <button className={`${styles.callToAction} buttonPrimary `} onClick={()=>{item.status === 'pending'? onClickButton(item):onClickAlternative(item.serial_id)}}>
                        {item.status !== 'pending' ? buttonText : 'Agregar dispositivo'}
                    </button>
                    {iconRightButton &&
                        <button className={styles.iconContainer} onClick={onClickRightButton}>
                            {iconRightButton}
                        </button>
                    }
                </div>
            }
        </div>
    );
};

export default DeviceBlock;