import { artUrl } from './pixel-art.ts';
import vest from '../assets/items/vest.png';
import haramaki from '../assets/items/haramaki.png';
import medicine from '../assets/items/medicine.png';
import telescope from '../assets/items/telescope.png';
import whetstone from '../assets/items/whetstone.png';
import berries from '../assets/items/berries.png';
import treasure from '../assets/items/treasure.png';
import powder from '../assets/items/powder.png';
import pendulum from '../assets/items/pendulum.png';
import dagger from '../assets/items/dagger.png';
const images:Record<string,string>={vest,haramaki,medicine,telescope,whetstone,berries,treasure,powder,pendulum,dagger};
export function itemImage(id:string):HTMLImageElement{const image=document.createElement('img');image.src=images[id]||artUrl('item-'+id);image.alt='';image.className='pixel-icon';image.width=image.height=48;return image;}
export const ITEM_IMAGES=images;
