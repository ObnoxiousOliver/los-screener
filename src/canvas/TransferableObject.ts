export interface JsonObject {
  [key: string]: JsonValue
}

export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject

export abstract class TransferableObject {
  abstract toJSON (): JsonObject
  abstract fromJSON (json: JsonObject): void
}