/**
 * Pure sizing/navigation primitives for the site-wide article image lightbox.
 * 100% means fitted to the available viewport, including upscaling tiny screenshots.
 */
export const MIN_LIGHTBOX_ZOOM=1;
export const MAX_LIGHTBOX_ZOOM=5;
export function clampLightboxZoom(value){
 if(!Number.isFinite(value))return MIN_LIGHTBOX_ZOOM;
 return Math.min(MAX_LIGHTBOX_ZOOM,Math.max(MIN_LIGHTBOX_ZOOM,value));
}
export function cycleLightboxIndex(current,delta,total){
 if(!Number.isInteger(total)||total<=0)return -1;
 return ((current+delta)%total+total)%total;
}
export function fitLightboxImage(naturalWidth,naturalHeight,viewportWidth,viewportHeight,zoom=1){
 if(![naturalWidth,naturalHeight,viewportWidth,viewportHeight].every(
  n=>Number.isFinite(n)&&n>0))return null;
 const scale=Math.min(viewportWidth/naturalWidth,viewportHeight/naturalHeight);
 const z=clampLightboxZoom(zoom);
 return {
  width:Math.max(1,Math.round(naturalWidth*scale*z)),
  height:Math.max(1,Math.round(naturalHeight*scale*z)),
 };
}
