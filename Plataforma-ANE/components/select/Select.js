'use client';

import styles from './Select.module.css';
import Chevrondown from '@/assets/icon/chevrondown.svg';
import { useState, useEffect, useRef } from 'react';

const Select = ({ id, options, value, onChange, type='measure', selectionValue=false, uppercase=false }) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(value);
    const selectRef = useRef(null);

    useEffect(() => {
        setSelected(value);
        if (onChange) {
            onChange(id, value, type);
        }
    }
    , [value]);
    
    useEffect(() => {
        if (onChange) {
            onChange(id, value, type);
        }
        // console.log('useEffect');
    }
    , []);

    const handleChange = (option) => {
        setSelected(option);
        setOpen(false);
        if (onChange) {
            onChange(id, option, type);
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

    return (
        <div className={styles.mainContainer} ref={selectRef}>
            <button className={styles.select} onClick={()=>{setOpen(!open)}} disabled={options.length === 0}>
                <p className={`${uppercase ? styles.upper : ''}`}>{selected}</p>
                <div className={`${styles.icon} ${open ? styles.rotate : ''}`} >
                    <Chevrondown width={20} height={20} />
                </div>
            </button>
            {open &&
                <div className={styles.optionsContainer}>
                    {options.map((option, index) => (
                        <button key={index} className={styles.option} onClick={()=>{handleChange(option)}}>
                            <p className={`${uppercase ? styles.upper : ''}`}>{option}</p>
                        </button>
                    ))}
                </div>
            }
        </div>
    );
}

export default Select;