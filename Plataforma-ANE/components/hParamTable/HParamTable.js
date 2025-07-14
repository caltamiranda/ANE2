import styles from './HParamTable.module.css';

const HParamTable = ({data}) => {
    const keys = Object.keys(data[0]);
    return (
        <div className={styles.mainContainer}>
            {/* {(keys.length!==0 || keys[0]!=='0') && */}
                <table className={styles.table}>
                    <tbody>
                        {keys.map((key, index) => (
                            <tr key={index}>
                                <td className={styles.firstColumn}>
                                    {key}
                                </td>
                                {data.map((item, subIndex) => (
                                    <td key={subIndex}>{item[key]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            {/* } */}
        </div>
    );
};

export default HParamTable;