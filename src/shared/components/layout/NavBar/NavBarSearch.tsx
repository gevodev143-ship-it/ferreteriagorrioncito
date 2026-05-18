import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import style from "./NavBarSearch.module.css";
import { icon } from "../../../../core/icons";

import {
  buscarProductosPorNombre,
  type Producto,
} from "../../../../core/services/producto.service";

const normalizarNombre = (nombre: string | undefined | null, fallback: string) =>
  nombre
    ?.replace(/\.[^.]+$/, "")
    ?.replace(/[_-]+/g, " ")
    ?.trim()
    ?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? fallback;

export const NavBarSearch = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [busquedaNavbar, setBusquedaNavbar] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setBusquedaNavbar(searchParams.get("q") ?? "");
  }, [searchParams]);

  const manejarSubmitBusqueda = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = busquedaNavbar.trim();
    if (!query) {
      navigate("/product");
      return;
    }
    navigate(`/product?q=${encodeURIComponent(query)}`);
  };

  return (
    <form className={style.searchBox} onSubmit={manejarSubmitBusqueda}>
      <button type="submit" className={style.searchButton} aria-label="Buscar productos">
        {icon.iconLupa({ className: style.modalLupa })}
      </button>
      <input
        type="text"
        placeholder="Buscar productos, categorías y marcas"
        className={style.searchInput}
        value={busquedaNavbar}
        onChange={(e) => setBusquedaNavbar(e.target.value)}
      />
    </form>
  );
};