import styles from './RmtdtOption.module.css';
import Select from '@/components/select/Select';
import { useContext } from 'react';
import { MainContext } from '@/context/MainContext';
import MainPicker from '@/components/mainPicker/MainPicker';

const RmtdtOption = ({item, option, onChange = null}) => {

    const { inputController, setInputController } = useContext(MainContext);
    const options = Object.keys(inputController.services.RMTDT);

    const formatBand = (items) => {
        const freqs = items ? items.map(item => {
            return `Canal ${item.channel} : ${item.fmin} - ${item.fmax} ${item.units}`
        }): [];
        return freqs;
    }

    // console.log('rmtdt',inputController.services.RMTDT)

    return (
        <div className={styles.mainContainer}>
            <div className={styles.optionContainer}>
                <p>Banda y servicio</p>
                <div className={styles.buttonContainer}>
                    <div className={styles.selectContainer}>
                        <Select id={item.id} options={formatBand(inputController.services.RMTDT)} value={item.fmax ? `Canal ${item.channel} : ${item.fmin} - ${item.fmax} ${item.units}` : "Canal"} onChange={onChange} type='channel'/>
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

export default RmtdtOption;