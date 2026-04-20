import noImage from './NoImagePlaceHolder.png'

export const NO_IMAGE = noImage

export function posterSrc(url: string | null | undefined): string {
  return url && url.trim() ? url : noImage
}

export function onPosterError(e: React.SyntheticEvent<HTMLImageElement>): void {
  const img = e.currentTarget
  img.onerror = null
  img.src = noImage
}
