import {
  Skia,
  Font as RNSFont,
  Typeface as RNSTypeface,
} from '@shopify/react-native-skia';

import {
  IFont,
  ITypeface,
  IFontStyle,
  ITextStyle,
  ITextShadow,
  IParagraphStyle,
  ITypefaceFactory,
  ITextFontFeatures,
  ITypefaceFontProvider,
  ITypefaceFontProviderFactory,
} from 'canvaskit-types';
import { Colors } from './constants';
import {
  Color,
  Matrix,
  TextAlign,
  StrutStyle,
  TextBaseline,
  TextDirection,
  DecorationStyle,
  TextHeightBehavior,
} from './types';

export class JSEmbindObject {
  _isDeleted = false;

  clone() {
    return this;
  }

  delete() {
    this._isDeleted = false;
  }

  deleteAfter() {
    throw new Error('JSEmbindObject.deleteAfter not implemented!');
  }

  isAliasOf(other: any) {
    return this === other;
  }

  isDeleted() {
    return this._isDeleted;
  }
}

export function toRNSMatrix(m?: number[]): Matrix | undefined {
  if (!m) {
    return undefined;
  }

  const r = Skia.Matrix();

  r.set(0, m[0]);
  r.set(1, m[1]);
  r.set(2, m[2]);
  r.set(3, m[3]);
  r.set(4, m[4]);
  r.set(5, m[5]);
  r.set(6, m[6]);
  r.set(7, m[7]);
  r.set(8, m[8]);

  return r;
}

export class TextStyleNative implements ITextStyle<Color> {
  backgroundColor?: Color;
  color?: Color = Colors.WHITE;
  decoration?: number;
  decorationColor?: Color;
  decorationThickness?: number;
  decrationStyle?: DecorationStyle;
  fontFamilies?: string[] = ['system'];
  fontFeatures?: ITextFontFeatures[];
  fontSize?: number = 14;
  fontStyle?: IFontStyle;
  foregroundColor?: Color;
  heightMultiplier?: number;
  halfLeading?: boolean;
  letterSpacing?: number;
  locale?: string;
  shadows?: ITextShadow<Color>[];
  textBaseline?: TextBaseline;
  wordSpacing?: number;

  constructor(ts: ITextStyle<Color>) {
    for (const [key, value] of Object.entries(ts)) {
      this[key as keyof TextStyleNative] = value;
    }
  }
}

export class ParagraphStyleNative implements IParagraphStyle<Color> {
  disableHinting?: boolean;
  ellipsis?: string;
  heightMultiplier?: number;
  maxLines?: number;
  strutStyle?: StrutStyle;
  textAlign?: TextAlign;
  textDirection?: TextDirection;
  textHeightBehavior?: TextHeightBehavior;
  textStyle?: TextStyleNative;

  constructor(ps: IParagraphStyle<Color>) {
    for (const [key, value] of Object.entries(ps)) {
      this[key as keyof ParagraphStyleNative] = value;
    }
  }
}

export class FontNative extends JSEmbindObject implements IFont {
  private _font: RNSFont;
  private _typeface: RNSTypeface;

  constructor(face: ITypeface, size?: number) {
    super();

    this._font = Skia.Font(face as unknown as RNSTypeface, size);
    this._typeface = face as unknown as RNSTypeface;
  }

  getFont() {
    return this._font;
  }

  getTypeface(): ITypeface {
    return this._typeface as unknown as ITypeface;
  }
}

export const TypefaceFactoryNative: ITypefaceFactory = {
  MakeFreeTypeFaceFromData(fontData: ArrayBuffer): ITypeface | null {
    const data = Skia.Data.fromBytes(new Uint8Array(fontData));

    return Skia.Typeface.MakeFreeTypeFaceFromData(data) as unknown as ITypeface;
  },
};

export class TypefaceFontProviderNative implements ITypefaceFontProvider {
  public typefaces: { [name: string]: ITypeface | null } = {};

  registerFont(bytes: ArrayBuffer | Uint8Array, family: string): void {
    this.typefaces[family] =
      TypefaceFactoryNative.MakeFreeTypeFaceFromData(bytes);
  }
}

export const TypefaceFontProviderFactoryNative: ITypefaceFontProviderFactory = {
  Make(): TypefaceFontProviderNative {
    return new TypefaceFontProviderNative();
  },
};
