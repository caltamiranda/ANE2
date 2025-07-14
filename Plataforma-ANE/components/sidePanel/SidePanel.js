'use client';

import styles from './SidePanel.module.css';
import Select from 'react-select'
import { useState, useEffect } from 'react';

const SidePanel = ({initialValues, onClick}) => {

    const [inputValue, setInputValue] = useState('');
    const [inputRole, setInputRole] = useState('');
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    useEffect(() => {
        setSelectedOptions(initialValues ? initialValues?.users: []);
        setRoles(initialValues ? initialValues?.roles: []);
    }, [initialValues]);

    useEffect(() => {
        setIsClient(true); // Indica que el cliente ha cargado

        const fetchOptUsers = async () => {
            try {
                const response = await fetch('/api/opt-users'); // Asegúrate de que la ruta sea correcta
                if (!response.ok) {
                    throw new Error('Error fetching users');
                }
                const data = await response.json();
                setUsers(data.data); // Asumiendo que los datos están en la propiedad 'data'
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchOptUsers();

    }, []);

    const options = [
        { value: 'admin', label: 'Admin' },
        { value: 'consulta', label: 'Consulta' }
      ];

      const filterOption = (option, inputValue) => {
        return inputValue && option.label.toLowerCase().includes(inputValue.toLowerCase());
    };

    const noOptionsMessage = () => {
        return inputValue ? 'Sin resultados' : null;
    };

    const handleChange = (selectedOptions) => {
        setSelectedOptions(selectedOptions);
        setInputValue(selectedOptions ? selectedOptions.map(option => option.label).join(', ') : '');
    };

    const handleChangeRole = (selectedOptions) => {
        setRoles(selectedOptions);
        setInputRole(selectedOptions ? selectedOptions.map(option => option.label).join(', ') : '');
    };

    const customComponents = {
        DropdownIndicator: () => null,
        IndicatorSeparator: () => null,
    };

    const customStyles = {
        control: (provided) => ({
            ...provided,
            with: '100%',
            fontSize: '14px',
            padding: '6px 12px',
            marginTop: '12px',
            marginBottom: '24px',
            border: '1px solid #ccc',
            boxShadow: 'none',
            '&:hover': {
                border: '1px solid #aaa',
            },
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: '#f9f9f9',
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isFocused ? '#e6e6e6' : state.isSelected ? '#d4d4d4' : '#fff',
            '&:hover': {
                backgroundColor: '#e6e6e6',
            },
        }),
        multiValue: (provided) => ({
            ...provided,
            backgroundColor: '#e6e6e6',
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: '#333',
        }),
        multiValueRemove: (provided) => ({
            ...provided,
            color: '#666',
            '&:hover': {
                backgroundColor: '#ccc',
                color: '#333',
            },
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#999', // Cambia el color del placeholder
        }),
    };

    const handleSubmit = async () => {
    
        const users = selectedOptions.map(option => ({
            id: option.id,
            role: roles[0].value,
        }));

        console.log('users',users);
    
        try {
            const res = await fetch('/api/iam', {
                method: 'PUT',
                // headers: {
                //     'Content-Type': 'application/json',
                // },
                body: JSON.stringify(users),
            });
    
            const data = await res.json();
            console.log(data);
            onClick(false)
        } catch (error) {
            console.error('Error updating user roles:', error);
        }
    };

    // console.log(selectedOptions, roles);

    return (
        <div className={styles.panelContainer}>
            <div className={styles.panel}>
                <div className={styles.title}>
                    <p>
                        Agregar permisos
                    </p>
                </div>

                <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
                    {isClient && (
                        <div>
                            <label className={styles.labelInput} htmlFor="userSelect">Agregar usuarios</label>
                            <Select
                                value={selectedOptions}
                                options={users}
                                isMulti
                                instanceId="userSelect"
                                onInputChange={(value) => setInputValue(value)}
                                filterOption={filterOption}
                                noOptionsMessage={noOptionsMessage}
                                onChange={handleChange}
                                autoComplete="off"
                                components={customComponents}
                                styles={customStyles}
                                placeholder="Escribe los correos electrónicos"
                            />

                            <label className={styles.labelInput} htmlFor="roleSelect">Agregar roles</label>
                            <Select
                                value={roles}
                                options={options}
                                isMulti
                                instanceId="roleSelect"
                                onInputChange={(value) => setInputRole(value)}
                                filterOption={filterOption}
                                noOptionsMessage={noOptionsMessage}
                                onChange={handleChangeRole}
                                autoComplete="off"
                                components={customComponents}
                                styles={customStyles}
                                placeholder="Selecciona un rol"
                            />
                        </div>
                    )}
                </form>

                <div className={styles.buttonContainer}>
                    <button className={`buttonPrimary ${styles.button}`} onClick={()=>{handleSubmit()}} disabled={selectedOptions?.length===0 && roles?.length===0 }>
                        <p>
                            Guardar
                        </p>
                    </button>
                    <button className={`buttonPrimary ${styles.buttonSecondary}`} onClick={()=>{onClick(false)}}>
                        <p>
                            Cancelar
                        </p>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default SidePanel;