'use client';

import styles from './MainPicker.module.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale} from  "react-datepicker";
import { es } from 'date-fns/locale/es';
import React, { useState, forwardRef, useEffect } from 'react';
import Calendar from '@/assets/icon/calendar.svg';

const MainPicker = ({placeholder, value=null, id, onChange, type, minDate=null, disabled, items=[]}) => {
    registerLocale('es', es)
    const [startDate, setStartDate] = useState(value ? new Date(value) : null);

    const CustomInput = forwardRef(
        ({ value, onClick, className, placeholder }, ref) => (
            <button className={`${className} ${disabled ? styles.disabled : ''}`} onClick={onClick} ref={ref} disabled={disabled}>
                <p>{value || placeholder}</p>
                <div className={styles.icon}>
                    <Calendar width={20} height={20} />
                </div>
            </button>
        ),
      );

      CustomInput.displayName = 'CustomInput';
    
      const handleChange = (option) => {
        setStartDate(option);
        if (onChange && id) {
            onChange(id, option, type);
        } else if ( onChange && items.length > 0) {
            items.map(item =>{
                onChange(item.id, option, type);
            });
        }
    }

    useEffect(() => {
        setStartDate(value ? new Date(value) : null);
    }
    , [value]);

    return (
        <div className={styles.pickerContainer}>
            <DatePicker 
                className={styles.datePicker}
                calendarClassName={'custom-calendar'}
                selected={startDate}
                minDate={minDate}
                placeholderText={placeholder}
                value={startDate}
                showTimeSelect
                showTimeCaption
                timeCaption="Hora"
                onChange={(date) => handleChange(date)}
                dateFormat="MMM d, yy HH:mm"
                locale="es"
                calendarStartDay={7}
                closeOnScroll={true}
                customInput={<CustomInput className={styles.input} value={value} placeholder={placeholder} />}
                disabled={disabled}
            />
        </div>
    );
};

export default MainPicker;