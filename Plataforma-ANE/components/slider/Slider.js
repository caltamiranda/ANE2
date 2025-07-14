'use client';

import styles from './Slider.module.css';
import {useState } from 'react';

const Slider = ({ min = 0, max = 100, step = 1, value, onChange, disable, points }) => {
    const [tooltipValue, setTooltipValue] = useState(value);
    const [showTooltip, setShowTooltip] = useState(false);

    const handleMouseOver = (event) => {
        setTooltipValue(points[event.target.value]);
        setShowTooltip(true);
    };

    const handleMouseOut = () => {
        setShowTooltip(false);
    };

    return (
        <div className={styles.sliderContainer}>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                onMouseOver={handleMouseOver}
                onMouseMove={handleMouseOver}
                onMouseOut={handleMouseOut}
                className={`${styles.slider} ${disable ? styles.disabled : ''}`}
                disabled={disable}
            />
            {showTooltip && (
                <div className={`${styles.tooltip} ${value===min ? styles.left : ''} ${value===max ? styles.right : ''}`} style={{ left: `${((value - min) / (max - min)) * 100}%` }}>
                    {tooltipValue}
                </div>
            )}
        </div>
    );
};

export default Slider;