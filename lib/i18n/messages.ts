import { en } from "./messages/en";
import { zhCN } from "./messages/zh-CN";
import { zhTW } from "./messages/zh-TW";

export type Locale = "en" | "zh-CN" | "zh-TW";

type DeepString<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: DeepString<T[K]> }
    : never;

export type Messages = DeepString<typeof en>;

export const dictionaries: Record<Locale, Messages> = {
  en,
  "zh-CN": zhCN as DeepString<typeof zhCN>,
  "zh-TW": zhTW as DeepString<typeof zhTW>,
};

export const localeLabels: Record<Locale, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
};

export const defaultLocale: Locale = "en";

export const locales: Locale[] = ["en", "zh-CN", "zh-TW"];
