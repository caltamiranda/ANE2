'use client';

import styles from './RegularTable.module.css';
// import Box from '@/assets/icon/box.svg';
// import Checkbox from '@/assets/icon/checkbox.svg';
// import Edit from '@/assets/icon/edit.svg';
import { useSearchParams } from 'next/navigation';

const RegularTable = ({data}) => {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || '';
    // const query = '';

    const filteredData = {
        ...data,
        rows: data?.rows?.filter(item =>
            item?.type?.toLowerCase().includes(query.toLowerCase()) ||
            item?.service?.toLowerCase().includes(query.toLowerCase()) ||
            item?.notation?.toLowerCase().includes(query.toLowerCase()) ||
            item?.channel?.toString().toLowerCase().includes(query.toLowerCase()) ||
            item?.fmin?.toString().toLowerCase().includes(query.toLowerCase()) ||
            item?.fmax?.toString().toLowerCase().includes(query.toLowerCase()) ||
            item?.units?.toLowerCase().includes(query.toLowerCase())
        ),
    };

    return (
        <div className={styles.mainContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {filteredData?.column_names?.map((column) => (
                            <th className={styles.cell} key={column.id}>{column.name}</th>
                        ))}
                    </tr>
                </thead>
            </table>
            <div className={styles.scrollableBody}>
                <table className={styles.table}>
                    <tbody className={styles.tableBody}>
                        {filteredData?.rows?.map((row, index) => (
                            <tr key={index}>
                                {filteredData?.column_names?.map((column) => (
                                    <td className={styles.cell} key={column.id}>{row[column.id]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RegularTable;