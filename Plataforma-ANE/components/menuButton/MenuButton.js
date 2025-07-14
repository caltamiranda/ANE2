import styles from './MenuButton.module.css';

const MenuButton = ({text, icon, className, onClick, disabled}) => {
    return (
        <button className={`${styles.mainContainer} ${className}`} onClick={onClick} disabled={disabled}>
            { icon &&
                <div className={styles.iconContainer}>
                    {icon}
                </div>
            }
            <p>
                {text}
            </p>
        </button>
    );
};

export default MenuButton;