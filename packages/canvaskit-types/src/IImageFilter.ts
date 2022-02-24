import type { IColorFilter } from './misc';
import type { EnumEntity } from './Enums';
import type { IShader } from './IShader';

export interface IImageFilter {}

export interface IImageFilterFactory<IColor> {
  MakeShader(shader: IShader): IImageFilter;

  MakeArithmetic(
    k1: number,
    k2: number,
    k3: number,
    k4: number,
    enforcePMColor: boolean,
    background: IImageFilter | null,
    foreground: IImageFilter | null,
  ): IImageFilter;

  MakeErode(
    radiusX: number,
    radiusY: number,
    input: IImageFilter | null,
  ): IImageFilter | null;

  MakeOffset(dx: number, dy: number, input: IImageFilter | null): IImageFilter;

  MakeBlend(
    blendMode: EnumEntity,
    background: IImageFilter,
    foreground: IImageFilter,
  ): IImageFilter;

  MakeDropShadow(
    dx: number,
    dy: number,
    sigmaX: number,
    sigmaY: number,
    color: IColor,
    input: IImageFilter | null,
  ): IImageFilter;

  MakeDropShadowOnly(
    dx: number,
    dy: number,
    sigmaX: number,
    sigmaY: number,
    color: IColor,
    input: IImageFilter | null,
  ): IImageFilter;

  MakeBlur(
    sigmaX: number,
    sigmaY: number,
    mode: EnumEntity,
    input: IImageFilter | null,
  ): IImageFilter;

  MakeColorFilter(cf: IColorFilter, input: IImageFilter | null): IImageFilter;

  MakeCompose(
    outer: IImageFilter | null,
    inner: IImageFilter | null,
  ): IImageFilter | null;
}
