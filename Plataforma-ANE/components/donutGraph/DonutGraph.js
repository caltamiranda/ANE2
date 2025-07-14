'use client';

import styles from './DonutGraph.module.css';
import { Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, ArcElement, Title, Tooltip, Legend, PointElement, Filler, plugins } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useEffect } from 'react';

Chart.register(CategoryScale, LinearScale, ArcElement, PointElement, Title, Tooltip, Legend, Filler);
// Chart.register(ChartDataLabels);

// Chart.defaults.font.family = 'Nunito Sans, sans-serif'; // Asegúrate de que 'TuFuente' sea la misma que usas en tu app
// Chart.defaults.font.size = 16; 
// Chart.defaults.color = '#333';

const DonutGraph = ({ graphDatas, title }) => {

    const keys = Object.keys(graphDatas);

    const data = {
        datasets: [{
            data: keys.map(key => graphDatas[key].count),
            backgroundColor: keys.map(key => graphDatas[key].color),
            hoverOffset: 1,
        }],
    
        // These labels appear in the legend and in the tooltips when hovering different arcs
        labels: keys.map(key => graphDatas[key].label)
    };

    const options={
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'right',
                labels: {
                    boxWidth: 20,
                    padding: 8,
                    font: {
                        size: 14
                    }
                }
            },
            title: {
                display: true,
                text: title, // Título de la gráfica
                font: {
                    size: 20,
                    weight: '500'
                }
            },
            datalabels: {
                display: true,
                color: '#333',
                formatter: (value, context) => {
                    return value === 0 ? null : value; // Quitar el datalabel si el valor es cero
                },
                font: {
                    weight: '500'
                }
            },
        }
    };

    return (
        <div className={styles.mainContainer}>
            <Doughnut
                data={data}
                options={options}
            />
        </div>
    );
}

export default DonutGraph;