import styles from './RmerOption.module.css';
import Select from '@/components/select/Select';
import { useContext } from 'react';
import { MainContext } from '@/context/MainContext';
import MainPicker from '@/components/mainPicker/MainPicker';

const RmerOption = ({item, option, onChange = null}) => {

    const { inputController, setInputController } = useContext(MainContext);
    const options = Object.keys(inputController.services.RMER);

    const formatBand = (items) => {
        const freqs = items ? items.map(item => {
            return `${item.fmin} - ${item.fmax} ${item.units}`
        }): [];
        return freqs;
    }

    // console.log(inputController.services.RMER[item.band] ? formatBand(inputController.services.RMER[item.band])[0] : "Frecuencia");
    // console.log(options);

    return (
        <div className={styles.mainContainer}>
            <div className={styles.optionContainer}>
                <p>Banda y servicio</p>
                <div className={styles.buttonContainer}>
                    <div className={styles.selectContainer}>
                        <Select id={item.id} options={options} value={item.band || "Banda"} onChange={onChange} type='band'/>
                    </div>
                    <div className={styles.selectContainer}>
                        <Select id={item.id} options={formatBand(inputController.services.RMER[item.band])} value={item.fmax ? `${item.fmin} - ${item.fmax} ${item.units}` : "Frecuencia"} onChange={onChange} type='freqs'/>
                    </div>
                </div>
            </div>
            {
                option === 'programado' &&
                <div className={styles.optionContainer}>
                    <p>Duración</p>
                    <div className={styles.buttonContainer}>
                        <div className={styles.selectContainer}>
                            <MainPicker placeholder={'Fecha inicial'} id={item.id} onChange={onChange} type='startDate' />
                        </div>
                        <div className={styles.selectContainer}>
                            <MainPicker placeholder={'Fecha final'} id={item.id} onChange={onChange} type='endDate' minDate={item.startDate} disabled={item.startDate===null}/>
                        </div>
                    </div>
                </div>
            }
        </div>
    );
};

export default RmerOption;