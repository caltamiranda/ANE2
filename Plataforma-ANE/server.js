const { createServer } = require('http');
const { Server } = require('socket.io');
const sql = require('mssql');

const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        handle(req, res);
    });

    const io = new Server(server, {
        cors: {
            origin: ['*','https://ane-sensing-platform-856499956108.us-central1.run.app/platform','http://localhost:5001'], // Permite cualquier origen
            methods: ['GET', 'POST'],
            allowedHeaders: ['Content-Type'],
            credentials:false
        }
    });

    //admin namespace
    const adminNamespace = io.of('/admin');
    

    const config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD ,
        server: process.env.DB_HOST,
        database: process.env.DB_NAME,
        options: {
            encrypt: true, // Para Azure
            trustServerCertificate: false // Solo para desarrollo local
        }
    };
    
    let pool;
    
    // Configurar la conexión a la base de datos
    async function connectToDatabase() {
        try {
            pool = await sql.connect(config);
            console.log("Conectado a SQL Server.");
        } catch (err) {
            console.error("Error conectando a SQL Server:", err);
        }
    }
    
    // Configurar la base de datos
    async function setupDatabase() {
        try {
            // Crear tabla Devices si no existe
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Devices' AND xtype='U')
                BEGIN
                    CREATE TABLE Devices (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        serial NVARCHAR(255) UNIQUE NOT NULL,
                        socketId NVARCHAR(255) UNIQUE,
                        location NVARCHAR(255) NOT NULL,
                        latitude DECIMAL(9, 6) NOT NULL,
                        longitude DECIMAL(9, 6) NOT NULL
                    );
                END
            `);
            console.log("Tabla 'Devices' creada o ya existía.");

            // Crear tabla DataRecords si no existe
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DataRecords' AND xtype='U')
                BEGIN
                    CREATE TABLE DataRecords (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        serial_id INT NOT NULL,
                        datetime DATETIME DEFAULT GETDATE(),
                        fmin NVARCHAR(255),
                        fmax NVARCHAR(255),
                        measure NVARCHAR(255),
                        channel NVARCHAR(255),
                        band NVARCHAR(255),
                        units NVARCHAR(50),
                        vectors NVARCHAR(MAX),
                        params NVARCHAR(MAX),
                        FOREIGN KEY (serial_id) REFERENCES Devices(id) ON DELETE CASCADE
                    );
                END
            `);
            console.log("Tabla 'DataRecords' creada o ya existía.");
                    // Crear tabla Schedules
            // Crear tabla Schedules
            await pool.request().query(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Schedules' AND xtype='U')
                BEGIN
                    CREATE TABLE Schedules (
                        id INT IDENTITY(1,1) PRIMARY KEY, -- ID único para la programación
                        uuid UNIQUEIDENTIFIER DEFAULT NEWID(), -- UUID para identificar la programación
                        serial NVARCHAR(255) NOT NULL, -- Serial del dispositivo
                        socketId NVARCHAR(255), -- ID del socket
                        location NVARCHAR(255), -- Ubicación
                        latitude DECIMAL(9, 6), -- Latitud
                        longitude DECIMAL(9, 6), -- Longitud
                        band NVARCHAR(255), -- Banda
                        channel NVARCHAR(255), -- Canal
                        measure NVARCHAR(255), -- Medida
                        units NVARCHAR(50), -- Unidades
                        fmin NVARCHAR(255), -- Frecuencia mínima
                        fmax NVARCHAR(255), -- Frecuencia máxima
                        start_time DATETIME, -- Fecha de inicio
                        end_time DATETIME, -- Fecha de fin
                        status NVARCHAR(50) NOT NULL CHECK (status IN ('connected', 'pending', 'success', 'failure')), -- Estado
                        created_at DATETIME DEFAULT GETDATE() -- Fecha de creación
                    );
                    PRINT 'Table Schedules created successfully.';
                END;
            `);
            console.log('Table Schedules configured successfully.');

        } catch (err) {
            console.error("Error configurando la base de datos:", err);
        }
    }

    // Configurar base de datos al inicio
    connectToDatabase().then(setupDatabase);

    io.on('connection', async (socket) => {
        console.log('New client connected');

        // Manejo de conexión inicial con verificación del serial_id
        socket.on('init', async (deviceInfo) => {
            const { serial_id, location, latitude, longitude } = deviceInfo;

            try {
                const connection = await pool.request();

                // Verificar si el serial_id ya está registrado en la base de datos
                const result = await connection
                    .input('serial', sql.NVarChar, serial_id)
                    .query(`SELECT * FROM Devices WHERE serial = @serial`);

                const rows = result.recordset;

                const apiVersion = '1.0';
                const apiKey = process.env.NEXT_PUBLIC_MAP_SECRET || '4tSo0G5WdLhEypShqrniGroi4sBc0RAbh1qn19Y7J1bak3BqQvJqJQQJ99AKACYeBjFbTfilAAAgAZMP3KDz';
                const lang = 'es-ES';
                const mapUrl = `https://atlas.microsoft.com/search/address/reverse/json/?api-version=${apiVersion}&subscription-key=${apiKey}&language=${lang}&query=${latitude}, ${longitude}`;

                const requestOptions = {
                    method: "GET",
                    redirect: "follow"
                };

                let newLocation = location;

                try {
                    const responseMaps = await fetch(mapUrl, requestOptions);
                    const dataMaps = await responseMaps.json();
                    newLocation = dataMaps?.addresses[0]?.address?.municipality;
                } catch (err) {
                    console.error('Error fetching address:', err);
                }

                if (rows.length > 0) {
                    console.log(`Device with serial_id: ${serial_id} is already registered.`);
                    // Crear un nuevo objeto de solicitud para la actualización
                    const updateRequest = pool.request();
                    await updateRequest
                        .input('socketId', sql.NVarChar, socket.id)
                        .input('serial', sql.NVarChar, serial_id)
                        .input('location', sql.NVarChar, newLocation || location)
                        .input('latitude', sql.Decimal(9, 6), latitude)
                        .input('longitude', sql.Decimal(9, 6), longitude)
                        .query(`UPDATE Devices SET socketId = @socketId, location = @location, latitude = @latitude, longitude = @longitude WHERE serial = @serial`);


                    socket.deviceAuthorized = true;
                    socket.deviceId = rows[0].id;
                    socket.serial_id = serial_id;  // Almacenar serial_id en el socket

                    socket.emit('authorizationStatus', { authorized: true });
                    // Notificar al administrador que un dispositivo se conectó
                    adminNamespace.emit('deviceStatus', {
                        serial_id,
                        socketId: socket.id,
                        location: newLocation || location,
                        latitude: latitude,
                        longitude: longitude,
                        // location: rows[0].location,
                        // latitude: rows[0].latitude,
                        // longitude: rows[0].longitude,
                        status: 'connected'
                    });
                    
                } else {
                    console.log(`Device with serial_id: ${serial_id} is not registered.`);
                    socket.deviceAuthorized = false;

                    // Emitir al administrador para solicitar autorización
                    adminNamespace.emit('requestAuthorization', {
                        serial_id,
                        socketId: socket.id,
                        location: newLocation || location,
                        latitude,
                        longitude,
                    });
                    socket.emit('authorizationStatus', { authorized: false });
                }
            } catch (err) {
                console.error('Error during serial verification:', err);
            }
        });


        // Manejar desconexión
        socket.on('disconnect', async () => {
            if (socket.deviceAuthorized) {
                console.log(`Authorized device disconnected: ${socket.id}`);

                try {
                    const poolRequest = pool.request();

                    // Buscar dispositivo por socketId
                    const result = await poolRequest
                        .input('socketId', sql.NVarChar, socket.id)
                        .query(`SELECT * FROM Devices WHERE socketId = @socketId`);
        
                    const rows = result.recordset;

                    if (rows.length > 0) {
                        // Notificar al administrador que un dispositivo se desconectó
                        adminNamespace.emit('deviceStatus', {
                            serial_id: rows[0].serial,
                            socketId: socket.id,
                            location: rows[0].location,
                            latitude: rows[0].latitude,
                            longitude: rows[0].longitude,
                            status: 'disconnected'
                        });
                    }

                } catch (err) {
                    console.error('Error during disconnect:', err);
                }
            } else {
                console.log(`Unauthorized client disconnected: ${socket.id}`);
            }
        });


        socket.on('data', async (data) => {
            try {
                const parsedData = JSON.parse(data);
    
                if (!socket.deviceId) {
                    console.error('Device ID is missing for this socket.');
                    return;
                }
    
                const { datetime, vectors, params, fmin, fmax, measure, channel, band, units } = parsedData;
                const vectorData = JSON.stringify(vectors); // Convertir vectores a JSON una sola vez
                const paramsData = JSON.stringify(params);
                const poolRequest = pool.request();
        
                // Verificar si los vectores ya existen o asociarlos con el conjunto de registros
                // for (const record of records) {
                    // let { datetime, freq, power, power_max, snr } = record;
        
                    // if (typeof freq !== 'string') {
                    //     freq = JSON.stringify(freq); // Asegurar que freq sea un JSON string
                    // }
        
                    // const currentDate = new Date().toISOString().split('T')[0];
                    // const datetime = `${currentDate} ${time}`;
        
                    // if (power === undefined || power_max === undefined || snr === undefined) {
                    //     console.error('Missing data fields in record:', record);
                    //     continue;
                    // }
        
                    // Inserción en la tabla DataRecords
                    await poolRequest
                        .input('serial_id', sql.Int, socket.deviceId) // ID del dispositivo asociado
                        .input('datetime', sql.DateTime, datetime)        // Fecha y hora del registro
                        .input('vectors', sql.NVarChar, vectorData)  // Vectores como JSON
                        .input('params', sql.NVarChar, paramsData)
                        .input('fmin', sql.NVarChar, fmin)
                        .input('fmax', sql.NVarChar, fmax)
                        .input('measure', sql.NVarChar, measure)
                        .input('channel', sql.NVarChar, channel)
                        .input('band', sql.NVarChar, band)
                        .input('units', sql.NVarChar, units)
                        .query(`
                            INSERT INTO DataRecords (serial_id, datetime, vectors, params, fmin, fmax, measure, channel, band, units)
                            VALUES (@serial_id, @datetime, @vectors, @params, @fmin, @fmax, @measure, @channel, @band, @units)
                        `);
        
                    console.log(`Data record inserted for device ID: ${socket.deviceId}`);

                    // Emitir los datos al administrador solo con serial_id
                    adminNamespace.emit('dataResponse', {
                        serial_id: socket.serial_id,
                        ...parsedData,  // Incluye los vectores y datos adicionales
                    });
                // }
            } catch (err) {
                console.error('Error inserting data record:', err);
            }
        });

        socket.on('dataStreaming', async (data) => {
            try {
                const parsedData = JSON.parse(data);
    
                if (!socket.deviceId) {
                    console.error('Device ID is missing for this socket.');
                    return;
                }
    
                // const { vectors, data: records } = parsedData;
                // const vectorData = JSON.stringify(vectors); // Convertir vectores a JSON una sola vez
                // const poolRequest = pool.request();
        
                // Verificar si los vectores ya existen o asociarlos con el conjunto de registros
                // for (const record of records) {
                    // let { datetime, freq, power, power_max, snr } = record;
        
                    // if (typeof freq !== 'string') {
                    //     freq = JSON.stringify(freq); // Asegurar que freq sea un JSON string
                    // }
        
                    // const currentDate = new Date().toISOString().split('T')[0];
                    // const datetime = `${currentDate} ${time}`;
        
                    // if (power === undefined || power_max === undefined || snr === undefined) {
                    //     console.error('Missing data fields in record:', record);
                    //     continue;
                    // }

                    // Emitir los datos al administrador solo con serial_id
                    adminNamespace.emit('dataStreamingResponse', {
                        serial_id: socket.serial_id,
                        ...parsedData,  // Incluye los vectores y datos adicionales
                    });
                // }
            } catch (err) {
                console.error('Error inserting data record:', err);
            }
        });

    });

    // Manejo del espacio /admin
    adminNamespace.on('connection', (socket) => {
        console.log(`Admin connected: ${socket.id}`);

        socket.on('fetchConnectedDevices', async () => {
            try {
                const connectedSockets = Array.from(io.sockets.sockets.keys()); // Obtiene los IDs de sockets activos
                const poolRequest = pool.request();
        
                // Consulta para obtener todos los dispositivos de la base de datos
                const allDevicesResult = await poolRequest.query(`
                    SELECT id, serial AS serial_id, socketId, location, latitude, longitude 
                    FROM Devices
                `);
        
                const allDevices = allDevicesResult.recordset;
        
                // Agregar estado de conexión a cada dispositivo
                const devicesWithStatus = allDevices.map(device => ({
                    ...device,
                    // serial_id: device.serial,
                    status: connectedSockets.includes(device.socketId) ? 'connected' : 'disconnected'
                }));
        
                // Emitir la lista de dispositivos con sus estados al administrador
                socket.emit('connectedDevicesResponse', {
                    success: true,
                    devices: devicesWithStatus,
                });
            } catch (err) {
                console.error('Error fetching connected devices:', err);
                socket.emit('connectedDevicesResponse', {
                    success: false,
                    message: 'Error fetching connected devices from the database.',
                });
            }
        });

        socket.on('authorizeDevice', async (data) => {
            try {
                const { serial_id, socketId, location, latitude, longitude } = data;
    
                console.log("authorizeDevice llegó");
                console.log(serial_id, socketId, location, latitude, longitude);
    
                const poolRequest = pool.request();
    
                // Registrar el dispositivo en la base de datos
                await poolRequest
                    .input('serial', sql.NVarChar, serial_id)
                    .input('socketId', sql.NVarChar, socketId)
                    .input('location', sql.NVarChar, location)
                    .input('latitude', sql.Decimal(9, 6), latitude)
                    .input('longitude', sql.Decimal(9, 6), longitude)
                    .query(`
                        INSERT INTO Devices (serial, socketId, location, latitude, longitude)
                        VALUES (@serial, @socketId, @location, @latitude, @longitude)
                    `);

                console.log(`Device with serial_id: ${serial_id} authorized and registered.`);

                const result = await poolRequest
                        .input('serial_id', sql.NVarChar, serial_id)
                        .query(`SELECT id, serial AS serial_id, socketId, location, latitude, longitude
                             FROM Devices WHERE serial = @serial_id`);

                adminNamespace.emit('authorizationResponse', {
                    success: true,
                    device: result.recordset[0],
                    message: `Device with serial_id ${serial_id} has been authorized and registered.`,
                });

                adminNamespace.emit('deviceStatus', {
                    serial_id,
                    status: 'disconnected',
                    message: `Device with serial_id ${serial_id} has been authorized and connected.`,
                });
    
                // Notificar al cliente que ha sido autorizado
                const targetSocket = adminNamespace.sockets.get(socketId);
                if (targetSocket) {
                    targetSocket.emit('authorizationStatus', { authorized: true });
                } else {
                    console.warn(`Socket with ID ${socketId} not found in adminNamespace.`);
                }
            } catch (err) {
                console.error('Error authorizing device:', err);
            }
        });

        socket.on('sendCommand', async ({ socketId, command, data }) => {
            try {

                if (command !== 'scheduleMeasurement') {
                    const targetSocket = io.sockets.sockets.get(socketId);

                    if (targetSocket) {
                        targetSocket.emit('command', { command, data });
                        console.log(`Command "${command}" sent to socket ${socketId}`);
                    } else {
                        console.warn(`Socket with ID ${socketId} not found`);
                    }
                    return;
                }

                // Guardar programación en la tabla Schedules
                const poolRequest = pool.request();
                process.env.TZ = 'America/Bogota';
                
                await poolRequest
                    .input('uuid', sql.UniqueIdentifier, data.uuid)
                    .input('serial', sql.NVarChar, data.serial_id)
                    .input('socketId', sql.NVarChar, data.socketId)
                    .input('location', sql.NVarChar, data.location)
                    .input('latitude', sql.Decimal(9, 6), data.latitude)
                    .input('longitude', sql.Decimal(9, 6), data.longitude)
                    .input('band', sql.NVarChar, data.band)
                    .input('channel', sql.NVarChar, data.channel)
                    .input('measure', sql.NVarChar, data.measure)
                    .input('units', sql.NVarChar, data.units)
                    .input('fmin', sql.NVarChar, data.fmin)
                    .input('fmax', sql.NVarChar, data.fmax)
                    .input('start_time', sql.DateTime, data.startDate ? data.startDate : null)
                    .input('end_time', sql.DateTime, data.endDate ? data.endDate : null)
                    .input('status', sql.NVarChar, data.status || 'pending')
                    .query(`
                        INSERT INTO Schedules (uuid, serial, socketId, location, latitude, longitude, band, channel, measure, units, fmin, fmax, start_time, end_time, status)
                        VALUES (@uuid, @serial, @socketId, @location, @latitude, @longitude, @band, @channel, @measure, @units, @fmin, @fmax, @start_time, @end_time, @status)
                    `);

                console.log(`Schedule saved with UUID ${data.uuid} for device ${data.serial_id}.`);

                // Enviar el comando al dispositivo
                const targetSocket = io.sockets.sockets.get(data.socketId);

                if (targetSocket) {
                    targetSocket.emit('command', { command, data });
                    console.log(`Command "${command}" sent to socket ${data.socketId}`);
                } else {
                    console.warn(`Socket with ID ${data.socketId} not found`);
                }

                // Responder al administrador
                socket.emit('sendCommandResponse', {
                    success: true,
                    type: 'schedule',
                    message: `Schedule created and command sent to the device with UUID ${data.uuid}.`,
                });
            } catch (err) {
                console.error('Error handling sendCommand:', err);
                socket.emit('sendCommandResponse', {
                    success: false,
                    type: 'schedule',
                    message: 'Error creating schedule and sending command.',
                });
            }
        });

        socket.on('fetchRecords', async ({ serial_id, startDate, endDate, fmin, fmax, measure}) => {
            try {
                const poolRequest = pool.request();
                // Ajustar el rango de fechas para incluir todo el día
                // const adjustedStartDate = `${startDate} 00:00:00`;
                // const adjustedEndDate = `${endDate} 23:59:59`;

                console.log("fetchRecords llegó");
                console.log(serial_id, startDate, endDate);
        
                // Buscar el dispositivo por serial_id en la tabla Devices
                const deviceResult = await poolRequest
                    .input('serial_id', sql.NVarChar, serial_id)
                    .query(`SELECT id FROM Devices WHERE serial = @serial_id`);
                
                if (deviceResult.recordset.length === 0) {
                    // Si no se encuentra el dispositivo, notificar al cliente
                    socket.emit('fetchRecordsResponse', {
                        success: false,
                        message: `Device with serial_id ${serial_id} not found.`,
                    });
                    return;
                }
        
                const deviceId = deviceResult.recordset[0].id;

                console.log('Get registers from database')
        
                // Obtener registros históricos en el rango de fechas proporcionado
                process.env.TZ = 'America/Bogota';
                const recordsResult = await poolRequest
                    .input('deviceId', sql.Int, deviceId)
                    .input('startDate', sql.DateTime, startDate)
                    .input('endDate', sql.DateTime, endDate)
                    .input('fmin', sql.NVarChar, fmin)
                    .input('fmax', sql.NVarChar, fmax)
                    .input('measure', sql.NVarChar, measure)
                    .query(`
                        SELECT * 
                        FROM DataRecords 
                        WHERE serial_id = @deviceId 
                        AND datetime BETWEEN @startDate AND @endDate
                        AND fmin = @fmin
                        AND fmax = @fmax
                        AND measure = @measure
                        ORDER BY datetime ASC
                    `);
                
                // console.log(recordsResult);
        
                // Enviar los registros al cliente (admin)
                socket.emit('fetchRecordsResponse', {
                    success: true,
                    serial_id,
                    records: recordsResult.recordset,
                });
        
            } catch (err) {
                console.error('Error fetching records:', err);
                socket.emit('fetchRecordsResponse', {
                    success: false,
                    message: 'Error fetching records from the database.',
                });
            }
        });

        // Evento para borrar un dispositivo
        socket.on('deleteDevice', async (serial_id) => {
            try {
                const poolRequest = pool.request();
                
                // Buscar el dispositivo por serial_id
                const deviceResult = await poolRequest
                    .input('serial_id', sql.NVarChar, serial_id)
                    .query(`SELECT id FROM Devices WHERE serial = @serial_id`);

                    if (deviceResult.recordset.length === 0) {
                        socket.emit('deleteDeviceResponse', {
                            success: false,
                            message: `Device with serial_id ${serial_id} not found.`,
                        });
                        return;
                    }

                const deviceId = deviceResult.recordset[0].id;

                // Eliminar el dispositivo de la base de datos
                await poolRequest
                    .input('deviceId', sql.Int, deviceId)
                    .query(`DELETE FROM Devices WHERE id = @deviceId`);


                // Notificar al admin que el dispositivo ha sido eliminado
                adminNamespace.emit('deviceStatus', {
                    serial_id,
                    status: 'disconnected',
                    message: `Device with serial_id ${serial_id} has been deleted and disconnected.`,
                });

                adminNamespace.emit('deleteDeviceResponse', {
                    success: true,
                    serial_id,
                    message: `Device with serial_id ${serial_id} has been deleted.`,
                });

                socket.emit('deleteDeviceResponse', {
                    success: true,
                    serial_id,
                    message: `Device with serial_id ${serial_id} has been deleted.`,
                });
            } catch (err) {
                console.error('Error deleting device:', err);
                socket.emit('deleteDeviceResponse', {
                    success: false,
                    message: 'Error deleting device from the database.',
                });
            }
        });

        socket.on('fetchSchedules', async ({ limit }) => {
            try {
                const poolRequest = pool.request();

                if (!limit || typeof limit !== 'number' || limit <= 0) {
                    limit = 10; // Valor predeterminado si no se especifica el límite o es inválido
                }

                // Consultar programaciones agrupadas por UUID con datos relevantes
                const schedulesResult = await poolRequest
                    .input('limit', sql.Int, limit)
                    .query(`
                    WITH LatestStatus AS (
                        SELECT
                            uuid,
                            MAX(start_time) AS start_time,
                            MAX(end_time) AS end_time,
                            MAX(CASE
                                WHEN GETDATE() BETWEEN start_time AND end_time THEN 'in_progress'
                                WHEN GETDATE() > end_time THEN 'completed'
                                ELSE 'pending'
                            END) AS current_status,
                            COUNT(serial) AS device_count,
                            MIN(created_at) AS last_update
                        FROM Schedules
                        GROUP BY uuid
                    )
                    SELECT TOP (@limit) *
                    FROM LatestStatus
                    ORDER BY start_time DESC;
                `);

                // Emitir la respuesta al administrador
                socket.emit('fetchSchedulesResponse', {
                    success: true,
                    schedules: schedulesResult.recordset.map((schedule) => ({
                        uuid: schedule.uuid,
                        start_date: schedule.start_time,
                        end_date: schedule.end_time,
                        status: schedule.current_status,
                        device_count: schedule.device_count,
                        last_update: schedule.last_update,
                    })),
                });
            } catch (err) {
                console.error('Error fetching schedules:', err);
                socket.emit('fetchSchedulesResponse', {
                    success: false,
                    message: 'Error fetching schedules from the database.',
                });
            }
        });

        socket.on('fetchRecordsBySerial', async ({ serial, startDate, endDate }) => {
            try {
                if (!serial || !startDate || !endDate) {
                    socket.emit('fetchRecordsBySerialResponse', {
                        success: false,
                        message: 'Serial, startDate, and endDate are required.',
                    });
                    return;
                }

                const poolRequest = pool.request();

                // Ajustar las fechas para cubrir todo el rango (de inicio y fin del día)
                // const adjustedStartDate = `${startDate} 00:00:00`;
                // const adjustedEndDate = `${endDate} 23:59:59`;

                // Consultar registros asociados al dispositivo en el rango de fechas
                const recordsResult = await poolRequest
                    .input('serial', sql.NVarChar, serial)
                    .input('startDate', sql.DateTime, startDate)
                    .input('endDate', sql.DateTime, endDate)
                    .query(`
                        SELECT *
                        FROM DataRecords
                        WHERE serial = @serial
                          AND datetime BETWEEN @startDate AND @endDate
                        ORDER BY datetime DESC
                    `);

                if (recordsResult.recordset.length === 0) {
                    socket.emit('fetchRecordsBySerialResponse', {
                        success: true,
                        records: [],
                        message: `No records found for device with serial ${serial} in the specified date range.`,
                    });
                    return;
                }

                // Enviar los registros al administrador
                socket.emit('fetchRecordsBySerialResponse', {
                    success: true,
                    serial,
                    records: recordsResult.recordset,
                });
            } catch (err) {
                console.error('Error fetching records by serial:', err);
                socket.emit('fetchRecordsBySerialResponse', {
                    success: false,
                    message: 'Error fetching records from the database.',
                });
            }
        });

        socket.on('fetchSchedulesBySerial', async ({ serial }) => {
            try {
                if (!serial) {
                    socket.emit('fetchSchedulesBySerialResponse', {
                        success: false,
                        message: 'Serial is required.',
                    });
                    return;
                }

                const poolRequest = pool.request();

                // Consultar todas las programaciones asociadas al dispositivo
                const schedulesResult = await poolRequest
                    .input('serial', sql.NVarChar, serial)
                    .query(`
                        SELECT *
                        FROM Schedules
                        WHERE serial = @serial
                        ORDER BY created_at DESC
                    `);

                if (schedulesResult.recordset.length === 0) {
                    socket.emit('fetchSchedulesBySerialResponse', {
                        success: true,
                        schedules: [],
                        message: `No schedules found for device with serial ${serial}.`,
                    });
                    return;
                }

                // Enviar las programaciones al administrador
                socket.emit('fetchSchedulesBySerialResponse', {
                    success: true,
                    schedules: schedulesResult.recordset,
                });
            } catch (err) {
                console.error('Error fetching schedules by serial:', err);
                socket.emit('fetchSchedulesBySerialResponse', {
                    success: false,
                    message: 'Error fetching schedules from the database.',
                });
            }
        });

        socket.on('fetchDevicesByScheduleUUID', async ({ uuid }) => {
            try {
                if (!uuid) {
                    socket.emit('fetchDevicesByScheduleUUIDResponse', {
                        success: false,
                        message: 'UUID is required.',
                    });
                    return;
                }

                const poolRequest = pool.request();

                // Consultar los dispositivos asociados a la programación específica
                const devicesResult = await poolRequest
                    .input('uuid', sql.UniqueIdentifier, uuid)
                    .query(`
                        SELECT serial AS serial_id, socketId, location, latitude, longitude, band, channel, measure, units, fmin, fmax, start_time AS startDate, end_time AS endDate, status
                        FROM Schedules
                        WHERE uuid = @uuid
                    `);

                if (devicesResult.recordset.length === 0) {
                    socket.emit('fetchDevicesByScheduleUUIDResponse', {
                        success: true,
                        devices: [],
                        message: `No devices found for schedule with UUID ${uuid}.`,
                    });
                    return;
                }

                // Enviar la lista de dispositivos y configuraciones al cliente
                socket.emit('fetchDevicesByScheduleUUIDResponse', {
                    success: true,
                    devices: devicesResult.recordset,
                });
            } catch (err) {
                console.error('Error fetching devices by schedule UUID:', err);
                socket.emit('fetchDevicesByScheduleUUIDResponse', {
                    success: false,
                    message: 'Error fetching devices from the database.',
                });
            }
        });

        socket.on('fetchRegisteredDevices', async () => {
            try {
                const poolRequest = pool.request();

                // Consultar los dispositivos registrados
                const devicesResult = await poolRequest.query(
                    `SELECT id, serial_id, location, latitude, longitude FROM Devices`
                );
    
                socket.emit('registeredDevicesResponse', {
                    success: true,
                    devices: devicesResult.recordset,
                });
            } catch (err) {
                console.error('Error fetching registered devices:', err);
                socket.emit('registeredDevicesResponse', {
                    success: false,
                    message: 'Error fetching registered devices from the database.',
                });
            }
        });

        socket.on('fetchDeviceStatus', async (serial) => {
            try {
                if (!serial) {
                    socket.emit('fetchDeviceStatusResponse', {
                        success: false,
                        message: 'Serial is required.',
                    });
                    return;
                }
    
                const poolRequest = pool.request();
    
                // Buscar el dispositivo por serial en la base de datos
                const deviceResult = await poolRequest
                    .input('serial', sql.NVarChar, serial)
                    .query(`SELECT socketId FROM Devices WHERE serial = @serial`);
    
                if (deviceResult.recordset.length === 0) {
                    socket.emit('fetchDeviceStatusResponse', {
                        success: true,
                        serial,
                        status: 'not_found',
                    });
                    return;
                }
    
                const device = deviceResult.recordset[0];
    
                // Determinar el estado de conexión basado en el socketId
                const isConnected = [...io.sockets.sockets.values()].some((clientSocket) => clientSocket.id === device.socketId);
    
                // Emitir solo el estado al administrador
                socket.emit('fetchDeviceStatusResponse', {
                    success: true,
                    serial,
                    status: isConnected ? 'connected' : 'disconnected',
                });
            } catch (err) {
                console.error('Error fetching device status:', err);
                socket.emit('fetchDeviceStatusResponse', {
                    success: false,
                    message: 'Error fetching device status from the database.',
                });
            }
        });

        socket.on('deleteSchedule', async (uuid) => {
            try {
                if (!uuid) {
                    socket.emit('deleteScheduleResponse', {
                        success: false,
                        message: 'UUID is required.',
                    });
                    return;
                }
        
                const devicesRequest = pool.request();
        
                // Consultar los dispositivos asociados a la programación
                const devicesResult = await devicesRequest
                    .input('uuid', sql.UniqueIdentifier, uuid)
                    .query(`
                        SELECT DISTINCT serial
                        FROM Schedules
                        WHERE uuid = @uuid
                    `);
        
                if (devicesResult.recordset.length === 0) {
                    socket.emit('deleteScheduleResponse', {
                        success: false,
                        message: `No devices found for schedule with UUID ${uuid}.`,
                    });
                    return;
                }
        
                // Obtener la lista de seriales de dispositivos asociados
                const devices = devicesResult.recordset;
        
                // Eliminar la programación de la base de datos
                const deleteRequest = pool.request();
                await deleteRequest
                    .input('uuid', sql.UniqueIdentifier, uuid)
                    .query(`
                        DELETE FROM Schedules WHERE uuid = @uuid
                    `);
        
                console.log(`Schedule with UUID ${uuid} deleted from the database.`);
        
                // Iterar sobre cada dispositivo para obtener su socketId actualizado y notificar
                for (const { serial } of devices) {
                    const deviceRequest = pool.request();
                    const deviceResult = await deviceRequest
                        .input('serial', sql.NVarChar, serial)
                        .query(`
                            SELECT socketId FROM Devices WHERE serial = @serial
                        `);
        
                    if (deviceResult.recordset.length === 0) {
                        console.warn(`Device with serial ${serial} not found in Devices table.`);
                        continue;
                    }
        
                    const { socketId } = deviceResult.recordset[0];
        
                    // Verificar si el socket está conectado
                    const targetSocket = io.sockets.sockets.get(socketId);
                    if (targetSocket) {
                        targetSocket.emit('deleteSchedule', { uuid });
                        console.log(`Delete schedule message sent to device with serial: ${serial}`);
                    } else {
                        console.warn(`Socket with ID ${socketId} for device ${serial} is not currently connected.`);
                    }
                }
        
                // Responder al administrador
                socket.emit('deleteScheduleResponse', {
                    success: true,
                    uuid,
                    message: `Schedule with UUID ${uuid} has been deleted and devices notified.`,
                });
            } catch (err) {
                console.error('Error deleting schedule:', err);
                socket.emit('deleteScheduleResponse', {
                    success: false,
                    message: 'Error deleting schedule from the database.',
                });
            }
        });
    });



    server.listen(process.env.PORT, (err) => {
        if (err) throw err;
        console.log('Server running on http://localhost:3000');
    });
});