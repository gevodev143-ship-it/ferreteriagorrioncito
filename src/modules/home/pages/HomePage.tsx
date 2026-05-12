import style from "./HomePage.module.css";
import Seccion_1 from "../components/seccion_1/seccion_1";
import Seccion_2 from "../components/seccion_2/seccion_2";
import Seccion_3 from "../components/seccion_3/seccion_3";
import Seccion_4 from "../components/seccion_4/seccion_4";
import Seccion_5 from "../components/seccion_5/seccion_5";
// import Seccion_6 from "../components/seccion_6/seccion_6";
// import Seccion_7 from "../components/seccion_7/seccion_7";
// import Seccion_8 from "../components/seccion_8/seccion_8";

export default function HomePage() {
    return (
        <div className={style.contenidoHome}>
            <Seccion_1/>
            <Seccion_2/> 
            <Seccion_3/> 
            <Seccion_4/>
            <Seccion_5/>
            {/* <Seccion_6/> */}
            {/* <Seccion_7/> */}
            {/* <Seccion_8/> */}
        </div>
        
    );
}