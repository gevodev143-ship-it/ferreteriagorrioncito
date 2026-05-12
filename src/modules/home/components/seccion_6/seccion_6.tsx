import { useEffect, useState } from "react";
import style from "./seccion_6.module.css";

const textos = [
  "IE 100 COLEGIO BICENTENARIO Pueto Ocopa, Rio Tambo",
  "AEROPUERTO Jorge Chavez-Lima.",
  "CENTRAL PLAZA Santa Anita-Lima.",
  "COLEGIO BICENTENARIO Junin-Lima.",
  "VILLA PRIMAVERA ILO-Moquegua.",
  "CANAL DE RIEGO SANTA ELENA PAITA-Piura.",
];

const Seccion_6 = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % textos.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={style.seccion5}>
      <div className={style.overlayGlobal}>
        <span>
          Obras <span className={style.construye5}>historicas</span>
        </span>

        <p className={style.descripcion}>Hagamos historia</p>

        <p key={index} className={style.textoDinamico}>
          {textos[index]}
        </p>
      </div>
    </section>
  );
};

export default Seccion_6;
