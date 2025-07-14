'use client';

import styles from './page.module.css';
import Dashboard from "@/components/dashboard/Dashboard";
import { Suspense } from 'react';
import Search from '@/components/search/Search';
import { useContext, useState, useEffect } from 'react';
import { MainContext } from '@/context/MainContext';
import RegularTable from '@/components/regularTable/RegularTable';

const Services = () => {
    const { inputController, setInputController } = useContext(MainContext);

    const formatData = (data) => {
        const newData = [];
        const keys = Object.keys(data);
        const keys0 = Object.keys(data[keys[0]]);
        const keys2 = Object.keys(data[keys[2]]);

        keys0.map((key) => {
            data[keys[0]][key].map((item) => {
                newData.push(
                    {
                        type: keys[0],
                        service: key,
                        notation: item.notation,
                        channel: '',
                        fmin: item.fmin,
                        fmax: item.fmax,
                        units: item.units,
                    }
                );
            });
        });
        
        data[keys[1]].map((item) => {
            newData.push(
                {
                    type: keys[1],
                    service: 'TDT',
                    notation: '',
                    channel: item.channel,
                    fmin: item.fmin,
                    fmax: item.fmax,
                    units: item.units,
                }
            );
        });

        keys2.map((key) => {
            data[keys[2]][key].map((item) => {
                newData.push(
                    {
                        type: keys[2],
                        service: key,
                        notation: item.notation,
                        channel: '',
                        fmin: item.fmin,
                        fmax: item.fmax,
                        units: item.units,
                    }
                );
            });
        });

        const dataInitial = {
            column_names:[
                {
                    id: 'type',
                    name: 'Tipo',
                },
                {
                    id: 'service',
                    name: 'Servicio',
                },
                {
                    id: 'notation',
                    name: 'Notación',
                },
                {
                    id: 'channel',
                    name: 'Canal',
                },
                {
                    id: 'fmin',
                    name: 'Frecuencia mínima',
                },
                {
                    id: 'fmax',
                    name: 'Frecuencia máxima',
                },
                {
                    id: 'units',
                    name: 'Unidades',
                },
            ],
            rows: newData,
        };

        return dataInitial;
    };

    return (
        <Dashboard>
            {inputController.role === 'admin' ?
                <div className={styles.mainContainer}>
                    <h1 className={styles.title}>Servicios</h1>

                    <Suspense fallback={<div>Loading...</div>}>
                        <Search className={styles.searchBar} placeholder="Buscar" />
                    </Suspense>
                    <Suspense fallback={<div>Loading...</div>}>
                        {inputController &&
                            <div className={styles.tableContainer}>
                                <RegularTable data={formatData(inputController.services)}/>
                            </div>
                        }
                    </Suspense>
                </div>
                :
                <div className={styles.block}>
                    <h1>No tienes permisos para ver esta página</h1>
                </div>
            }
        </Dashboard>
    );
};

export default Services;