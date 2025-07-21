"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    process.env.TZ = 'America/Bogota';
    const [socket, setSocket] = useState(null);
    const [devices, setDevices] = useState([]);
    const [lastModifyDevice, setLastModifyDevice] = useState(null);

    useEffect(() => {
        // Conecta el socket al servidor
        //const socketInstance = io('http://localhost:3000/admin'); // Cambia la URL según tu servidor
        const socketInstance = io('/admin');
        // const socketInstance = io('https://yellow-mud-0b1369c0f.5.azurestaticapps.net/admin'); // Cambia la URL según tu servidor
        
        setSocket(socketInstance);

        if (devices.length === 0) {
            socketInstance.emit('fetchConnectedDevices', (data) => {
                console.log("Fetching devices");
            })
        }

        socketInstance.on("connect", () => {
            console.log(`Connected with ID: ${socketInstance.id}`);
        });

        // Manejar solicitudes de registro
        socketInstance.on("requestAuthorization", (data) => {
            console.log("New registration request:", data);
            setDevices((prevRequests) => {
                if (prevRequests.some(device => device.serial_id === data.serial_id)) {
                    return prevRequests.map(device =>
                        device.serial_id === data.serial_id ? { ...data, status: 'pending' } : device);
                } else {
                    return [...prevRequests, { ...data, status: 'pending' }];
                }
            }
            );
        });

        socketInstance.on("fetchDeviceStatusResponse", (data) => {
            console.log("Device status fetched:", data);
            setDevices((prevDevices) => {
                return prevDevices.map(device =>
                    device.serial_id === data.serial_id ? { ...device, status: data.status } : device);
            });
        });

        socketInstance.on('connectedDevicesResponse', (data) => {
            if (data.success) {
                setDevices(data.devices);
            } else {
                console.error(data.message);
            }
        });

        socketInstance.on("deviceStatus", (data) => {
            console.log("Device status update:", data);
            setDevices((prevDevices) => {
                return prevDevices.map(device =>
                    device.serial_id === data.serial_id ? { ...device, location:data.location ,longitude:data.longitude, latitude:data.latitude, socketId:data.socketId ,status: data.status } : device);
            });
            setLastModifyDevice(data.serial_id);
        });

        socketInstance.on("authorizationResponse", (data) => {
            console.log('Device authorized',data);
            if (data.success) {
                setDevices((prevDevices) => {
                    return prevDevices.map(device =>
                        device.serial_id === data.device.serial_id ? {...device, id:data.device.id} : device);
                }
                );
            } else {
                console.error(data.message);
            }
        });

        socketInstance.on("deleteDeviceResponse", (data) => {
            if (data.success) {
                setDevices((prevDevices) => {
                    return prevDevices.filter(device => device.serial_id !== data.serial_id);
                });
            } else {
                console.error(data.message);
            }
        });

        // socketInstance.on("data", (data) => {
        //     console.log("Data received:", data);
        // });

        // Limpia la conexión cuando el componente se desmonta
        return () => {
            socketInstance.disconnect();
        };
    }, []);

    // console.log('reload', devices);


    return (
        <SocketContext.Provider value={{socket, devices, lastModifyDevice}}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
