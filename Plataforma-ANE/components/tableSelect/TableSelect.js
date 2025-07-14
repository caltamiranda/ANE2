'use client';

import styles from './TableSelect.module.css';
import Box from '@/assets/icon/box.svg';
import Checkbox from '@/assets/icon/checkbox.svg';
import Edit from '@/assets/icon/edit.svg';
import { useSearchParams } from 'next/navigation';

const TableSelect = ({data, onLeftClickMain, onLeftClick, selectedItems, onRightClick}) => {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || '';
    // const query = '';

    const filteredData = {
        ...data,
        rows: data?.rows?.filter(item =>
            item?.email?.toLowerCase().includes(query.toLowerCase()) ||
            item?.name?.toLowerCase().includes(query.toLowerCase()) ||
            item?.rol?.toLowerCase().includes(query.toLowerCase())
        ),
    };
    return (
        <div className={styles.mainContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th className={styles.iconCell}>
                            <div className={styles.icon} onClick={onLeftClickMain}>
                                {
                                    selectedItems.length !== 0 ? 
                                    <Checkbox width={20} height={20} /> : 
                                    <Box width={20} height={20} />
                                }
                                {/* <Checkbox width={20} height={20} /> */}
                            </div>
                        </th>
                        {filteredData?.column_names?.map((column) => (
                            <th className={styles.cell} key={column.id}>{column.name}</th>
                        ))}
                        <th className={styles.iconCellEnd}>
                            <div className={styles.icon}>
                                {/* <Edit width={20} height={20} /> */}
                            </div>
                        </th>
                    </tr>
                </thead>
            </table>
            <div className={styles.scrollableBody}>
                <table className={styles.table}>
                    <tbody className={styles.tableBody}>
                        {filteredData?.rows?.map((row, index) => (
                            <tr key={index}>
                                <td className={styles.iconCell}>
                                    <div className={styles.icon} onClick={()=>{onLeftClick(row.id)}}>
                                        {
                                            selectedItems.some(item => item.id === row.id) ? 
                                            <Checkbox width={20} height={20} /> : 
                                            <Box width={20} height={20} />
                                        }
                                        {/* <Box width={20} height={20} /> */}
                                    </div>
                                </td>
                                {filteredData?.column_names?.map((column) => (
                                    <td className={styles.cell} key={column.id}>{row[column.id]}</td>
                                ))}
                                <td className={styles.iconCellEnd}>
                                    <div className={styles.editContainer}>
                                        <div className={styles.icon} onClick={()=>{onRightClick(row)}}>
                                            <Edit width={20} height={20} />
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableSelect;