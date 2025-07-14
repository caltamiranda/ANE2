'use client';

import { signInWithCredentials } from "@/app/actions/auth"
import styles from  "./page.module.css"
import Image from "next/image"
import logoGovco from "@/public/header_govco.png"
import logo from "@/public/logoAne.png"
import Link from "next/link"
import { useState } from "react";

export default function SignIn() {
    const [showPassword, setShowPassword] = useState(true);
    return (
        <div className={styles.mainContainer}>
            <div className={styles.headerAne}>
                <Image src={logoGovco} alt="govcologo" width={200} height={47} />
            </div>
            <div className={styles.signinContainer}>
                <Image src={logo} alt="logo" width={118} height={144} />
                <div className={styles.titleContainer}>
                    <p>Plataforma de sensado espectral</p>
                </div>
                <form action={signInWithCredentials} className={styles.signInForm}>
                    <label>
                        <p>Correo electrónico</p>
                        <input className={styles.input} 
                            name="email" 
                            type="email" 
                            placeholder='Escribe el correo de administrador'
                            required
                        />
                    </label>
                    <label>
                        <p>Contraseña</p>
                        <input className={styles.input} 
                            name="password" 
                            type={showPassword?"password":"text"} 
                            placeholder='Escribe la contraseña' 
                            required
                        />
                        <div className={styles.showContainer}>
                            {showPassword ?
                                <p onClick={()=>{setShowPassword(!showPassword)}} className={styles.show}>Mostrar contraseña</p>
                                :
                                <p onClick={()=>{setShowPassword(!showPassword)}} className={styles.show}>Ocultar contraseña</p>
                            }
                        </div>
                    </label>
                    <input className='buttonPrimary' type={"submit"} value={'Continuar como administrador'} />
                </form>
                <p>No eres administrador?&nbsp;
                    <Link href='/auth/signIn' className={styles.link}>ingresa con un correo ANE</Link>
                </p>
                <p>
                    <Link href='/auth/new-user' className={styles.link}>¿Olvidaste tu contraseña?</Link>
                </p>
            </div>
        </div>
    )
}