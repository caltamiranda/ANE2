'use client';

import styles from './Switch.module.css';
import { useState } from 'react';

const Switch = ({ value=false, onClick }) => {
    const [isOn, setIsOn] = useState(value);

    const handleToggle = () => {
        setIsOn(!isOn);
        onClick && onClick(!isOn);
    }

    return (
        <div className={styles.mainContainer} onClick={handleToggle}>
            <div className={styles.bar}>
                {
                    isOn && 
                    <div className={styles.circleOn}></div>
                }
                {
                    !isOn && 
                    <div className={styles.circleOff}></div>
                }
            </div>
        </div>
    );
};

export default Switch;