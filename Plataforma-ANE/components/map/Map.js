'use client';

import * as atlas from 'azure-maps-control';
import 'azure-maps-control/dist/atlas.min.css';
import { useEffect, useRef, useState } from 'react';

const Map = ({points=[], center=[], controls=true, offsetInit=[-0.05,0.05], offset=[-0.04,0.0] }) => {
    const mapRef = useRef(null);
    const dataSourceRef = useRef(null);
    const [mapInstance, setMapInstance] = useState(null);

    const moda = (arr) =>
        arr.reduce(
            (a, b, i, arr) =>
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b,
            null
        );

    const extractValues = (list, key) => {
        return list.map(obj => obj[key]).filter(value => value !== undefined);
    };

    const adjustCenterWithOffset = (center, offset) => {
        const adjustedCenter = [
            center[0] + offset[0],
            center[1] + offset[1],
        ];
        return adjustedCenter;
    };

    if (center.length === 0) {
        const longitude = moda(extractValues(points, 'longitude'));
        const latitude = moda(extractValues(points, 'latitude'));
        center = [longitude, latitude];
    }

    useEffect(() => {
        // Create a link element
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css';
        link.type = 'text/css';
        document.head.appendChild(link);
      }, []);
    
    useEffect(() => {

        // Initialize the map with your subscription key
        // console.log(center, points,dataSourceRef.current);

        if (mapRef.current) {
            // Initialize the map with your subscription key
            console.log('Initializing map',process.env.NEXT_PUBLIC_MAP_SECRET);
            const map = new atlas.Map(mapRef.current, {
                center: center ? center : [-74.08175, 4.60971] , // Coordenadas de Bogotá [-74.08175, 4.60971]
                zoom: 11,
                authOptions: {
                    authType: atlas.AuthenticationType.subscriptionKey,
                    subscriptionKey: process.env.NEXT_PUBLIC_MAP_SECRET || "4tSo0G5WdLhEypShqrniGroi4sBc0RAbh1qn19Y7J1bak3BqQvJqJQQJ99AKACYeBjFbTfilAAAgAZMP3KDz",
                },
            });

            map.events.add('ready', () => {

                if (controls) {

                    map.controls.add(new atlas.control.ZoomControl(), {
                        position: 'top-right'
                    });
                    map.controls.add(new atlas.control.PitchControl(), {
                        position: 'top-right'
                    });
                    map.controls.add(new atlas.control.CompassControl(), {
                        position: 'top-right'
                    });
                }
                // Crear una fuente de datos y agregarla al mapa.
                const dataSource = new atlas.source.DataSource();
                map.sources.add(dataSource);
                dataSourceRef.current = dataSource;

                // if (!dataSourceRef.current) {
                    // dataSourceRef.current = dataSource;
                    // //Agregar puntos a la fuente de datos.
                    // points.forEach(point => {
                    //     const { longitude, latitude } = point;
                    //     const pointFeature = new atlas.data.Feature(new atlas.data.Point([longitude, latitude]),{
                    //         number: point.id.toString(),
                    //         name: point.serial_id,
                    //     });
                    //     dataSource.add(pointFeature);
                    // });
                // };
    
                // Crear una capa de símbolos para renderizar los puntos.
                const symbolLayer = new atlas.layer.SymbolLayer(dataSource, null, {
                    iconOptions: {
                        image: 'marker-blue', // Puedes personalizar el icono aquí
                        anchor: 'center',
                        allowOverlap: true,
                        size: 1.5,
                    },
                    textOptions: {
                        textField: ['get', 'number'], // Mostrar el número en el símbolo
                        offset: [0, 0], // Ajustar la posición del texto para que esté dentro del icono
                        color: 'white',
                        font: ['StandardFont-Bold'],
                        size: 20,
                        haloColor: 'black', // Añadir un halo para mejorar la legibilidad
                        haloWidth: 1,
                    },
                });
    
                // Agregar la capa de símbolos al mapa.
                map.layers.add(symbolLayer);

                // Crear un popup para mostrar información.
                const popup = new atlas.Popup({
                    pixelOffset: [0, -18],
                    closeButton: true,
                });

                // Agregar un evento de clic a la capa de símbolos.
                map.events.add('click', symbolLayer, (e) => {
                    if (e.shapes && e.shapes.length > 0) {
                        const properties = e.shapes[0].getProperties();
                        const coordinates = e.shapes[0].getCoordinates();
                        popup.setOptions({
                            content: `<div class="popup-content" >
                                        <div><strong>ID:</strong> ${properties.number}</div>
                                        <div><strong>Serial:</strong> ${properties.name}</div>
                                        <div><strong>Coordenadas:</strong> ${coordinates}</div>
                                      </div>`,
                            position: coordinates,
                        });
                        popup.open(map);
                    }
                });

                const adjustedCenter = [
                    center[0] + offsetInit[0],
                    center[1] + offsetInit[1],
                ];

                map.setCamera({
                    center: adjustedCenter,
                    duration: 600, // Suave transición al centro ajustado
                });
                setMapInstance(map);
            });

            return () => {
                map.dispose();
            };
        }
    }, []);

    useEffect(() => {
        if (dataSourceRef.current) {
            // console.log('Updating points');
            // Update the points dynamically
            const updatedFeatures = points.map((point) => {
                const { longitude, latitude, id, serial_id } = point;
                return new atlas.data.Feature(new atlas.data.Point([longitude, latitude]), {
                    number: id ? id?.toString() : 'N',
                    name: serial_id,
                });
            });
            dataSourceRef.current.setShapes(updatedFeatures);
        }
    }
    , [points, mapInstance]);

    useEffect(() => {
        if (mapInstance && center.length > 0) {
            mapInstance.setCamera({
                center: adjustCenterWithOffset(center,offset),
                type: 'fly', // Tipo de animación
                duration: 600, // Duración en milisegundos
                
            });
        }
    }, [center, mapInstance]);

    return (
        <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
    );
};

export default Map;