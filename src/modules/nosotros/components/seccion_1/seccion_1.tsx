import styles from "./seccion_1.module.css";

export default function Seccion_1() {
  return (
    <section className={styles.seccion}>
      <div className={styles.contenido}>
        <div className={styles.texto}>
          <span className={styles.kicker}>Nuestra empresa</span>
          <h2 className={styles.titulo}>QUIENES SOMOS</h2>
          <p className={styles.subtitulo}>
            Distribucion tecnica y comercial con enfoque en industria,
            construccion y seguridad.
          </p>
          <p className={styles.descripcion}>
            Somos una empresa peruana que se dedica a la distribucion y
            comercializacion de productos para los sectores de la industria:
            mineria, construccion civil, pesquera, agricultura, entre otras
            industrias.
          </p>

          <div className={styles.resumenes}>
            <div className={styles.resumenCard}>
              <strong>Atencion directa</strong>
              <span>Respuesta agil para cotizaciones y consultas comerciales.</span>
            </div>
            <div className={styles.resumenCard}>
              <strong>Cobertura amplia</strong>
              <span>Marcas, herramientas y lineas tecnicas para obra e industria.</span>
            </div>
          </div>

          <div className={styles.contactos}>
            <div className={styles.contactoCard}>
              <span className={styles.icono}>T</span>
              <div>
                <h3>Contactanos</h3>
                <p>976 258 888</p>
              </div>
            </div>

            <div className={styles.contactoCard}>
              <span className={styles.icono}>@</span>
              <div>
                <h3>Correo</h3>
                <p>GorriYon8to@somaaindustrial.pe</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.visualMarco}>
            <div className={styles.visualTag}>
              <strong>Soluciones para obra e industria</strong>
              <span>Atencion comercial con respaldo de marcas lideres.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
