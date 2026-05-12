import style from "./seccion_8.module.css";

export default function Seccion_8() {
  return (
    <div className={style.seccion7}>
      <span>- Nuestro Impacto -</span>
      <div className={style.Parrafo1}>
        
        {parte1("Constructoras",500)}
        {parte1("Millones en cotizaciones",200000000)}
        {parte1("Entregas Exitosas",5000)}
        
        {/*  <div>  
          +500<p>Constructoras</p>
        </div>
        <div>
          +$200M <p>Millones en cotizaciones</p>
        </div>
        <div>
          +5.0K<p>Entregas Exitosas</p>
        </div> */}
      </div>
    </div>
  );
};

function parte1(valor: string, numero: number) {
  return (
    <div className={style.item}>
      <span className={style.numero}>
        +{formatearNumero(numero)}
      </span>
      <p className={style.texto}>{valor}</p>
    </div>
  );
}

function formatearNumero(numero: number): string {
  if (numero >= 1_000_000) {
    return `${numero / 1_000_000}M`;
  } else if (numero >= 1_000) {
    return `${numero / 1_000}K`;
  }
  return numero.toString();
}
// export default Seccion_8;

