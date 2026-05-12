import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import style from "./seccion_1.module.css";

const Seccion_1 = () => {

  return (
    <section className={style.main}>
      <div className={style.formulario}>
        <div className={style.titulo}>          
          <h1><b>
            LIBRO DE <br />
            RECLAMACIONES <br />- FERRETERIA GORRIONCITO
          </b></h1>
        </div>

        <form action="" method="post" className={style.formulario1}>
          <span>1. Identificador del Consumidor Reclamante</span>
            <p>Dirección de correo electrónico: *</p>
            <input type="" />
            <p>Nombres y Apellidos: *</p>
            <input type="" />
            <p>Domicilio: *</p>
            <input type="" />
            <p>Tipo de Documento de Identidad: *</p>

            <div className={style.opciones}>
              <label className={style.radioCustom}>
                <input type="radio" name="doc" checked />
                <span className={style.circulo}></span>
                DNI
              </label>

              <label className={style.radioCustom}>
                <input type="radio" name="doc" />
                <span className={style.circulo}></span>
                CE
              </label>
            </div>
            <p>DNI/CE: *</p>
            <input type="" />
            <p>Teléfono: *</p>
            <input type="" />
          <span>2. Detalle de la Reclamación y Pedido del consumidor</span>
            <p>¿Es un reclamo o queja? *</p>
              <div className={style.opciones}>
                <label className={style.radioCustom}>
                  <input type="radio" name="doc" checked />
                  <span className={style.circulo}></span>
                  Reclamo
                </label>
                <label className={style.radioCustom}>
                  <input type="radio" name="doc" checked />
                  <span className={style.circulo}></span>
                  Queja
                </label>
              </div>
              <p>Detalle: *</p>
              <input type="text" name="" id="" />
              <div></div><br />
              <p>(*) Campos obligatorios</p>
              <p>*La formulación del reclamo no impide acudir a otras vias de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.</p>  <br />
              <p>*El proveedor deberá dar respuesta al reclamo en un plazo no mayor a treinta(30) dias calendario, pudiendo ampliar el plazo hasta por trinta(30) dias mas, previa comunicación al consumidor.</p>    <br />
              <p>*El boton "IMPRIMIR" sera habilitado una vez llenado el formulario y se pulse el boton "ENVIAR".</p><br />
              <button type="submit" className={style.enviar}> ENVIAR </button>
        </form>
      </div>
      

    </section>
  );
};

export default Seccion_1;