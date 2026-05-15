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

  const [busquedaNavbar, setBusquedaNavbar] = useState(
    searchParams.get("q") ?? ""
  );

  useEffect(() => {
    setBusquedaNavbar(searchParams.get("q") ?? "");
  }, [searchParams]);

  const manejarSubmitBusqueda = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await enviarBusqueda();
  };

  const enviarBusqueda = async () => {
    const query = busquedaNavbar.trim();

    if (!query) {
      navigate("/product");
      return;
    }

    try {
      const resultados: Producto[] = await buscarProductosPorNombre(query);

      if (resultados.length > 0) {
        // ── Encontró productos: armar params con q + categorías + marcas ──
        const params = new URLSearchParams();
        params.set("q", query);

        const categoriasSet = new Set<string>();
        const marcasSet = new Set<string>();

        for (const producto of resultados) {
          const cat = normalizarNombre(producto.categoria?.ctgraimgnombre, "");
          const mar = normalizarNombre(producto.marca?.marcaimgnombre, "");
          if (cat) categoriasSet.add(cat);
          if (mar) marcasSet.add(mar);
        }

        if (categoriasSet.size > 0) params.set("categorias", [...categoriasSet].join(","));
        if (marcasSet.size > 0) params.set("marcas", [...marcasSet].join(","));

        navigate(`/product?${params.toString()}`);
        return;
      }

      // ── Sin resultados como producto: buscar si coincide con alguna marca ──
      const queryLower = query.toLowerCase();

      // Buscar en marcas: reutilizamos una búsqueda amplia y filtramos por nombre de marca
      const porMarca: Producto[] = await buscarProductosPorNombre(""); // traemos todos
      // Nota: si buscarProductosPorNombre("") no devuelve todos, ajusta según tu service
      // Alternativa limpia: usa un servicio dedicado listarProductos() que ya tienes en seccion_3

      const marcasEncontradas = new Set<string>();
      const categoriasDeMarcos = new Set<string>();

      for (const producto of porMarca) {
        const mar = normalizarNombre(producto.marca?.marcaimgnombre, "");
        if (mar.toLowerCase().includes(queryLower)) {
          marcasEncontradas.add(mar);
          const cat = normalizarNombre(producto.categoria?.ctgraimgnombre, "");
          if (cat) categoriasDeMarcos.add(cat);
        }
      }

      if (marcasEncontradas.size > 0) {
        const params = new URLSearchParams();
        params.set("marcas", [...marcasEncontradas].join(","));
        navigate(`/product?${params.toString()}`);
        return;
      }

      // ── Sin coincidencia en marcas: buscar si coincide con alguna categoría ──
      const categoriasEncontradas = new Set<string>();

      for (const producto of porMarca) {
        const cat = normalizarNombre(producto.categoria?.ctgraimgnombre, "");
        if (cat.toLowerCase().includes(queryLower)) {
          categoriasEncontradas.add(cat);
        }
      }

      if (categoriasEncontradas.size > 0) {
        const params = new URLSearchParams();
        params.set("categorias", [...categoriasEncontradas].join(","));
        navigate(`/product?${params.toString()}`);
        return;
      }

      // ── Nada encontrado: navegar con q para que Seccion_3 muestre "sin resultados" ──
      navigate(`/product?q=${encodeURIComponent(query)}`);

    } catch (error) {
      console.error("Error en búsqueda navbar:", error);
      navigate(`/product?q=${encodeURIComponent(query)}`);
    }
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