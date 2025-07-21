'use client';

import styles from './ActionBlock.module.css';
import Close from '@/assets/icon/close.svg';
import DeviceList from '../deviceList/DeviceList';
import { useState } from 'react';
import MainPicker from '@/components/mainPicker/MainPicker';
import Switch from '@/components/switch/Switch';

const ActionBlock = ({items, title=null, uuid=null, icon, onIconClick, button=true, buttonText, onClickRight=null ,onClickButton, onClickRightButton, iconRightButton=null, service=null, handleMeasure, blockButton=false, onChangeOption=null, rec, handleRecord, disabledContent}) => {
    const [option, setOption] = useState('noProgramado');
    const handleOption = (option) => {
        setOption(option);
        onChangeOption && onChangeOption(option==='noProgramado' ? false : true);
    }

  return (
    <div className={styles.mainContainer}>
        <div className={styles.headerContainer}>
            <div className={styles.titleContainer}>
                {
                    title ?
                    <p  className={styles.title}>
                        {title} <br/>
                        {uuid}
                    </p>
                    :
                    <div className={styles.switchSelectContainer}>
                        <div className={styles.selectContainer}>
                            <button className={`${styles.selectButton} ${option==='noProgramado' ? styles.selectedButton: ''}`} onClick={()=>handleOption('noProgramado')}>
                                <p>
                                    No programado
                                </p>
                            </button>
                            <button className={`${styles.selectButton} ${option==='programado' ? styles.selectedButton: ''}`} onClick={()=>handleOption('programado')}>
                                <p>
                                    Programado
                                </p>
                            </button>
                        </div>
                        {option!='programado' &&
                            <div className={styles.switchContainer}>
                                <p className={!rec ? styles.off: ''}>Grabar</p>
                                <Switch value={rec} onClick={handleRecord} />
                            </div>
                        }
                    </div>
                }
            </div>
            <button className={styles.iconContainer} onClick={onClickRight}>
                <Close width={20} height={20} />
            </button>
        </div>
        <div className={styles.acordionContent}>
            {
                (title && items.length>0) &&
                <div className={styles.optionContainer}>
                    <p className={styles.durTitle}>Duración</p>
                    <div className={styles.durationContainer}>
                        <div className={styles.selectDurContainer}>
                            <MainPicker value={items[0]?.startDate} placeholder={'Fecha inicial'} items={items} onChange={handleMeasure} type='startDate' minDate={new Date()} disabled={false}/>
                        </div>
                        <div className={styles.selectDurContainer}>
                            <MainPicker value={items[0]?.endDate} placeholder={'Fecha final'} items={items} onChange={handleMeasure} type='endDate' minDate={items[0]?.startDate} disabled={items[0].startDate===null || items[0].startDate===undefined || disabledContent}/>
                        </div>
                    </div>
                </div>
            }
            <div className={styles.accordionInside}>
                <DeviceList items={items} icon={icon} onIconClick={onIconClick} option={option} service={service} handleMeasure={handleMeasure} disabled={disabledContent}/>
            </div>
        </div>
        {button &&
            <div className={styles.buttonContainer}>
                <button className={`${styles.callToAction} ${!blockButton && styles.buttonBlock} buttonPrimary `} onClick={onClickButton} disabled={!blockButton}>
                    {buttonText}
                </button>
                {(iconRightButton && option==='programado' ) &&
                    <button className={styles.iconContainer} onClick={onClickRightButton}>
                        {iconRightButton}
                    </button>
                }
            </div>
        }
    </div>
  );
};

export default ActionBlock;