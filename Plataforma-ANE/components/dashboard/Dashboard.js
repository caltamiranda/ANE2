'use client'

import styles from './Dashboard.module.css';
import Image from 'next/image';
import Logout from '@/assets/icon/logout.svg';
import {signOutAction} from "@/app/actions/auth"
import { useContext, useEffect, useState } from 'react';
import { MainContext } from '@/context/MainContext';
import MenuButton from '@/components/menuButton/MenuButton';
import { useSession } from "next-auth/react"
import Home from '@/assets/icon/home.svg';
import Sensing from '@/assets/icon/sensing.svg';
import Devices from '@/assets/icon/devices.svg';
import User from '@/assets/icon/user.svg';
import Alert from '@/assets/icon/alert.svg';
import Globe from '@/assets/icon/globe.svg';
import Help from '@/assets/icon/help.svg';
import Message from '@/assets/icon/message.svg';
import Link from 'next/link';

const Dashboard = ({children}) => {
    const { data: session } = useSession()
    const { inputController, setInputController } = useContext(MainContext);

    return (
        <div className={styles.mainContainer}>
            <section className={styles.menu}>
                {/* <div className={styles.menuInside}> */}
                    <div className={styles.logoContainer}>
                        <Image src="/logoAne.png" alt="Logo" width={48} height={59} />
                        <div className={styles.title}>
                            <h1>Sensado<br/>
                                Espectral
                            </h1>
                        </div>
                    </div>

                    <div className={styles.menuContainer}>
                        <Link href="/platform" style={{textDecoration:'none'}}>
                            <MenuButton className={inputController.menu==='home' && styles.selectedButton} text='Inicio' icon={<Home width={20} height={20} />} onClick={()=>{setInputController({...inputController,menu:'home'})}} />
                        </Link>
                        <div className={styles.blockMenu}>
                            <p className={styles.blockTitle}>
                                Sensado
                            </p>
                            <MenuButton className={styles.buttonDisabled} text='Monitoreo' icon={<Sensing width={20} height={20} />} disabled={true} />
                            <Link href="/platform/monitoring/rmer" style={{textDecoration:'none'}}>
                                <MenuButton className={`${inputController.menu==='rmer' && styles.selectedButton} ${styles.mainButton}`} text='RMER' onClick={()=>{setInputController({...inputController,menu:'rmer'})}} />
                            </Link>
                            <Link href="/platform/monitoring/rmtdt" style={{textDecoration:'none'}}>
                                <MenuButton className={`${inputController.menu==='rmtdt' && styles.selectedButton} ${styles.mainButton}`} text='RMTDT' onClick={()=>{setInputController({...inputController,menu:'rmtdt'})}} />
                            </Link>
                            <Link href="/platform/monitoring/rni" style={{textDecoration:'none'}}>
                                <MenuButton className={`${inputController.menu==='rni' && styles.selectedButton} ${styles.mainButton}`} text='RNI' onClick={()=>{setInputController({...inputController,menu:'rni'})}} />
                            </Link>
                            <Link href="/platform/devices" style={{textDecoration:'none'}}>
                                <MenuButton className={inputController.menu==='devices' && styles.selectedButton} text='Dispositivos' icon={<Devices width={20} height={20} />} onClick={()=>{setInputController({...inputController,menu:'devices'})}} />
                            </Link>
                        </div>
                        <div className={styles.blockMenu}>
                            <p className={styles.blockTitle}>
                                Administración
                            </p>
                            { inputController.role === 'admin' &&
                                <Link href="/platform/users" style={{textDecoration:'none'}}>
                                    <MenuButton className={inputController.menu==='users' && styles.selectedButton} text='Usuarios' icon={<User width={20} height={20} />} onClick={()=>{setInputController({...inputController,menu:'users'})}} />
                                </Link> 
                            }
                            <Link href="/platform/services" style={{textDecoration:'none'}}>
                                <MenuButton className={inputController.menu==='services' && styles.selectedButton} text='Servicios' icon={<Globe width={20} height={20} />} onClick={()=>{setInputController({...inputController,menu:'services'})}} />
                            </Link>
                            {/* <Link href="/platform/failures" style={{textDecoration:'none'}}>
                                <MenuButton className={inputController.menu==='failures' && styles.selectedButton} text='Fallas' icon={<Alert width={20} height={20} />} onClick={()=>{setInputController({...inputController,menu:'failures'})}} />
                            </Link> */}
                            <Link href="/platform/support" style={{textDecoration:'none'}}>
                                <MenuButton className={inputController.menu==='support' && styles.selectedButton} text='Soporte' icon={<Message width={20} height={20} />} onClick={()=>{setInputController({...inputController,menu:'support'})}} />
                            </Link>
                        </div>
                    </div>
                {/* </div> */}

                <div className={styles.footerContainer}>
                    <a href="/Manual_ASP_ANE.pdf" download="Manual_ASP_ANE.pdf" style={{textDecoration:'none'}}>
                        <MenuButton text='Ayuda' icon={<Help width={20} height={20} />} onClick={()=>{setInputController({...inputController,menu:'help'})}} />
                    </a>
                    <div className={styles.infoContainer}>
                        <div className={styles.circle} title={session?.user?.name}>
                            {session?.user?.name?.charAt(0) || session?.user?.email.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userInfo}>
                            <p title={session?.user?.name}>
                                {session?.user?.name}
                            </p>
                            <p title={session?.user?.email}>
                                {session?.user?.email}
                            </p>
                        </div>
                        <form className={styles.form} action={signOutAction}>
                            <button className={styles.outButton}>
                                <Logout width={20} height={20} className={styles.icon}/>
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            <main className={styles.main}>
                <div className={styles.content}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;