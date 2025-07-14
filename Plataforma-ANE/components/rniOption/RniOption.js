import styles from './RniOption.module.css';
import Select from '@/components/select/Select';
import { useContext } from 'react';
import { MainContext } from '@/context/MainContext';
import MainPicker from '@/components/mainPicker/MainPicker';

const RniOption = ({item, option, onChange = null}) => {

    const { inputController, setInputController } = useContext(MainContext);
    const options = Object.keys(inputController.services.RNI);

    // console.log('rni',inputController.services.RNI)

    const formatBand = (items) => {
        const freqs = items ? items.map(item => {
            return `${item.fmin} - ${item.fmax} ${item.units}`
        }): [];
        return freqs;
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.optionContainer}>
                <p>Banda y servicio</p>
                <div className={styles.buttonContainer}>
                    <div className={styles.selectContainer}>
                        <Select id={item.id} options={options} value={item.band || "Banda"} onChange={onChange} type='band'/>
                    </div>
                    <div className={styles.selectContainer}>
                        <Select id={item.id} options={formatBand(inputController.services.RNI[item.band])} value={item.fmax ? `${item.fmin} - ${item.fmax} ${item.units}` : "Frecuencia"} onChange={onChange} type='freqs'/>
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

export default RniOption;