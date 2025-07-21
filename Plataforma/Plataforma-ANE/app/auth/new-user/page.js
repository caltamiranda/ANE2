'use client';

import styles from  "./page.module.css"
import Image from "next/image"
import logoGovco from "@/public/header_govco.png"
import logo from "@/public/logoAne.png"
import Link from "next/link"
import { useState, useEffect } from "react";
import { registerUser } from "@/lib/register";
import { useRouter } from 'next/navigation';

export default function NewUser() {
    const [showPassword, setShowPassword] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    const at = "kefdyn-0qyZso-dymjig";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (accessToken===at){
            try {
                await registerUser(email, password);
                alert('Usuario registrado correctamente');
                router.push('/auth/admin');
            } catch (error) {
                setError('Error en el registro', error);
            }
        }
        else{
            setError('Token de acceso incorrecto');
        }
    };

    useEffect(() => {
        if (accessToken===at){
            setError(null);
            setShowForm(true);
        } else if (accessToken!=='' && accessToken!==at) {
            setError('Token de acceso incorrecto');
            setShowForm(false);
        } else if (accessToken==='') {
            setError(null);
            setShowForm(false);
        }
    },[accessToken]);

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

                <form className={styles.signInForm}>
                    <label>
                        <p>Token de acceso</p>
                        <input className={styles.input} 
                            name="accesToken" 
                            type="text" 
                            placeholder='Escribe el token de acceso'
                            onChange={(e) => setAccessToken(e.target.value)} 
                            required
                        />
                    </label>
                    {error && <p>{error}</p>}
                </form>
                {showForm &&
                <form onSubmit={handleSubmit} className={styles.signInForm}>
                    <label>
                        <p>Correo electrónico</p>
                        <input className={styles.input} 
                            name="email" 
                            type="email" 
                            placeholder='Escribe el correo de administrador'
                            onChange={(e) => setEmail(e.target.value)} 
                            required
                        />
                    </label>
                    <label>
                        <p>Contraseña</p>
                        <input className={styles.input} 
                            name="password" 
                            type={showPassword?"password":"text"} 
                            placeholder='Escribe la contraseña' 
                            onChange={(e) => setPassword(e.target.value)}
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
                    {error && <p>{error}</p>}
                    <button className='buttonPrimary' type="submit">
                        Crear administrador
                    </button>
                </form>
                }
                <p>
                    <Link href='/auth/admin' className={styles.link}>Volver</Link>
                </p>
            </div>
        </div>
    )
}