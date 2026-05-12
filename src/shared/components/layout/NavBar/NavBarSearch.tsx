import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import style from "./NavBarSearch.module.css";
import { icon } from "../../../../core/icons";

import {
  listarCategorias,
  type Categoria,
} from "../../../../core/services/categoria.service";

import {
  listarMarcas,
  type Marca,
} from "../../../../core/services/marca.service";

export const NavBarSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [busquedaNavbar, setBusquedaNavbar] = useState(
    searchParams.get("q") ?? ""
  );

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);

  useEffect(() => {
    setBusquedaNavbar(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [cats, mks] = await Promise.all([
          listarCategorias(),
          listarMarcas(),
        ]);

        setCategorias(cats);
        setMarcas(mks);
      } catch (error) {
        console.error("Error cargando búsqueda:", error);
      }
    };

    cargarDatos();
  }, []);

  const manejarSubmitBusqueda = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    enviarBusqueda();
  };

  const enviarBusqueda = () => {
    const query = busquedaNavbar.trim().toLowerCase();

    const categoria = categorias.find(
      (c) => c.ctgraimgnombre?.toLowerCase() === query
    );

    const marca = marcas.find(
      (m) => m.marcaimgnombre?.toLowerCase() === query
    );

    const params = new URLSearchParams();

    if (categoria) {
      params.set("categoria", categoria.ctgraimgnombre);
    } else if (marca) {
      params.set("marca", marca.marcaimgnombre);
    } else if (query) {
      params.set("q", query);
    }

    const destino = query ? `/product?${params.toString()}` : "/product";

    navigate(destino);
  };

  return (
    <form className={style.searchBox} onSubmit={manejarSubmitBusqueda}>
      <button
        type="submit"
        className={style.searchButton}
        aria-label="Buscar productos"
      >
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