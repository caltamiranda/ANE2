'use client';

import styles from './SearchBlock.module.css';
import Search from '@/components/search/Search';
import Accordion from '@/components/accordion/Accordion';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const SearchBlock = ({items, icon, onIconClick, activeName, inactiveName, activeState, button=true, buttonText, iconRight, onClickRight, iconLeft, onClickLeft, onClickButton, onClickAddButton, onClickLeaveButton, iconRightButton=null,  onClickRightButton=null, clickable=false, onClick=null, cardType=null}) => {
    const searchParams = useSearchParams();
    const query = searchParams.get('query') || '';
    const initialItems = inactiveName ? { active: {title:activeName, content:[]}, inactive: {title:inactiveName, content:[]} } : { active: {title:activeName, content:[]} };
    
    // const filteredItems = items.filter(item =>
    //     item.serial_id?.toLowerCase().includes(query.toLowerCase()) ||
    //     item.id?.toString().includes(query)
    // );
    const filteredItems = items.filter(item =>
        item.serial_id?.toLowerCase().includes(query.toLowerCase()) ||
        item.id?.toString().includes(query) ||
        item.uuid?.toLowerCase().includes(query.toLowerCase()) ||
        item.socketId?.toLowerCase().includes(query.toLowerCase()) || 
        item.message?.toLowerCase().includes(query.toLowerCase())
    );

    const accItems = filteredItems.reduce((acc, item) => {
        if (item.status === activeState) {
            acc.active.content.push(item);
        } else {
            if (inactiveName) {
                acc.inactive.content.push(item);
            }
        }
        return acc;
    }, initialItems );
    
    return (
        <div className={styles.mainContainer}>
            <div className={styles.barContainer}>
                {iconLeft &&
                    <button className={styles.iconContainer} onClick={onClickLeft}>
                        {iconLeft}
                    </button>
                }
                <Suspense fallback={<div>Loading...</div>}>
                    <Search className={styles.searchBar} placeholder="Buscar" />
                </Suspense>
                {iconRight &&
                    <button className={styles.iconContainer} onClick={onClickRight}>
                        {iconRight}
                    </button>
                }
            </div>
            <div className={styles.acordionContent}>
                <div className={styles.accordionInside}>
                    <Accordion items={accItems} icon={icon} onIconClick={onIconClick} clickable={clickable} onClick={onClick} onClickAddButton={onClickAddButton} onClickLeaveButton={onClickLeaveButton} cardType={cardType} />
                </div>
            </div>
            {button &&
                <div className={styles.buttonContainer}>
                    <button className={`${styles.callToAction} buttonPrimary `} onClick={onClickButton}>
                        {buttonText}
                    </button>
                    {iconRightButton &&
                        <button className={styles.iconContainer} onClick={onClickRightButton}>
                            {iconRightButton}
                        </button>
                    }
                </div>
            }
        </div>
    );
};

export default SearchBlock;