import { signInWithMicrosoft } from "@/app/actions/auth"
import styles from  "./page.module.css"
import Image from "next/image"
import logoGovco from "@/public/header_govco.png"
import logo from "@/public/logoAne.png"
import Link from "next/link"

export default function SignIn() {
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
                <form action={signInWithMicrosoft}>
                    <input className='buttonPrimary' type={"submit"} value={'Continuar con correo electrónico ANE'} />
                </form>
                <p>O ingresar como&nbsp;
                    <Link href='/auth/admin' className={styles.link}>administrador</Link>
                </p>
            </div>
        </div>
    )
}