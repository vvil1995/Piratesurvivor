// Exact user-supplied PNGs. Lazy chunks keep this menu's artwork out of initial loading.
const sources: Record<string, () => Promise<{ default: string }>> = {
  vitality: () => import('../assets/training/01_vitalitat.png'),
  force: () => import('../assets/training/02_forca.png'),
  speed: () => import('../assets/training/03_zancada.png'),
  cooldown: () => import('../assets/training/04_reflexos.png'),
  armor: () => import('../assets/training/05_corassa.png'),
  regeneration: () => import('../assets/training/06_recuperacio.png'),
  magnet: () => import('../assets/training/07_imant.png'),
  experience: () => import('../assets/training/08_aprenentatge.png'),
  fortune: () => import('../assets/training/09_fortuna.png'),
  critical: () => import('../assets/training/10_cop_critic.png'),
  rerolls: () => import('../assets/training/11_canvi_de_cartes.png'),
  bans: () => import('../assets/training/12_veto.png'),
  starter: () => import('../assets/training/13_atac_inicial_i_14_repertori.png'),
};
const loaded = new Map<string, Promise<string>>();
export function trainingIcon(id: string, name: string): HTMLImageElement {
  const key = id === 'repertoire' ? 'starter' : id;
  const image = document.createElement('img');
  image.className = 'training-icon'; image.alt = name; image.width = image.height = 64; image.draggable = false;
  if (!loaded.has(key)) loaded.set(key, sources[key]().then(module => module.default));
  void loaded.get(key)!.then(url => { image.src = url; });
  return image;
}
