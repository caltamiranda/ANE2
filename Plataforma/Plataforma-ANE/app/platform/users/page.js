'use client';

import styles from './page.module.css';
import Dashboard from "@/components/dashboard/Dashboard";
import { Suspense } from 'react';
import Search from '@/components/search/Search';
import Plus from '@/assets/icon/plus.svg';
import Userminus from '@/assets/icon/userminus.svg';
import TableSelect from '@/components/tableSelect/TableSelect';
import { useContext, useState, useEffect } from 'react';
import SidePanel from '@/components/sidePanel/SidePanel';
import { MainContext } from '@/context/MainContext';

const dataInitial = {
    column_names:[
        {
            id: 'email',
            name: 'Correo electrónico',
        },
        {
            id: 'name',
            name: 'Nombre',
        },
        {
            id: 'rol',
            name: 'Rol',
        },
    ],
    rows: [
        {
            id: 1,
            email: 'usuario@ane.gov.co',
            name: 'Usuario',
            rol: 'Administrador',
        },
        {
            id: 2,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Administrador funcional',
        },
        {
            id: 3,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Gestor operativo',
        },
        {
            id: 4,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Consulta',
        },
        {
            id: 5,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Auditoría',
        },
        {
            id: 6,
            email: 'usuario@ane.gov.co',
            name: 'Usuario',
            rol: 'Administrador',
        },
        {
            id: 7,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Administrador funcional',
        },
        {
            id: 8,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Gestor operativo',
        },
        {
            id: 9,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Consulta',
        },
        {
            id: 10,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Auditoría',
        },
        {
            id: 11,
            email: 'usuario@ane.gov.co',
            name: 'Usuario',
            rol: 'Administrador',
        },
        {
            id: 12,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Administrador funcional',
        },
        {
            id: 13,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Gestor operativo',
        },
        {
            id: 14,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Consulta',
        },
        {
            id: 15,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Auditoría',
        }
        ,
        {
            id: 16,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Auditoría 100',
        },
        {
            id: 17,
            email: 'Julian@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Auditoría 100',
        },
        {
            id: 18,
            email: 'usuario@ane.gov.co',
            name: 'Nombre Usuario',
            rol: 'Auditoría 120',
        }
    ]
}

const Users = () => {
    const [openPanel, setOpenPanel] = useState(false);
    const [data, setData] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [initialValues, setInitialValues] = useState([]);
    const { inputController, setInputController } = useContext(MainContext);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users'); // Asegúrate de que la ruta sea correcta
                if (!response.ok) {
                    throw new Error('Error fetching users');
                }
                const data = await response.json();
                setData(data.data); // Asumiendo que los datos están en la propiedad 'data'
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);


    const selectItem = (id) => {
        if (selectedItems.find(item => item.id === id)) {
            setSelectedItems(selectedItems.filter(item => item.id !== id));
        } else {
            const item = data.rows.find(item => item.id === id);
            setSelectedItems([...selectedItems, item]);
        }
    }

    const selectAllItems = () => {
        if (selectedItems.length !== 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems(data.rows);
        }
    }

    const deleteItems = () => {
        const newData = data.rows.filter(item => !selectedItems.some(selectedItem => selectedItem.id === item.id));
        setData({
            ...data,
            rows: newData,
        });
        setSelectedItems([]);
    }

    const editItem = (item) => {
        setOpenPanel(true);
        // console.log('item:',item);
        setInitialValues({
            users:[{
                value: item.email,
                label: item.email,
                id: item.id,
                name: item.name,
            }],
            roles: [
                { value: item.role, label: item.role }
            ]
        });
    }

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/users/${selectedItems[0].id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await res.json();
            deleteItems();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    return (
        <Dashboard>
            {inputController.role === 'admin' ?
                <div className={styles.mainContainer}>
                    <h1 className={styles.title}>Usuarios</h1>
                    <div className={styles.buttonContent}>
                        <button className={`buttonPrimary ${styles.button}`} onClick={()=>{setOpenPanel(true)}}>
                            <Plus width={20} height={20} />
                            <p>
                                Agregar permisos
                            </p>
                        </button>
                        <button className={`buttonPrimary ${styles.buttonSecondary}`} onClick={handleDelete} disabled={selectedItems?.length===0}>
                            <Userminus width={20} height={20} />
                            <p>
                                Eliminar permisos
                            </p>
                        </button>
                    </div>
                    <Suspense fallback={<div>Loading...</div>}>
                        <Search className={styles.searchBar} placeholder="Buscar" />
                    </Suspense>
                    <Suspense fallback={<div>Loading...</div>}>
                        {data && 
                            <div className={styles.tableContainer}>
                                <TableSelect data={data} onLeftClickMain={selectAllItems} onLeftClick={selectItem} selectedItems={selectedItems} onRightClick={editItem} />
                            </div>
                        }
                    </Suspense>
                </div>
                :
                <div className={styles.block}>
                    <h1>No tienes permisos para ver esta página</h1>
                </div>
            }
                {openPanel && 
                    <SidePanel initialValues={initialValues} onClick={setOpenPanel} />
                }
        </Dashboard>
    );
};

export default Users;