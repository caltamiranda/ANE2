'use client';

import styles from './Card.module.css';
import Hdots from '@/assets/icon/hdots.svg';
import Plus from '@/assets/icon/plus.svg';
import Minus from '@/assets/icon/minus.svg';
import { useState, useEffect, useRef } from 'react';

const Card = ({number=null, title, subtitle, date, icon='dots', onIconClick=null,onClickAddButton=null, onClickLeaveButton=null, state, color='yelow', onClick=null, clickable, type='devices'}) => {

    const [open, setOpen] = useState(false);
    const selectRef = useRef(null);

    const handleClick = () => {
        setOpen(!open);
        if (onIconClick) {
            onIconClick();
        }
    }

    const handleClickOutside = (event) => {
        if (selectRef.current && !selectRef.current.contains(event.target)) {
            setOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleCardClick = () => {
        setOpen(!open);
        if (onClick) {
            onClick();
        }
    }

    return (
        <div className={styles.cardContainer} >
            <div className={`${styles.leftContainer} ${clickable && styles.clickable}`} onClick={onClick ? onClick : undefined}>
                <div className={styles.infoContainer}>
                    {number &&
                        <div className={styles.number}>
                            <p>
                                {number}
                            </p>
                        </div>
                    }
                    <div className={styles.titleContainer}>
                        <h2>
                            {title}
                        </h2>
                        <p>
                            {subtitle}
                        </p>
                    </div>
                </div>
                <p className={styles.date}>
                    {date}
                </p>
            </div>
            <div className={styles.rightContainer}>
                
                <div className={styles.iconContainer} onClick={onIconClick && onIconClick} ref={selectRef}> 
                    {icon==='dots' && <Hdots onClick={handleClick} width={20} height={20} />}
                    {icon==='plus' && <Plus width={20} height={20} />}
                    {icon==='minus' && <Minus width={20} height={20} />}

                    {(icon==='dots' && open) &&
                        <div className={styles.dropdown}>
                            <button className={styles.option} onClick={handleCardClick}>
                                <p>
                                    Ver
                                </p>
                            </button>
                            {type === 'devices'  ?
                                state !== 'Nuevo' ? 
                                    <button className={styles.option} onClick={onClickLeaveButton}>
                                        <p>
                                            Olvidar
                                        </p>
                                    </button>
                                    :
                                    <button className={styles.option} onClick={onClickAddButton}>
                                        <p>
                                            Agregar
                                        </p>
                                    </button>
                                :
                                state !== 'En curso' ?
                                    <button className={styles.option} onClick={onClickLeaveButton}>
                                        <p>
                                            Eliminar
                                        </p>
                                    </button>
                                    :
                                    <button className={styles.option} onClick={onClickAddButton}>
                                        <p>
                                            Cancelar
                                        </p>
                                    </button>
                            }
                        </div>
                    }
                </div>
                
                <div className={`${styles.stateContainer} ${color==='yelow'? styles.yelow : color==='green'? styles.green : color==='blue'? styles.blue : styles.red }`}
                >
                    <p>
                        {state}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Card;