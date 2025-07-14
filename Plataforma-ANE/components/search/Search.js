'use client';

import styles from './Search.module.css';
import SearchIcon from '@/assets/icon/search.svg';
import Close from '@/assets/icon/close.svg';
import { useRef } from 'react';
import { useSearchParams , usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

const Search = ({placeholder,className}) => {
    const inputRef = useRef(null);
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term) => {
        // console.log(`Searching... ${term}`);
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('query', term);
        } else {
            params.delete('query');
        }
        replace(`${pathname}?${params.toString()}`);
    },300)

    const handleContainerClick = () => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleClear = () => {
        const params = new URLSearchParams(searchParams);
        params.delete('query');
        replace(`${pathname}?${params.toString()}`);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }

    return (
        <div className={`${className} ${styles.searchContainer}`} onClick={handleContainerClick}>
            <label className={styles.icon} htmlFor="search">
                <SearchIcon width={20} height={20} />
            </label>
            <input 
                id="search"
                ref={inputRef}
                placeholder={placeholder}
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('query')?.toString()}
            />
            {searchParams.get('query') &&
                <Close width={20} height={20} className={styles.close} onClick={handleClear}/>
            }
        </div>
    );
};

export default Search;