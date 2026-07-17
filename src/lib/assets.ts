import { STORAGE_URL } from './supabase';
import { isDemo } from './data';

/**
 * Imagens da planta e das camadas técnicas.
 * No modo demo usa os SVGs locais em /public; no modo real, o Storage do Supabase.
 */
export function plantaAssets() {
  if (isDemo()) {
    return {
      base: '/planta-base.svg',
      hidraulica: '/camada-hidraulica.svg',
      eletrica: '/camada-eletrica.svg',
      clima: '/camada-clima.svg',
    };
  }
  return {
    base: `${STORAGE_URL}/planta%20base.png`,
    hidraulica: `${STORAGE_URL}/hidraulica%20(2).jpg`,
    eletrica: `${STORAGE_URL}/eletrica.jpg`,
    clima: `${STORAGE_URL}/climatizaca.jpg`,
  };
}
