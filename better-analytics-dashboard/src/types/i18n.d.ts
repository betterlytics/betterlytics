import { en } from "@/locale/dictionary/en";

type LeafKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${LeafKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type LocalizationKeys = LeafKeyOf<typeof en>;
export type MessageSchema = typeof en;
