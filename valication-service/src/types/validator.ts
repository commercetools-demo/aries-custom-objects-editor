// Types for schema structure
export type AttributeType = 'Boolean' | 'String' | 'Number' | 'Date' | 'Enum' | 'Reference';

export interface EnumValue {
  value: string;
  label: string;
}

export interface ReferenceType {
  by: string;
  type: string;
}

export interface AttributeSchema {
  name: string;
  type: AttributeType;
  set: boolean;
  required: boolean;
  enum?: EnumValue[];
  reference?: ReferenceType;
}

export interface Schema {
  attributes: AttributeSchema[];
}

export interface CustomObject<T = any> {
  id: string;
  container: string;
  key: string;
  value: T;
  version: number;
  createdAt: string;
  lastModifiedAt: string;
}

export interface CustomObjectDraft<T = any> {
  container: string;
  key: string;
  value: T;
}